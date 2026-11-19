// Plain-code checks

import { REQUIRED_FIELDS, ACCESSIBILITY_FIELDS, ACTIVITIES } from "./listingSchema.js";

const isEmpty = (v) => v === null || v === undefined || v === "" || (Array.isArray(v) && v.length === 0);

// true only for a real calendar date in YYYY-MM-DD format (example: rejects 2026-02-31)
export function isValidDate(value) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

export function validateListing(listing, today) {
  const missing = REQUIRED_FIELDS.filter((f) => isEmpty(listing?.[f]));

  // Accessibility is "missing" when the organizer has not confirmed a single accommodation (all unknown).
  // Fields left "unknown" are never shown as offered, so matching treats them as not available.
  const confirmed = ACCESSIBILITY_FIELDS.filter((f) => ["yes", "no"].includes(listing?.accessibility?.[f]));
  if (confirmed.length === 0) missing.push("accessibility");

  // Problems found by code, written as suggestions (what is wrong + how it affects travelers)
  const problems = [];
  const add = (field, problem, suggested_change, impact_on_travelers) =>
    problems.push({ field, problem, suggested_change, impact_on_travelers, source: "code" });

  if (listing?.start_date && !isValidDate(listing.start_date))
    add("start_date", `The start date "${listing.start_date}" is not a valid date.`, "Give the exact start date.",
      "Travelers cannot see when the trip happens, so they cannot plan or book it.");
  else if (listing?.start_date && listing.start_date < today)
    add("start_date", `The start date ${listing.start_date} is in the past.`, "Use a future start date.",
      "Travelers cannot book a trip that has already started, so the listing would be useless to them.");
  if (listing?.duration_days != null && !(Number.isInteger(listing.duration_days) && listing.duration_days >= 1))
    add("duration_days", "The number of days must be a whole number of at least 1.", "Give the real number of days.",
      "Travelers rely on the duration to plan time off, care and medication.");
  if (listing?.price_mad != null && !(Number.isFinite(listing.price_mad) && listing.price_mad > 0))
    add("price_mad", "The price must be more than 0 MAD.", "Give the real price per person.",
      "Travelers filter trips by budget; a wrong price shows the trip to the wrong people.");
  const lastPlannedDay = Math.max(0, ...(listing?.itinerary ?? []).map((d) => d.day));
  if (Number.isInteger(listing?.duration_days) && lastPlannedDay > listing.duration_days)
    add("itinerary", `The itinerary has ${lastPlannedDay} days but the trip lasts ${listing.duration_days}.`,
      "Make the number of days and the itinerary match.", "Travelers could plan for the wrong trip length.");
  const badActivities = (listing?.activities ?? []).filter((a) => !ACTIVITIES.includes(a));
  if (badActivities.length)
    add("activities", `Unknown activities: ${badActivities.join(", ")}.`, "Use activities from the allowed list.",
      "Travelers search by interest; unknown activities make the trip impossible to find.");

  return { missing, problems, isComplete: missing.length === 0 && problems.length === 0 };
}