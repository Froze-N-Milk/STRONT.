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
  const [bookingNotesCache, setBookingNotesCache] = useState(
    bookingData.customer_notes,
  );
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

  function checkNoNotes() {
    if (bookingNotes == "") {
      setBookingNotesCache("no booking notes");
    }
  }

  function prepareUpdate(newnotes: string) {
    const postData = {
      time_slot: bookingData.time_slot,
      party_size: bookingData.party_size,
      customer_notes: newnotes,
    };
    return JSON.stringify(postData);
  }

  function abandonChanges() {
    if (bookingNotes != "") {
      setBookingNotes(bookingNotesCache);
    }
  }

  async function handleUpdateNotes() {
    const updatedBooking = prepareUpdate(bookingNotes);
    const res = await fetch("/api/booking/edit/" + bookingData.booking_id, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: updatedBooking,
    });
    console.log(res);
    setBookingNotesCache(bookingNotes);
    checkNoNotes();
  }

  if (restaurantInfo == null)
    return <div>Something went wrong. This booking may not exist.</div>;

  return (
    <div className="booking-summary">
      <div className="booking-summary-items">
        <h2>Booking Summary</h2>
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
        <p style={{ marginTop: "10px" }}>
          <b>Notes: </b>
        </p>
        <div className="notes-section">
          <div className="notes-text">
            <p>{bookingNotesCache} </p>
          </div>
          <button popoverTarget="edit-popover" className="edit-notes">
            {" "}
            edit
          </button>
        </div>
        <div id="edit-popover" className="edit-notes-popover" popover="">
          <div className="edit-notes-area">
            <h4>Edit the notes for your booking</h4>
            <textarea
              placeholder="any dietary requirements, special requests, etc."
              name="booking-notes"
              id="booking-notes"
              value={bookingNotes}
              onChange={(e) => setBookingNotes(e.target.value)}
            />
            <div>
              <button
                className="submit_button"
                onClick={handleUpdateNotes}
                style={{ margin: 20 }}
                popoverTarget="edit-popover"
                popoverTargetAction="hide"
              >
                Save
              </button>
              <button
                className="submit_button"
                onClick={abandonChanges}
                style={{ margin: 20 }}
                popoverTarget="edit-popover"
                popoverTargetAction="hide"
              >
                Discard Changes
              </button>
            </div>
          </div>
        </div>
        <div
          style={{ display: "flex", width: "100%", justifyContent: "center" }}
        >
          <button className="submit_button" onClick={cancelTS}>
            Cancel Booking
          </button>
        </div>
      </div>
    </div>
  );
}
