import { createFileRoute } from "@tanstack/react-router";
import "./index.css";
import { useEffect, useMemo, useState } from "react";
import {
  type Booking,
  filterByCustomerNotes,
  filterByDateRange,
  filterByEmail,
  filterByName,
  filterByPhone,
  filterByRestaurantNotes,
  formatDate,
  formatTimeSlot,
} from "../helper.ts";

const mockData: Booking[] = [
  {
    booking_id: "11111111-1111-1111-1111-111111111111",
    given_name: "Big",
    family_name: "Missile",
    phone: "0411111111",
    email: "kill@me.lol",
    party_size: 4,
    booking_date: 0,
    time_slot: 3,
    creation_date: 0,
    customer_notes: "pemis",
    restaurant_notes: "asdfhjlk",
    attendance: "pending",
  },
  {
    booking_id: "22222222-2222-2222-2222-222222222222",
    given_name: "Small",
    family_name: "Gun",
    phone: "0422222222",
    email: "kill@you.lol",
    party_size: 5,
    booking_date: 2345987542982,
    time_slot: 14,
    creation_date: 234598754298,
    customer_notes: "asdfhjkl",
    restaurant_notes: "asdfhjlk",
    attendance: "cancelled",
  },
];

function BookingHistoryComponent() {
  const restaurantId = Route.useParams().restaurantid;

  const [nameSearchTerm, setNameSearchTerm] = useState("");
  const [emailSearchTerm, setEmailSearchTerm] = useState("");
  const [phoneSearchTerm, setPhoneSearchTerm] = useState("");
  const [custNotesSearchTerm, setCustNotesSearchTerm] = useState("");
  const [restNotesSearchTerm, setRestNotesSearchTerm] = useState("");
  const [bookingDateRange, setBookingDateRange] = useState({
    min: "",
    max: "",
  });
  const [creationDateRange, setCreationDateRange] = useState({
    min: "",
    max: "",
  });

  const [historyData, setHistoryData] = useState<Booking[] | null>(null);

  useEffect(() => {
    fetch("/api/booking/history/" + restaurantId, {
      method: "GET",
    }).then(async (r) => {
      if (r.status == 200) {
        // console.log(await r.text())
        const result = (await r.json()) as Booking[];

        let initialData: Booking[];

        if (result.length < 1) {
          console.log("Set mock data");
          initialData = [...mockData];
        } else {
          initialData = result;
        }

        setHistoryData(initialData);
      } else {
        setHistoryData(null);
      }
    });
  }, [restaurantId]);

  const filteredAndSortedBookings = useMemo(() => {
    if (historyData == null) {
      return [];
    }

    let filteredData = historyData;

    // Text search filters
    filteredData = filteredData.filter((booking) =>
      filterByName(booking, nameSearchTerm),
    );
    filteredData = filteredData.filter((booking) =>
      filterByEmail(booking, emailSearchTerm),
    );
    filteredData = filteredData.filter((booking) =>
      filterByPhone(booking, phoneSearchTerm),
    );
    filteredData = filteredData.filter((booking) =>
      filterByCustomerNotes(booking, custNotesSearchTerm),
    );
    filteredData = filteredData.filter((booking) =>
      filterByRestaurantNotes(booking, restNotesSearchTerm),
    );

    // Date range constraints
    filteredData = filteredData.filter((booking) =>
      filterByDateRange(
        booking.booking_date,
        bookingDateRange.min,
        bookingDateRange.max,
      ),
    );

    filteredData = filteredData.filter((booking) =>
      filterByDateRange(
        booking.creation_date,
        creationDateRange.min,
        creationDateRange.max,
      ),
    );

    return filteredData.slice().sort((a, b) => {
      // Sort by booking date
      const dateComparison = a.booking_date - b.booking_date;
      if (dateComparison !== 0) {
        return dateComparison;
      }

      // Sort by time slot
      const timeSlotComparison = a.time_slot - b.time_slot;
      if (timeSlotComparison !== 0) {
        return timeSlotComparison;
      }

      // Sort by given name (alphabetically)
      return a.given_name.localeCompare(b.given_name);
    });
  }, [
    historyData,
    nameSearchTerm,
    emailSearchTerm,
    phoneSearchTerm,
    custNotesSearchTerm,
    restNotesSearchTerm,
    bookingDateRange,
    creationDateRange,
  ]);

  return (
    <div>
      <input
        type="text"
        placeholder="Search by Customer Name"
        value={nameSearchTerm}
        onChange={(e) => setNameSearchTerm(e.target.value)}
      />
      <input
        type="text"
        placeholder="Search by Customer Email"
        value={emailSearchTerm}
        onChange={(e) => setEmailSearchTerm(e.target.value)}
      />
      <input
        type="text"
        placeholder="Search by Customer Phone Number"
        value={phoneSearchTerm}
        onChange={(e) => setPhoneSearchTerm(e.target.value)}
      />
      <input
        type="text"
        placeholder="Search customer notes containing..."
        value={custNotesSearchTerm}
        onChange={(e) => setCustNotesSearchTerm(e.target.value)}
      />
      <input
        type="text"
        placeholder="Search restaurant notes containing..."
        value={restNotesSearchTerm}
        onChange={(e) => setRestNotesSearchTerm(e.target.value)}
      />

      <h3>Booking Date Range</h3>
      <label>From (Booking Date)</label>
      <input
        type="date"
        value={bookingDateRange.min}
        onChange={(e) =>
          setBookingDateRange((prev) => ({ ...prev, min: e.target.value }))
        }
      />
      <label>To (Booking Date)</label>
      <input
        type="date"
        value={bookingDateRange.max}
        onChange={(e) =>
          setBookingDateRange((prev) => ({ ...prev, max: e.target.value }))
        }
      />
      <label>From (Creation Date)</label>
      <input
        type="date"
        value={creationDateRange.min}
        onChange={(e) =>
          setCreationDateRange((prev) => ({ ...prev, min: e.target.value }))
        }
      />
      <label>To (Creation Date)</label>
      <input
        type="date"
        value={creationDateRange.max}
        onChange={(e) =>
          setCreationDateRange((prev) => ({ ...prev, min: e.target.value }))
        }
      />
      <table>
        <thead>
          <tr>
            <th>Time Slot</th>
            <th>Date</th>
            <th>Party Size</th>
            <th>Given Name</th>
            <th>Family Name</th>
            <th>Phone Number</th>
            <th>Email</th>
            <th>Attendance</th>
            <th>Creation Date</th>
            <th>Customer Notes</th>
            <th>Restaurant Notes</th>
          </tr>
        </thead>
        <tbody>
          {filteredAndSortedBookings.map((booking) => (
            <tr>
              <td>{formatTimeSlot(booking.time_slot)}</td>
              <td>{formatDate(booking.booking_date)}</td>
              <td>{booking.party_size}</td>
              <td>{booking.given_name}</td>
              <td>{booking.family_name}</td>
              <td>{booking.phone}</td>
              <td>{booking.email}</td>
              <td>{booking.attendance}</td>
              <td>{formatDate(booking.creation_date)}</td>
              <td>{booking.customer_notes}</td>
              <td>{booking.restaurant_notes}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export const Route = createFileRoute("/account/$restaurantid/view-bookings/")({
  component: BookingHistoryComponent,
});
