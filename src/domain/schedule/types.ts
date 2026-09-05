export type DutyMember = { id: string; name: string; email?: string | null };

export type WeekdaySettings = {
  monday: boolean; tuesday: boolean; wednesday: boolean; thursday: boolean;
  friday: boolean; saturday: boolean; sunday: boolean;
};

export type ScheduleExceptionInput = { date: string; reason?: string };

export type SimulatedAssignment = {
  date: string;
  member1: DutyMember;
  member2: DutyMember;
  cursorBefore: number;
};
