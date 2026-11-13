import type { CombatStatus, Role } from "@/types/domain";

/** French labels for API enum values shown to users. */
export const roleLabels: Record<Role, string> = {
  USER: "Membre",
  ADMIN: "Administrateur"
};

export const combatStatusLabels: Record<CombatStatus, string> = {
  UPCOMING: "À venir",
  IN_PROGRESS: "En cours",
  FINISHED: "Terminé"
};
