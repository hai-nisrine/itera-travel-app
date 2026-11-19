// The agreed listing fields. Change them HERE only.
import { ACCESSIBILITY_FIELDS } from "../shared/accessibility.js";

export { ACCESSIBILITY_FIELDS };

// Same activities as the trips in data/Itera_PoC_15_Trips_10_Travelers.json
export const ACTIVITIES = [
  "adventure", "beach", "city", "culture", "desert", "food", "hiking",
  "history", "museums", "nature", "photography", "relaxation", "shopping", "stargazing",
];

// "dates" = start_date + duration_days. Accessibility is checked separately (see validateListing.js).
export const REQUIRED_FIELDS = ["destination", "departure_city", "start_date", "duration_days", "price_mad"];

// Names shown to the organizer
export const FIELD_LABELS = {
  destination: "destination",
  departure_city: "departure city",
  start_date: "start date",
  duration_days: "number of days",
  price_mad: "price per person (MAD)",
  accessibility: "accessibility accommodations",
};

// OpenAI strict mode: every object lists ALL its keys as required and allows no extra keys.
// Optional values are nullable instead of left out.
const obj = (properties) => ({
  type: "object",
  properties,
  required: Object.keys(properties),
  additionalProperties: false,
});
const nullable = (type, description) => ({ type: [type, "null"], ...(description && { description }) });
const str = (description) => ({ type: "string", ...(description && { description }) });
const yesNoUnknown = { type: "string", enum: ["yes", "no", "unknown"] };

// The JSON shape the AI must answer with
export const AGENT_RESPONSE_SCHEMA = obj({
  off_topic: { type: "boolean" },
  listing: obj({
    title: nullable("string"),
    destination: nullable("string", "Moroccan city or place the trip goes to"),
    departure_city: nullable("string", "Moroccan city the trip leaves from"),
    start_date: nullable("string", "YYYY-MM-DD"),
    duration_days: nullable("integer"),
    price_mad: nullable("number", "price per person in MAD"),
    activities: { type: "array", items: { type: "string", enum: ACTIVITIES } },
    itinerary: { type: "array", items: obj({ day: { type: "integer" }, plan: str() }) },
    accessibility: obj(Object.fromEntries(ACCESSIBILITY_FIELDS.map((f) => [f, yesNoUnknown]))),
    accessibility_notes: nullable("string", "Extra accessibility details in the organizer's words (matches additional_info)"),
  }),
  // A suggested change must explain what is wrong AND how it affects travelers (eval sheet C3)
  suggestions: {
    type: "array",
    items: obj({
      field: str(),
      problem: str("what is wrong"),
      suggested_change: str(),
      impact_on_travelers: str("how this affects travelers, especially disabled travelers"),
    }),
  },
  questions: { type: "array", items: obj({ field: str(), question: str() }) },
});