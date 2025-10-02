import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";

export const Route = createFileRoute("/booking/upcoming/$restaurantid/")({
  component: BookingHistoryComponent,
});

export type FullBooking = {
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
};

function BookingHistoryComponent() {
  const restaurantId = Route.useParams().restaurantid;
  const [upcomingData, setUpcomingData] = useState<FullBooking[] | null>(null);

  useEffect(() => {
    fetch("/api/booking/upcoming/" + restaurantId, {
      method: "GET",
    }).then(async (r) => {
      if (r.status == 200) {
        // console.log(await r.text())
        const result = (await r.json()) as FullBooking[];
        result.sort((a, b) => a.booking_date - b.booking_date);
        setUpcomingData(result);
      } else {
        setUpcomingData(null);
      }
    });
  }, [restaurantId]);

  if (upcomingData == null) return <div>i shid myself</div>;

  return (
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
          <th>Customer Notes</th>
          <th>Restaurant Notes</th>
        </tr>
      </thead>
      <tbody>
        {upcomingData.map((booking) => (
          <tr>
            <td>{booking.time_slot}</td>
            <td>{booking.booking_date}</td>
            <td>{booking.party_size}</td>
            <td>{booking.given_name}</td>
            <td>{booking.family_name}</td>
            <td>{booking.phone}</td>
            <td>{booking.email}</td>
            <td>{booking.creation_date}</td>
            <td>{booking.customer_notes}</td>
            <td>{booking.restaurant_notes}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
