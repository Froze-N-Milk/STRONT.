import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  type Attendance,
  type Booking,
  formatDate,
  formatTimeSlot,
} from "../-helper.ts";

export const Route = createFileRoute("/account/$restaurantid/FOHtracker/")({
  component: RouteComponent,
});

function RouteComponent() {
  const restaurantId = Route.useParams().restaurantid;

  const [isNotesModalOpen, setIsNoteModalOpen] = useState(false);
  const [modalBookingId, setModalBookingId] = useState("");
  const [notesInput, setNotesInput] = useState("");
  const [customerNotes, setCustomerNotes] = useState("no customer notes");

  const [upcomingData, setUpcomingData] = useState<Booking[]>([]);

  useEffect(() => {
    fetch("/api/booking/upcoming/" + restaurantId, {
      method: "GET",
    }).then(async (r) => {
      if (r.status == 200) {
        setUpcomingData(await r.json());
      } else {
        setUpcomingData([]);
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

      const refresh = await fetch(`/api/booking/upcoming/${restaurantId}`, {
        method: "GET",
      });

      if (refresh.status == 200) {
        setUpcomingData(await refresh.json());
      } else {
        throw new Error(response.status.toString());
      }
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
    setCustomerNotes(booking ? booking.customer_notes : "no customer notes");
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

      const refresh = await fetch(`/api/booking/upcoming/${restaurantId}`, {
        method: "GET",
      });

      if (refresh.status == 200) {
        setUpcomingData(await refresh.json());
      } else {
        throw new Error(response.status.toString());
      }
    } catch (error) {
      console.error(error);
    }
    handleCloseNotesModal();
  };

  if (upcomingData == null) {
    return (
      <div style={{ display: "flex", gap: "20px", width: "max-content" }}>
        <div className="bks-side">
          <nav className="bks-side-nav">
            <Link to="/account" className="bks-side-link">
              Back to Account
            </Link>
            <Link
              to="/account/$restaurantid"
              className="bks-side-link"
              params={{ restaurantid: restaurantId }}
            >
              Edit Restaurant Profile
            </Link>
            <Link
              to="/account/$restaurantid/booking-settings"
              className="bks-side-link"
              params={{ restaurantid: restaurantId }}
            >
              Booking Settings
            </Link>
            <Link
              to="/account/$restaurantid/view-bookings"
              className="bks-side-link"
              params={{ restaurantid: restaurantId }}
            >
              Bookings
            </Link>
            <Link
              to="/account/$restaurantid/FOHtracker"
              className="bks-side-link bks-active"
              params={{ restaurantid: restaurantId }}
            >
              FOH Tracker
            </Link>
          </nav>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", gap: "20px", width: "max-content" }}>
      <div className="bks-side">
        <nav className="bks-side-nav">
          <Link to="/account" className="bks-side-link">
            Back to Account
          </Link>
          <Link
            to="/account/$restaurantid"
            className="bks-side-link"
            params={{ restaurantid: restaurantId }}
          >
            Edit Restaurant Profile
          </Link>
          <Link
            to="/account/$restaurantid/booking-settings"
            className="bks-side-link"
            params={{ restaurantid: restaurantId }}
          >
            Booking Settings
          </Link>
          <Link
            to="/account/$restaurantid/view-bookings"
            className="bks-side-link"
            params={{ restaurantid: restaurantId }}
          >
            Bookings
          </Link>
          <Link
            to="/account/$restaurantid/FOHtracker"
            className="bks-side-link bks-active"
            params={{ restaurantid: restaurantId }}
          >
            FOH Tracker
          </Link>
        </nav>
      </div>
      <div
        style={{
          width: "80vw",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <h2>Today's Bookings:</h2>
        <table>
          <thead>
            <tr>
              <th>Time Slot</th>
              <th>Date</th>
              <th>Party Size</th>
              <th>Name</th>
              <th>Phone Number</th>
              <th>Email</th>
              <th>Attendance</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {upcomingData.map((booking) => (
              <tr key={booking.booking_id}>
                <td>{formatTimeSlot(booking.time_slot)}</td>
                <td>{formatDate(booking.booking_date)}</td>
                <td>{booking.party_size}</td>
                <td>{booking.given_name + " " + booking.family_name}</td>
                <td>{booking.phone}</td>
                <td>{booking.email}</td>
                <td>{booking.attendance}</td>
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
                      Edit / View Notes
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
              <textarea
                value={notesInput}
                onChange={(e) => setNotesInput(e.target.value)}
                className="modal-text-field"
                placeholder="Add notes here..."
              />
              <h4>Customer Notes</h4>
              <p style={{ paddingBottom: "20px" }}>{customerNotes}</p>
              <div className="modal-footer">
                <button
                  className="submit_button"
                  onClick={handleCloseNotesModal}
                >
                  Cancel
                </button>
                <button className="submit_button" onClick={handleSaveNotes}>
                  Save
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
