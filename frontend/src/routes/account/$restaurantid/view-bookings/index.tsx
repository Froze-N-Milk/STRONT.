import { createFileRoute, Link } from "@tanstack/react-router";
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
} from "../-helper.ts";

function BookingHistoryComponent() {
  const restaurantId = Route.useParams().restaurantid;

  const [nameSearchTerm, setNameSearchTerm] = useState("");
  const [emailSearchTerm, setEmailSearchTerm] = useState("");
  const [phoneSearchTerm, setPhoneSearchTerm] = useState("");
  const [custNotesSearchTerm, setCustNotesSearchTerm] = useState("");
  const [restNotesSearchTerm, setRestNotesSearchTerm] = useState("");
  const [bookingDateRangeMin, setBookingDateRangeMin] = useState("");
  const [bookingDateRangeMax, setBookingDateRangeMax] = useState("");

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
          initialData = [];
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
        bookingDateRangeMin,
        bookingDateRangeMax,
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
    bookingDateRangeMin,
    bookingDateRangeMax,
  ]);

  return (
    <div style={{ display: "flex", gap: "20px", width: "max-content" }}>
      <div className="bks-side">
        <nav className="bks-side-nav">
          <Link to="/account" className="bks-side-link">
            Back to Account
          </Link>
          <Link
            to="/account/$restaurantid"
            className="bks-side-link"
            params={{ restaurantid: restaurantId }}
          >
            Edit Restaurant Profile
          </Link>
          <Link
            to="/account/$restaurantid/booking-settings"
            className="bks-side-link"
            params={{ restaurantid: restaurantId }}
          >
            Booking Settings
          </Link>
          <Link
            to="/account/$restaurantid/view-bookings"
            className="bks-side-link bks-active"
            params={{ restaurantid: restaurantId }}
          >
            Bookings
          </Link>
          <Link
            to="/account/$restaurantid/FOHtracker"
            className="bks-side-link"
            params={{ restaurantid: restaurantId }}
          >
            FOH Tracker
          </Link>
        </nav>
      </div>
      <div style={{ width: "80vw", overflow: "scroll" }}>
        <h2>Booking History</h2>
        <h3>Search by Details</h3>
        <div className="search-fields" style={{ paddingTop: "5px" }}>
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
        </div>
        <h3 style={{ paddingTop: "10px" }}>Search by Date Range</h3>
        <label>From (Booking Date)</label>
        <input
          type="date"
          value={bookingDateRangeMin}
          onChange={(e) => setBookingDateRangeMin(e.target.value)}
        />
        <label>To (Booking Date)</label>
        <input
          type="date"
          value={bookingDateRangeMax}
          onChange={(e) => setBookingDateRangeMax(e.target.value)}
        />

        <table style={{ width: "100%" }}>
          <thead>
            <tr>
              <th>Time Slot</th>
              <th>Date</th>
              <th>Party Size</th>
              <th>Name</th>
              <th>Phone Number</th>
              <th>Email</th>
              <th>Attendance</th>
              <th>Customer Notes</th>
              <th>Restaurant Notes</th>
            </tr>
          </thead>
          <tbody>
            {filteredAndSortedBookings.map((booking, index) => (
              <tr key={index}>
                <td>{formatTimeSlot(booking.time_slot)}</td>
                <td>{formatDate(booking.booking_date)}</td>
                <td>{booking.party_size}</td>
                <td>{booking.given_name + " " + booking.family_name}</td>
                <td>{booking.phone}</td>
                <td>{booking.email}</td>
                <td>{booking.attendance}</td>
                <td>{booking.customer_notes}</td>
                <td>{booking.restaurant_notes}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export const Route = createFileRoute("/account/$restaurantid/view-bookings/")({
  component: BookingHistoryComponent,
});
