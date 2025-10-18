import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/booking/$bookingid/")({
  component: RouteComponent,
});

function RouteComponent() {
  return <div>Edit Booking Page Here Yeh</div>;
}
