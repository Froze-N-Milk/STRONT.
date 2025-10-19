import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import BookingSummary from "../../-components/bookingSummary";
import type { BookingObj } from "../../restaurants/$restaurantid/make-booking/-utils";

export const Route = createFileRoute("/booking/$bookingid/")({
  component: BookingConfirmContent,
});

function BookingConfirmContent() {
  const bookingid = Route.useParams().bookingid;
  const [bookingData, setBookingData] = useState<BookingObj | null>(null);

  useEffect(() => {
    fetch("/api/booking/" + bookingid, {
      method: "GET",
    }).then(async (r) => {
      if (r.status == 200) {
        const result = (await r.json()) as BookingObj;
        result.booking_id = bookingid;
        setBookingData(result);
      } else {
        setBookingData(null);
      }
    });
  }, [bookingid]);

  if (bookingData == null) return <div>Something has gone wrong!</div>;

  return (
    <div
      style={{ display: "flex", flexDirection: "column", alignItems: "center" }}
    >
      <BookingSummary bookingData={bookingData} />
    </div>
  );
}
