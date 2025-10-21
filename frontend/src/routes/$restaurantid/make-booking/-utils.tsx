import type { Restaurant } from "../../-components/restaurantType";

export type BookingObj = {
  booking_id: string;
  restaurant_id: string;
  given_name: string;
  family_name: string;
  phone: string;
  email: string;
  party_size: number;
  booking_date: number;
  time_slot: number;
  customer_notes: string;
};

export function parseRestaurantInfo(strontinfo: string) {
  const strontJSON = JSON.parse(strontinfo);
  const parsedStront: Restaurant = {
    id: strontJSON.id,
    name: strontJSON.name,
    description: strontJSON.description,
    locationText: strontJSON.locationText,
    locationUrl: strontJSON.locationUrl,
    frontpageMarkdown: strontJSON.frontpageMarkdown,
    maxPartySize: strontJSON.maxPartySize,
    bookingCapacity: strontJSON.bookingCapacity,
    bookingLength: strontJSON.bookingLength,
    tags: strontJSON.tags,
  };
  return parsedStront;
}

export function timeFromMaskValue(maskvalue: number): string {
  const mins = maskvalue % 2 == 0 ? "00 " : "30 ";
  let hours = "";
  let ampm = "";
  if (maskvalue >= 24) {
    hours =
      maskvalue > 25 ? Math.floor(maskvalue / 2 - 12).toString() + ":" : "12:";
    ampm = "PM";
  } else {
    hours += maskvalue > 1 ? Math.floor(maskvalue / 2).toString() + ":" : "00:";
    ampm = "AM";
  }
  return hours + mins + ampm;
}

export function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
