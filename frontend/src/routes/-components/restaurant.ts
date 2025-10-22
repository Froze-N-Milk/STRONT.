export type Restaurant = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  description: string | null;
  locationText: string | null;
  locationUrl: string | null;
  frontpageMarkdown: string | null;
  maxPartySize: number;
  bookingCapacity: number;
  bookingLength: number;
  tags: string[];
};
