package com.judoclub.constantine.service;

import com.judoclub.constantine.dto.ImportDtos;
import com.judoclub.constantine.entity.*;
import com.judoclub.constantine.exception.BadRequestException;
import com.judoclub.constantine.exception.ImportValidationException;
import com.judoclub.constantine.repository.AthleteRepository;
import com.judoclub.constantine.repository.CombatRepository;
import com.judoclub.constantine.repository.TatamiRepository;
import lombok.RequiredArgsConstructor;
import org.apache.commons.csv.CSVFormat;
import org.apache.commons.csv.CSVParser;
import org.apache.commons.csv.CSVRecord;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.StringReader;
import java.nio.charset.CharacterCodingException;
import java.nio.charset.CodingErrorAction;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.time.OffsetDateTime;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.*;
import java.util.function.Function;
import java.util.stream.Collectors;

/**
 * Imports an event's fight schedule from CSV (UTF-8, ',' or ';', header row).
 * Every row is validated first; if any row is invalid nothing is imported. Athletes are matched
 * case-insensitively on (first name, last name, club) and created when missing.
 */
@Service
@RequiredArgsConstructor
public class CombatImportService {
    public static final List<String> COLUMNS = List.of(
            "combat_number", "tatami_number",
            "a1_first_name", "a1_last_name", "a1_club",
            "a2_first_name", "a2_last_name", "a2_club",
            "weight_category", "age_category", "scheduled_start");
    static final int MAX_ROWS = 2000;
    private static final Set<String> OPTIONAL = Set.of("scheduled_start");
    private static final List<DateTimeFormatter> DATE_FORMATS = List.of(
            DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm"),
            DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm"),
            DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm"));

    private final EventService eventService;
    private final TatamiRepository tatamiRepository;
    private final AthleteRepository athleteRepository;
    private final CombatRepository combatRepository;

    private record AthleteKey(String firstName, String lastName, String club) {
        static AthleteKey of(String first, String last, String club) {
            return new AthleteKey(norm(first), norm(last), norm(club));
        }
        static AthleteKey of(Athlete a) {
            return of(a.getFirstName(), a.getLastName(), a.getClub());
        }
        private static String norm(String s) {
            return s.trim().replaceAll("\\s+", " ").toLowerCase(Locale.ROOT);
        }
    }

    private record AthleteData(String firstName, String lastName, String club) {
        AthleteKey key() { return AthleteKey.of(firstName, lastName, club); }
    }

    private record Row(int line, int number, Tatami tatami, AthleteData a1, AthleteData a2,
                       String weight, String age, OffsetDateTime scheduled) {}

    @Transactional
    public ImportDtos.CombatImportResult importCsv(Long eventId, MultipartFile file) {
        Event event = eventService.getEntity(eventId);
        String content = decode(file);
        List<CSVRecord> records = parse(content);

        Map<Integer, Tatami> tatamisByNumber = tatamiRepository.findByEventIdOrderByNumberAsc(eventId).stream()
                .collect(Collectors.toMap(Tatami::getNumber, Function.identity()));
        Set<Integer> existingNumbers = combatRepository.findByEventIdOrderByCombatNumberAsc(eventId).stream()
                .map(Combat::getCombatNumber).collect(Collectors.toSet());

        List<ImportDtos.RowError> errors = new ArrayList<>();
        List<Row> rows = new ArrayList<>();
        Map<Integer, Integer> numberFirstSeenAt = new HashMap<>();
        for (CSVRecord record : records) {
            int line = (int) record.getRecordNumber() + 1; // header is line 1
            Row row = validate(record, line, tatamisByNumber, existingNumbers, numberFirstSeenAt, errors);
            if (row != null) rows.add(row);
        }
        if (!errors.isEmpty()) {
            throw new ImportValidationException(
                    errors.size() == 1 ? "1 ligne invalide : aucun combat importé" : errors.size() + " lignes invalides : aucun combat importé",
                    errors);
        }

        Map<AthleteKey, Athlete> athletes = new HashMap<>();
        for (Athlete a : athleteRepository.findAll()) athletes.putIfAbsent(AthleteKey.of(a), a);
        int athletesCreated = 0;
        List<Combat> combats = new ArrayList<>();
        for (Row row : rows) {
            Athlete a1 = athletes.get(row.a1().key());
            if (a1 == null) { a1 = createAthlete(row.a1()); athletes.put(row.a1().key(), a1); athletesCreated++; }
            Athlete a2 = athletes.get(row.a2().key());
            if (a2 == null) { a2 = createAthlete(row.a2()); athletes.put(row.a2().key(), a2); athletesCreated++; }
            combats.add(Combat.builder()
                    .event(event).tatami(row.tatami()).athlete1(a1).athlete2(a2)
                    .combatNumber(row.number()).weightCategory(row.weight()).ageCategory(row.age())
                    .status(CombatStatus.UPCOMING).scheduledStartTime(row.scheduled())
                    .build());
        }
        combatRepository.saveAll(combats);
        return new ImportDtos.CombatImportResult(combats.size(), athletesCreated);
    }

    private Athlete createAthlete(AthleteData data) {
        return athleteRepository.save(Athlete.builder()
                .firstName(data.firstName()).lastName(data.lastName()).club(data.club()).build());
    }

    private static String decode(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new BadRequestException("Le fichier est vide");
        }
        try {
            String text = StandardCharsets.UTF_8.newDecoder()
                    .onMalformedInput(CodingErrorAction.REPORT)
                    .onUnmappableCharacter(CodingErrorAction.REPORT)
                    .decode(java.nio.ByteBuffer.wrap(file.getBytes()))
                    .toString();
            return text.startsWith("﻿") ? text.substring(1) : text; // Excel BOM
        } catch (CharacterCodingException e) {
            throw new BadRequestException("Le fichier doit être encodé en UTF-8 (dans Excel : « CSV UTF-8 »)");
        } catch (IOException e) {
            throw new BadRequestException("Impossible de lire le fichier");
        }
    }

    private static List<CSVRecord> parse(String content) {
        String firstLine = content.lines().findFirst().orElse("");
        char delimiter = firstLine.chars().filter(c -> c == ';').count() > firstLine.chars().filter(c -> c == ',').count() ? ';' : ',';
        CSVFormat format = CSVFormat.DEFAULT.builder()
                .setDelimiter(delimiter)
                .setHeader()
                .setSkipHeaderRecord(true)
                .setIgnoreEmptyLines(true)
                .setTrim(true)
                .setIgnoreHeaderCase(true)
                .get();
        try (CSVParser parser = CSVParser.builder().setReader(new StringReader(content)).setFormat(format).get()) {
            Set<String> header = parser.getHeaderMap().keySet().stream()
                    .map(h -> h.trim().toLowerCase(Locale.ROOT)).collect(Collectors.toSet());
            List<String> missing = COLUMNS.stream().filter(c -> !OPTIONAL.contains(c) && !header.contains(c)).toList();
            if (!missing.isEmpty()) {
                throw new BadRequestException("Colonnes manquantes : " + String.join(", ", missing)
                        + ". En-tête attendu : " + String.join(delimiter == ';' ? ";" : ",", COLUMNS));
            }
            List<CSVRecord> records = parser.getRecords();
            if (records.isEmpty()) throw new BadRequestException("Le fichier ne contient aucun combat");
            if (records.size() > MAX_ROWS) throw new BadRequestException("Trop de lignes (maximum " + MAX_ROWS + ")");
            return records;
        } catch (IOException | IllegalArgumentException | IllegalStateException e) {
            throw new BadRequestException("Fichier CSV illisible : " + Optional.ofNullable(e.getMessage()).orElse("format invalide"));
        }
    }

    private Row validate(CSVRecord r, int line, Map<Integer, Tatami> tatamis, Set<Integer> existingNumbers,
                         Map<Integer, Integer> numberFirstSeenAt, List<ImportDtos.RowError> errors) {
        List<String> problems = new ArrayList<>();
        Integer number = positiveInt(get(r, "combat_number"), "combat_number", problems);
        Integer tatamiNumber = positiveInt(get(r, "tatami_number"), "tatami_number", problems);

        Tatami tatami = null;
        if (tatamiNumber != null) {
            tatami = tatamis.get(tatamiNumber);
            if (tatami == null) problems.add("tapis " + tatamiNumber + " inexistant pour cet événement");
        }
        if (number != null) {
            if (existingNumbers.contains(number)) {
                problems.add("le combat n°" + number + " existe déjà pour cet événement");
            } else if (numberFirstSeenAt.containsKey(number)) {
                problems.add("numéro de combat " + number + " en double (déjà ligne " + numberFirstSeenAt.get(number) + ")");
            } else {
                numberFirstSeenAt.put(number, line);
            }
        }

        AthleteData a1 = athlete(r, "a1", "athlète 1", problems);
        AthleteData a2 = athlete(r, "a2", "athlète 2", problems);
        if (a1 != null && a2 != null && a1.key().equals(a2.key())) {
            problems.add("un athlète ne peut pas combattre contre lui-même");
        }
        String weight = text(r, "weight_category", "catégorie de poids", 40, problems);
        String age = text(r, "age_category", "catégorie d'âge", 80, problems);
        OffsetDateTime scheduled = scheduled(get(r, "scheduled_start"), problems);

        if (!problems.isEmpty()) {
            errors.add(new ImportDtos.RowError(line, String.join(" ; ", problems)));
            return null;
        }
        return new Row(line, number, tatami, a1, a2, weight, age, scheduled);
    }

    private static String get(CSVRecord r, String column) {
        return r.isMapped(column) && r.isSet(column) ? r.get(column).trim() : "";
    }

    private static Integer positiveInt(String value, String column, List<String> problems) {
        if (value.isEmpty()) { problems.add(column + " manquant"); return null; }
        try {
            int n = Integer.parseInt(value);
            if (n > 0) return n;
        } catch (NumberFormatException ignored) {
            // reported below
        }
        problems.add(column + " doit être un entier positif (« " + value + " »)");
        return null;
    }

    private static String text(CSVRecord r, String column, String label, int max, List<String> problems) {
        String value = get(r, column);
        if (value.isEmpty()) { problems.add(label + " manquant(e)"); return null; }
        if (value.length() > max) { problems.add(label + " trop long(ue) (max " + max + ")"); return null; }
        return value;
    }

    private static AthleteData athlete(CSVRecord r, String prefix, String label, List<String> problems) {
        int before = problems.size();
        String first = text(r, prefix + "_first_name", "prénom " + label, 100, problems);
        String last = text(r, prefix + "_last_name", "nom " + label, 100, problems);
        String club = text(r, prefix + "_club", "club " + label, 160, problems);
        return problems.size() == before ? new AthleteData(first, last, club) : null;
    }

    private static OffsetDateTime scheduled(String value, List<String> problems) {
        if (value.isEmpty()) return null;
        for (DateTimeFormatter format : DATE_FORMATS) {
            try {
                return LocalDateTime.parse(value, format).atZone(EventService.CLUB_ZONE).toOffsetDateTime();
            } catch (DateTimeParseException ignored) {
                // try next format
            }
        }
        problems.add("scheduled_start invalide (« " + value + " », attendu AAAA-MM-JJ HH:MM)");
        return null;
    }
}
