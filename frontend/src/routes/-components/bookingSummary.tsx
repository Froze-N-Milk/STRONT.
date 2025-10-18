import { useState } from "react";
import {
  timeFromMaskValue,
  type BookingObj,
} from "../$restaurantid/make-booking/-utils";

export default function BookingSummary({
  bookingData,
}: {
  bookingData: BookingObj;
}) {
  const bookingdate = new Date(bookingData.booking_date);
  const [bookingNotes, setBookingNotes] = useState(bookingData.customer_notes);

  async function cancelTS() {
    await fetch("/api/booking/cancel/" + bookingData.booking_id, {
      method: "POST",
    }).then(async (r) => {
      if (r.status == 200) {
        window.location.href = "/";
      }
    });
  }

  return (
    <div className="booking-summary">
      <h2 style={{ textAlign: "center", borderBottom: "0.5px solid black" }}>
        Your Booking
      </h2>
      <h6>
        ID: <span className="softertext">{bookingData.booking_id}</span>
      </h6>
      <br />
      <h4>
        Name:{" "}
        <span className="softertext">
          {bookingData.given_name + " " + bookingData.family_name}
        </span>
      </h4>
      <h4>
        Email: <span className="softertext">{bookingData.email}</span>
      </h4>
      <h4>
        This is a booking for{" "}
        <span className="softertext">{bookingData.party_size}</span> person on
        <span className="softertext">
          {" "}
          {bookingdate.toLocaleDateString()}
        </span>{" "}
        at
        <span className="softertext">
          {" "}
          {timeFromMaskValue(bookingData.time_slot)}
        </span>
      </h4>
      <h3 style={{ textAlign: "center", padding: "20px 0 10px 0" }}>
        Edit your booking notes:
      </h3>
      <textarea
        name="bookingNotes"
        id="bookingNotes"
        onChange={(e) => setBookingNotes(e.target.value)}
      >
        {bookingNotes}
      </textarea>
      <div className="confirm-popover-contents">
        <button className="submit_button" onClick={cancelTS}>
          cancel booking
        </button>
      </div>
    </div>
  );
}
