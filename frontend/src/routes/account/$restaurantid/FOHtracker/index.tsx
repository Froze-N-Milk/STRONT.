import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/account/$restaurantid/FOHtracker/")({
  component: RouteComponent,
});

function RouteComponent() {
  return <div>FOH Tracker page gotta go here</div>;
}
