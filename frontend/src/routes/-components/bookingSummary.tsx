import { useEffect, useState } from "react";
import {
  parseRestaurantInfo,
  timeFromMaskValue,
  type BookingObj,
} from "../$restaurantid/make-booking/-utils";
import type { Restaurant } from "./restaurantType";

export default function BookingSummary({
  bookingData,
}: {
  bookingData: BookingObj;
}) {
  const bookingdate = new Date(bookingData.booking_date);
  const [bookingNotes, setBookingNotes] = useState(bookingData.customer_notes);
  const [restaurantInfo, setRestaurantInfo] = useState<Restaurant | null>(null);

  useEffect(() => {
    fetch("/api/restaurant/" + bookingData.restaurant_id, {
      method: "GET",
    }).then(async (r) => {
      if (r.status == 200) {
        setRestaurantInfo(parseRestaurantInfo(await r.text()));
      } else {
        setRestaurantInfo(null);
      }
    });
  }, [bookingData.restaurant_id]);

  async function cancelTS() {
    await fetch("/api/booking/cancel/" + bookingData.booking_id, {
      method: "POST",
    }).then(async (r) => {
      if (r.status == 200) {
        window.location.href = "/";
      }
    });
  }

  function prepareUpdate(newnotes: string) {
    const postData = {
      time_slot: bookingData.time_slot,
      party_size: bookingData.party_size,
      customer_notes: newnotes,
    };
    return JSON.stringify(postData);
  }

  async function handleUpdateNotes() {
    const updatedBooking = prepareUpdate(bookingNotes);
    const res = await fetch("/api/booking/edit/" + bookingData.booking_id, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: updatedBooking,
    });
    if (res.redirected) {
      document.getElementById("edit-popover")?.hidePopover();
    }
  }

  if (restaurantInfo == null)
    return <div>Something went wrong. This booking may not exist.</div>;

  return (
    <div className="booking-summary">
      <h2>Your Booking</h2>
      <p>
        For <b>{bookingData.party_size}</b> people at{" "}
        <b>{restaurantInfo.name}</b>
      </p>
      <p>
        <b>Date: </b>
        {bookingdate.toLocaleDateString()}
      </p>
      <p>
        <b>Time: </b>
        {timeFromMaskValue(bookingData.time_slot)}
      </p>
      <p>
        <b>Notes: </b>
        {bookingNotes}{" "}
        <button popoverTarget="edit-popover" className="edit-notes">
          {" "}
          edit
        </button>
      </p>
      <div id="edit-popover" className="edit-notes-popover" popover="">
        <div className="edit-notes-area">
          <h4>Edit the notes for your booking</h4>
          <textarea onChange={(e) => setBookingNotes(e.target.value)}>
            {bookingNotes}
          </textarea>
          <div>
            <button
              className="submit_button"
              onClick={handleUpdateNotes}
              style={{ margin: 20 }}
            >
              Save
            </button>
            <button className="submit_button" style={{ margin: 20 }}>
              Discard Changes
            </button>
          </div>
        </div>
      </div>
      <button className="submit_button" onClick={cancelTS}>
        Cancel Booking
      </button>
    </div>
  );
}
