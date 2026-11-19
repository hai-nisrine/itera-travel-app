import fs from 'node:fs';
import { ACCESSIBILITY_FIELDS } from '../shared/accessibility.js';

const fixtures = JSON.parse(fs.readFileSync(new URL('../data/Itera_PoC_15_Trips_10_Travelers.json', import.meta.url), 'utf8'));
export const trips = fixtures.agency_trip_listings;
export const travelers = fixtures.travelers;

export function validDate(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(value + 'T00:00:00Z');
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
}
const day = (s) => validDate(s) ? Date.parse(s + 'T00:00:00Z') / 86400000 : NaN;

export function validTraveler(traveler) {
  if (!traveler || !traveler.user || !traveler.accessibility_profile || !traveler.preferences) return false;
  const { user, accessibility_profile: a, preferences: p } = traveler;
  if (!Number.isInteger(user.id) || user.id < 1 || a.user_id !== user.id ||
      typeof user.name !== 'string' || !user.name.trim() ||
      typeof user.email !== 'string' || !user.email.includes('@') ||
      typeof user.password_hash !== 'string' || !user.password_hash ||
      ACCESSIBILITY_FIELDS.some(field => typeof a[field] !== 'boolean') ||
      (a.additional_info != null && typeof a.additional_info !== 'string')) return false;
  if (!Number.isFinite(p.budget_max_mad) || p.budget_max_mad < 0 ||
      !Number.isInteger(p.max_duration_days) || p.max_duration_days < 1 ||
      !validDate(p.available_from) || !validDate(p.available_to) ||
      day(p.available_from) > day(p.available_to) ||
      !Array.isArray(p.interests) || p.interests.some(x => typeof x !== 'string') ||
      p.departure_country_required !== 'Morocco') return false;
  return true;
}

// Trip data comes from agency listings. Only wheelchair_access is an unambiguous
// legacy listing synonym. Other 6 accommodations require explicit listing evidence;
// do not infer visual assistance, a trained personal assistant, etc. from assistance_available.
const listingFields = {
  wheelchair_mobility_accessible: 'wheelchair_access',
  visual_assistance: 'visual_assistance',
  deaf_sign_support: 'deaf_sign_support',
  sensory_friendly: 'sensory_friendly',
  trained_personal_assistant: 'trained_personal_assistant',
  service_animal_support: 'service_animal_support',
  medical_equipment_storage: 'medical_equipment_storage',
};

export function eligible(trip, traveler) {
  if (!trip || !validTraveler(traveler)) return false;
  const { accessibility_profile: a, preferences: p } = traveler;
  if (!Number.isFinite(trip.price_mad) || trip.price_mad < 0 || trip.price_mad > p.budget_max_mad ||
      !Number.isInteger(trip.duration_days) || trip.duration_days < 1 || trip.duration_days > p.max_duration_days) return false;
  const start = day(trip.start_date);
  if (!Number.isFinite(start) || start < day(p.available_from) ||
      start + trip.duration_days - 1 > day(p.available_to) ||
      trip.departure_country !== p.departure_country_required) return false;
  for (const field of ACCESSIBILITY_FIELDS) {
    if (a[field] === true && trip.accessibility?.[listingFields[field]] !== 'yes') return false;
  }
  // Non-structured needs in additional_info must be reviewed by a human; there
  // is no supported matching field for them in the existing agency fixture.
  if (a.additional_info?.trim()) return false;
  return true;
}
export const filterTrips = (traveler, items = trips) => items.filter(trip => eligible(trip, traveler));
export function baselineRank(traveler, items) {
  const interests = traveler.preferences.interests;
  return [...items].sort((a, b) => {
    const score = trip => trip.activities.filter(activity => interests.includes(activity)).length;
    return score(b) - score(a) || a.price_mad - b.price_mad || a.id.localeCompare(b.id);
  }).slice(0, 3);
}
export function validateRank(ids, allowed) {
  if (!Array.isArray(ids) || ids.length > 3 || new Set(ids).size !== ids.length ||
      ids.some(id => typeof id !== 'string' || !allowed.some(trip => trip.id === id))) {
    throw Error('LLM returned invalid or ineligible trip IDs');
  }
  return ids.map(id => allowed.find(trip => trip.id === id));
}
export function explanation(trip, traveler) {
  const interests = trip.activities.filter(activity => traveler.preferences.interests.includes(activity));
  return `${trip.price_mad} MAD; ${trip.duration_days} days; ` +
    (interests.length ? `shared interests: ${interests.join(', ')}` : 'meets your required filters') + '.';
}
