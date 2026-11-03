export type Role = "USER" | "ADMIN";
export type EventStatus = "UPCOMING" | "LIVE" | "FINISHED";
export type CombatStatus = "UPCOMING" | "IN_PROGRESS" | "FINISHED";

export type User = {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  role: Role;
  profileImageUrl?: string | null;
  createdAt: string;
};

export type Event = {
  id: number;
  title: string;
  description: string;
  imageUrl?: string | null;
  location: string;
  startDatetime: string;
  endDatetime: string;
  organizerName: string;
  status: EventStatus;
};

export type Athlete = {
  id: number;
  firstName: string;
  lastName: string;
  club: string;
  country?: string | null;
  profileImageUrl?: string | null;
};

export type Combat = {
  id: number;
  eventId: number;
  tatamiId: number;
  tatamiNumber: number;
  combatNumber: number;
  athlete1: Athlete;
  athlete2: Athlete;
  weightCategory: string;
  ageCategory: string;
  status: CombatStatus;
  scheduledStartTime?: string | null;
  actualStartTime?: string | null;
  actualEndTime?: string | null;
};

export type Tatami = {
  id: number;
  eventId: number;
  number: number;
  name: string;
  liveUrl?: string | null;
  active: boolean;
};

export type TatamiLive = {
  tatamiId: number;
  number: number;
  name: string;
  liveUrl?: string | null;
  active: boolean;
  currentCombat?: Combat | null;
  upcomingCombats: Combat[];
};

export type EventLive = {
  event: Event;
  tatamis: TatamiLive[];
};
