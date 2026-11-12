-- A combat number identifies a fight within its event.
alter table combats add constraint uk_combat_event_number unique (event_id, combat_number);

-- At most one fight in progress per tatami (the live page shows "the" current fight).
create unique index uk_one_in_progress_per_tatami on combats (tatami_id) where status = 'IN_PROGRESS';
