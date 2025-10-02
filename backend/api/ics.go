package api

import (
	"context"
	"fmt"
	"net/http"
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type BookingIcsHandler struct{
	LocalHost bool
}

func formatDateTime(dateTime time.Time) string {
	dateTime = dateTime.In(time.UTC)
	return fmt.Sprintf("%04d%02d%02dT%02d%02d%02dZ", dateTime.Year(), dateTime.Month(), dateTime.Day(), dateTime.Hour(), dateTime.Minute(), dateTime.Second())
}

func createIcs(
	localhost bool,
	bookingId uuid.UUID,
	restaurantName string,
	partySize int,
	startTime time.Time,
	duration time.Duration,
	attendance string,
) string {
	var status string
	switch attendance {
	case "attended", "no-show":
		status = "COMPLETED"
	case "pending":
		status = "CONFIRMED"
	case "cancelled":
		status = "CANCELLED"
	default:
		panic(fmt.Sprintf("unexpected attendance: %#v", attendance))
	}

	var host string
	if localhost {
		host = "http://localhost:3000"
	} else {
		host = "https://stront.rest"
	}
	return "BEGIN:VCALENDAR\r\n" +
		"PRODID:-//STRONT.rest//NONSGML STRONT. restaurant booking//EN\r\n" +
		"VERSION:2.0\r\n" +
		"METHOD:PUBLISH\r\n" +
		"BEGIN:VEVENT\r\n" +
		fmt.Sprintf("DTSTAMP:%s\r\n", formatDateTime(time.Now())) +
		fmt.Sprintf("UID:%s@stront.rest\r\n", bookingId) +
		fmt.Sprintf("DTSTART:%s\r\n", formatDateTime(startTime)) +
		fmt.Sprintf("DTEND:%s\r\n", formatDateTime(startTime.Add(time.Duration(duration)*30*time.Minute))) +
		fmt.Sprintf("STATUS:%s\r\n", status) +
		"CATEGORIES:RESTAURANT,FOOD,BOOKING\r\n" +
		fmt.Sprintf("SUMMARY:Booking at %s for %d people\r\n", restaurantName, partySize) +
		// TODO: maybe reintroduce
		// fmt.Sprintf("DESCRIPTION:Booking at %s for %d people\r\n", restaurantName, partyCount) +
		fmt.Sprintf("URL:%s/bookings/cal/%s.ics\r\n", host, bookingId) +
		"END:VEVENT\r\n" +
		"END:VCALENDAR\r\n"
}

func (h *BookingIcsHandler) createIcsForBooking(
	ctx context.Context,
	db *gorm.DB,
	id uuid.UUID,
) (string, error) {
	data, err := gorm.G[struct {
		RestaurantName string
		PartySize      int
		BookingDate    time.Time
		TimeSlot       int
		Duration       int
		Attendance     string
	}](db).Raw(`
SELECT
	restaurant.name AS restaurant_name,
	booking.party_size,
	booking.booking_date,
	booking.time_slot,
	restaurant.booking_length AS duration,
	booking.attendance
FROM booking
INNER JOIN restaurant
ON booking.id = ?
AND restaurant.id = booking.restaurant_id`, id).First(ctx)

	if err != nil {
		return "", err
	}

	return createIcs(
		h.LocalHost,
		id,
		data.RestaurantName,
		data.PartySize,
		data.BookingDate.Add(time.Duration(data.TimeSlot)*30*time.Minute),
		time.Duration(data.Duration)*30*time.Minute,
		data.Attendance,
	), nil
}

func (h *BookingIcsHandler) ServeHTTP(ctx AppContext, w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	// take off '.ics'
	id = id[:len(id)-4]
	bookingId, err := uuid.Parse(id)

	if err != nil {
		w.WriteHeader(http.StatusBadRequest)
	}

	ics, err := h.createIcsForBooking(r.Context(), ctx.DB, bookingId)

	if err != nil {
		w.WriteHeader(http.StatusBadRequest)
	}

	w.Header().Add("Content-Type", "text/calendar; charset=utf-8")
	w.Write([]byte(ics))
}
