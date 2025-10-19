import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  type Attendance,
  type Booking,
  formatDate,
  formatTimeSlot,
} from "../helper.ts";

export const Route = createFileRoute("/account/$restaurantid/FOHtracker/")({
  component: RouteComponent,
});

const mockData: Booking[] = [
  {
    booking_id: "11111111-1111-1111-1111-111111111111",
    given_name: "Big",
    family_name: "Missile",
    phone: "0411111111",
    email: "kill@me.lol",
    party_size: 4,
    booking_date: 0,
    time_slot: 3,
    creation_date: 0,
    customer_notes: "pemis",
    restaurant_notes: "asdfhjlk",
    attendance: "pending",
  },
  {
    booking_id: "22222222-2222-2222-2222-222222222222",
    given_name: "Small",
    family_name: "Gun",
    phone: "0422222222",
    email: "kill@you.lol",
    party_size: 5,
    booking_date: 2345987542982,
    time_slot: 14,
    creation_date: 234598754298,
    customer_notes: "asdfhjkl",
    restaurant_notes: "asdfhjlk",
    attendance: "cancelled",
  },
];

function RouteComponent() {
  const restaurantId = Route.useParams().restaurantid;

  const [isNotesModalOpen, setIsNoteModalOpen] = useState(false);
  const [modalBookingId, setModalBookingId] = useState("");
  const [notesInput, setNotesInput] = useState("");

  const [upcomingData, setUpcomingData] = useState<Booking[] | null>(null);

  useEffect(() => {
    fetch("/api/booking/upcoming/" + restaurantId, {
      method: "GET",
    }).then(async (r) => {
      if (r.status == 200) {
        const result = (await r.json()) as Booking[];

        let initialData: Booking[];

        if (result.length < 1) {
          console.log("Set mock data");
          initialData = [...mockData];
        } else {
          initialData = result;
        }

        setUpcomingData(initialData);
      } else {
        setUpcomingData(null);
      }
    });
  }, [restaurantId]);

  const handleUpdateAttendance = async (id: string, attendance: Attendance) => {
    try {
      const response = await fetch(`/api/booking/attendance/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ attendance: attendance }),
      });
      if (!response.ok) throw new Error(response.status.toString());

      setUpcomingData((prev) =>
        prev
          ? prev.map((b) =>
              b.booking_id === id
                ? {
                    ...b,
                    attendance: attendance,
                  }
                : b,
            )
          : null,
      );
    } catch (error) {
      console.error("Error cancelling booking: ", error);
    }
  };

  const handleOpenNotesModal = (id: string) => {
    setIsNoteModalOpen(true);
    setModalBookingId(id);
    const booking = upcomingData
      ? upcomingData.find((booking) => booking.booking_id === id)
      : undefined;
    console.log(id);
    setNotesInput(
      upcomingData ? (booking ? booking.restaurant_notes : "") : "",
    );
  };

  const handleCloseNotesModal = () => {
    setIsNoteModalOpen(false);
    setModalBookingId("");
  };

  const handleSaveNotes = async () => {
    try {
      const response = await fetch(
        `/api/booking/restaurant-notes/${modalBookingId}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ "restaurant-notes": notesInput }),
        },
      );
      if (!response.ok) throw new Error(response.status.toString());

      setUpcomingData((prev) =>
        prev
          ? prev.map((b) =>
              b.booking_id === modalBookingId
                ? {
                    ...b,
                    restaurant_notes: notesInput,
                  }
                : b,
            )
          : null,
      );
    } catch (error) {
      console.error(error);
    }
    handleCloseNotesModal();
  };

  if (upcomingData == null) {
    return <div>i shid myself</div>;
  }

  return (
    <div>
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
            <th>Attendance</th>
            <th>Customer Notes</th>
            <th>Restaurant Notes</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {upcomingData.map((booking) => (
            <tr>
              <td>{formatTimeSlot(booking.time_slot)}</td>
              <td>{formatDate(booking.booking_date)}</td>
              <td>{booking.party_size}</td>
              <td>{booking.given_name}</td>
              <td>{booking.family_name}</td>
              <td>{booking.phone}</td>
              <td>{booking.email}</td>
              <td>{booking.attendance}</td>
              <td>{booking.customer_notes}</td>
              <td>{booking.restaurant_notes}</td>
              <td>
                <div className="action-buttons">
                  <button
                    disabled={booking.attendance === "cancelled"}
                    className="action-button checkin"
                    onClick={() =>
                      handleUpdateAttendance(booking.booking_id, "attended")
                    }
                  >
                    Check In
                  </button>
                  <button
                    disabled={booking.attendance === "cancelled"}
                    className="action-button cancel"
                    onClick={async () => {
                      if (
                        window.confirm(
                          "Are you sure you want to cancel this booking?",
                        )
                      ) {
                        await handleUpdateAttendance(
                          booking.booking_id,
                          "cancelled",
                        );
                      }
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    className="action-button note"
                    onClick={() => handleOpenNotesModal(booking.booking_id)}
                  >
                    Edit Notes
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {isNotesModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2 className="modal-title">Edit Restaurant Notes</h2>
            <input
              type="text"
              value={notesInput}
              onChange={(e) => setNotesInput(e.target.value)}
              className="modal-text-field"
              placeholder="Add notes here..."
            />
            <div className="modal-footer">
              <button
                className="modal-cancel modal-button"
                onClick={handleCloseNotesModal}
              >
                Cancel
              </button>
              <button
                className="modal-confirm modal-button"
                onClick={handleSaveNotes}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
