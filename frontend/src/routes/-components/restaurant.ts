export type Restaurant = {
  id: string;
  name: string;
  description: string | null;
  locationText: string | null;
  locationUrl: string | null;
  frontpageMarkdown: string | null;
  maxPartySize: number;
  bookingCapacity: number;
  bookingLength: number;
  tags: string[];
};
