// The 7 accessibility columns of the accessibility_profiles table.
// Both agents import from here so they always use the same names.
// Traveler profile: true / false.   Trip listing: "yes" / "no" / "unknown".


export const ACCESSIBILITY_FIELDS = [
  "wheelchair_mobility_accessible",
  "visual_assistance",
  "deaf_sign_support",
  "sensory_friendly",
  "trained_personal_assistant",
  "service_animal_support",
  "medical_equipment_storage",
];