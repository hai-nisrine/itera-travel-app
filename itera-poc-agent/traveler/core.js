import fs from 'node:fs';


const fixtures = JSON.parse(fs.readFileSync(new URL('../data/Itera_PoC_15_Trips_10_Travelers.json',import.meta.url)));export const trips = fixtures.agency_trip_listings;
export const travelers = fixtures.travelers;
const mapping = { wheelchair: 'wheelchair_access', accessible_bathroom: 'accessible_bathroom', step_free_transport: 'step_free_transport', needs_assistance: 'assistance_available' };
export function validDate(value) {
    if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
    const date = new Date(value + 'T00:00:00Z');
    return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
}
const day = s => validDate(s) ? Date.parse(s + 'T00:00:00Z') / 86400000 : NaN;
export function eligible(t, p) {
    if (!t || !p || !p.needs || !Number.isFinite(p.budget_max_mad) || p.budget_max_mad < 0 || !p.available_from || !p.available_to || !Number.isInteger(p.max_duration_days) || p.max_duration_days < 1) return false;
    if (!Number.isFinite(t.price_mad) || t.price_mad < 0 || t.price_mad > p.budget_max_mad || !Number.isInteger(t.duration_days) || t.duration_days < 1 || t.duration_days > p.max_duration_days) return false;
    const start = day(t.start_date), from = day(p.available_from), to = day(p.available_to);
    if (![start, from, to].every(Number.isFinite) || start < from || start + t.duration_days - 1 > to) return false;
    if (p.departure_country_required && t.departure_country !== p.departure_country_required) return false;
    for (const [need, field] of Object.entries(mapping)) if (p.needs[need] === true && t.accessibility?.[field] !== 'yes') return false;
    if (Object.keys(mapping).some(k => typeof p.needs[k] !== 'boolean')) return false;
    return true;
}
export function filterTrips(p, items = trips) { return items.filter(t => eligible(t, p)); }
export function baselineRank(p, items) {
    return [...items].sort((a, b) => {
        const score = t => t.activities.filter(x => p.interests?.includes(x)).length;
        return score(b) - score(a) || a.price_mad - b.price_mad || a.id.localeCompare(b.id);
    }).slice(0, 3);
}
export function validateRank(ids, allowed) {
    if (!Array.isArray(ids) || ids.length > 3 || new Set(ids).size !== ids.length || ids.some(x => typeof x !== 'string' || !allowed.some(t => t.id === x))) throw Error('LLM returned invalid or ineligible trip IDs');
    return ids.map(id => allowed.find(t => t.id === id));
}
export function explanation(t, p) { const interests = t.activities.filter(x => p.interests?.includes(x)); return t.price_mad + ' MAD; ' + t.duration_days + ' days; ' + (interests.length ? 'shared interests: ' + interests.join(', ') : 'meets your required filters') + '.'; }
