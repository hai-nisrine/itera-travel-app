// The ONLY way a listing gets published: explicit confirmation + a complete draft (eval sheet constraint 1)


import { validateListing } from "./validateListing.js";

export function confirmListing(listing, { confirmed, today = new Date().toISOString().slice(0, 10) } = {}) {
  if (confirmed !== true) {
    return { published: false, reason: "The organizer has not explicitly confirmed the draft." };
  }
  if (!listing || typeof listing !== "object") {
    return { published: false, reason: "No draft to publish." };
  }
  const { missing, problems } = validateListing(listing, today);
  if (missing.length || problems.length) {
    return { published: false, reason: "The draft is incomplete or has problems.", missing, problems };
  }
  //just for POC, for real app use postgres here
  return { published: true, listing };
}