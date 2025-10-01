import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import "./index.css";

export const Route = createFileRoute("/edit-booking/")({
  component: RouteComponent,
});

function RouteComponent() {
  //const [err, setErr] = useState("");
  const [bookingid, setBookingid] = useState("");

  return (
    <div>
      <div className="booking-search-edit-wrapper">
        <div className="booking-search">
          <h1>Booking Search & Edit</h1>
          <div className="searchbox">
            <p>Enter Booking ID:</p>
            <input
              type="text"
              name=""
              id=""
              value={bookingid}
              onChange={(e) => setBookingid(e.target.value)}
            />
            <p></p>
          </div>
          <button className="submit_button">Search Booking</button>
        </div>
        <div className="booking-edit-wrapper">
          <h2>
            Booking for: <span style={{ fontWeight: "300" }}>Don Julio</span>
          </h2>
          <h6>donjulio@fazoolio.com</h6>
          <h6>
            Booking ID: <span style={{ fontWeight: "300" }}>Don Julio</span>
          </h6>
          <div className="booking-edit-details">
            <h5>Date:</h5>
            <h5>Time:</h5>
            <h5>Party Size:</h5>
            <h5>Phone #:</h5>
            <h5>Notes:</h5>
          </div>
        </div>
      </div>
    </div>
  );
}
