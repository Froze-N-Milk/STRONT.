import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";

export const Route = createFileRoute("/booking/$bookingid/")({
  component: BookingConfirmContent,
});

type BookingObj = {
  restaurant_id: string;
  given_name: string;
  family_name: string;
  phone: string;
  email: string;
  party_size: number;
  booking_date: number;
  time_slot: number;
  customer_notes: string;
};

function BookingConfirmContent() {
  const bookingid = Route.useParams().bookingid;
  const [bookingData, setBookingData] = useState<BookingObj | null>(null);

  useEffect(() => {
    fetch("/api/booking/" + bookingid, {
      method: "GET",
    }).then(async (r) => {
      if (r.status == 200) {
        const result = (await r.json()) as BookingObj;
        console.log(result);
        setBookingData(result); //TODO: Change this to use response.json later
      } else {
        setBookingData(null);
      }
    });
  }, [bookingid]);

  if (bookingData == null) return <div>Something has gone wrong!</div>;

  return (
    <div>
      <BookingConfirmation bookingData={bookingData} />
    </div>
  );
}

function BookingConfirmation({ bookingData }: { bookingData: BookingObj }) {
  return <p>shaft {bookingData.booking_date}</p>;
}
