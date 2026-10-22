import { MINISTRY_STATUS_CATALOGUE, MINISTRY_STATUSES, type MinistryStatus } from "./catalogue";

// What a person can actually pick, derived from the catalogue rather than
// listed by hand: a status with its own hours is one choice, a status
// offering a few is one choice per number. Today that comes to five —
// publisher, auxiliary 15, auxiliary 30, regular auxiliary, regular
// pioneer — and adding a number to the catalogue adds a row to the sheet
// with nothing else to change.
export type MinistryStatusChoice = {
  // The only thing that travels from the sheet to the server. Hours are
  // NOT sent: they are looked up here from the id, so a crafted request
  // can name a choice that exists or nothing at all, and cannot invent
  // "publisher, 50 hours".
  id: string;
  status: MinistryStatus;
  hours: number | null;
};

const choiceId = (status: MinistryStatus, hours: number | null): string =>
  hours === null ? status : `${status}:${hours}`;

export const MINISTRY_STATUS_CHOICES: readonly MinistryStatusChoice[] = MINISTRY_STATUSES
  .flatMap((status) => {
    const { goal } = MINISTRY_STATUS_CATALOGUE[status];

    if (goal.kind === "choice") {
      return goal.hours.map((hours) => ({ id: choiceId(status, hours), status, hours }));
    }

    const hours = goal.kind === "fixed" ? goal.hours : null;

    return [{ id: choiceId(status, hours), status, hours }];
  });

export const findMinistryStatusChoice = (id: string): MinistryStatusChoice | null =>
  MINISTRY_STATUS_CHOICES.find((choice) => choice.id === id) ?? null;

// Which row the sheet opens with, given what the person is on now.
//
// The hours are part of the question only where the catalogue offers a
// choice of them: an auxiliary pioneer on 15 and one on 30 are two
// different rows, while a publisher who has set a goal of their own is
// still the publisher row — their number is theirs, not one of ours.
export const ministryStatusChoiceFor = (
  status: MinistryStatus,
  hours: number | null,
): MinistryStatusChoice | null => {
  const { goal } = MINISTRY_STATUS_CATALOGUE[status];

  if (goal.kind === "choice") {
    return MINISTRY_STATUS_CHOICES.find(
      (choice) => choice.status === status && choice.hours === hours,
    ) ?? null;
  }

  return MINISTRY_STATUS_CHOICES.find((choice) => choice.status === status) ?? null;
};
