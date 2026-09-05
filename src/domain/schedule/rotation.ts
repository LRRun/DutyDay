import type { DutyMember } from "./types";

export function selectDutyPair(members: DutyMember[], cursor: number) {
  if (members.length < 2) throw new Error("至少需要 2 名参与值日的成员");
  const normalized = ((cursor % members.length) + members.length) % members.length;
  return {
    member1: members[normalized],
    member2: members[(normalized + 1) % members.length],
    nextCursor: (normalized + 2) % members.length,
    cursorBefore: normalized,
  };
}
