export type Attendance = "attended" | "cancelled" | "pending" | "no-show";

export type Booking = {
  booking_id: string;
  given_name: string;
  family_name: string;
  phone: string;
  email: string;
  party_size: number;
  booking_date: number;
  time_slot: number;
  creation_date: number;
  customer_notes: string;
  restaurant_notes: string;
  attendance: Attendance;
};

export const filterByName = (booking: Booking, searchTerm: string): boolean => {
  if (!searchTerm) {
    return true;
  }

  const fullName = `${booking.given_name} ${booking.family_name}`
    .toLowerCase()
    .trim();

  return fullName.includes(searchTerm.toLowerCase().trim());
};

export const filterByEmail = (
  booking: Booking,
  searchTerm: string,
): boolean => {
  if (!searchTerm) {
    return true;
  }

  return booking.email
    .toLowerCase()
    .trim()
    .includes(searchTerm.toLowerCase().trim());
};

export const filterByPhone = (
  booking: Booking,
  searchTerm: string,
): boolean => {
  if (!searchTerm) {
    return true;
  }

  return booking.phone
    .toLowerCase()
    .trim()
    .startsWith(searchTerm.toLowerCase().trim());
};

export const filterByCustomerNotes = (
  booking: Booking,
  searchTerm: string,
): boolean => {
  if (!searchTerm) {
    return true;
  }

  return booking.customer_notes
    .toLowerCase()
    .trim()
    .includes(searchTerm.toLowerCase().trim());
};

export const filterByRestaurantNotes = (
  booking: Booking,
  searchTerm: string,
): boolean => {
  if (!searchTerm) {
    return true;
  }

  return booking.restaurant_notes
    .toLowerCase()
    .trim()
    .includes(searchTerm.toLowerCase().trim());
};

export const formatDate = (timestamp: number) =>
  new Date(timestamp).toLocaleDateString();
export const formatTimeSlot = (slot: number) => {
  const hours = Math.floor(slot / 2);
  const minutes = (slot % 2) * 30;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
};

export const normaliseDate = (
  dateString: string,
  type: "min" | "max",
): number | null => {
  if (!dateString) return null;

  const timestamp = Date.parse(dateString);
  if (isNaN(timestamp)) return null;

  if (type === "max") {
    return timestamp + 24 * 60 * 60 * 1000 - 1;
  }

  return timestamp;
};

export function filterByDateRange(
  bookingdate: number,
  mindate: string,
  maxdate: string,
) {
  if (mindate != "" && maxdate != "") {
    const mindateParsed = new Date(mindate);
    const maxdateParsed = new Date(maxdate);
    const bookingdateParsed = new Date(bookingdate);
    return (
      mindateParsed <= bookingdateParsed && bookingdateParsed <= maxdateParsed
    );
  } else return true;
}
