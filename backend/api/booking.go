package api

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"plange/backend/model"
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// TODO: Check if booking time is during opening hours (CREATE, UPDATE)
// TODO: Customer notes
// TODO: Send booking confirmation email
// TODO: Get list of all upcoming bookings for a restaurant
// TODO: Get list of booking history for a restaurant
// TODO: Update booking details like attendance, restaurant notes

//region Get Booking by ID

// GetBookingByIDHandler retrieves the booking row from the database by its ID and returns a JSON object
//
// # No auth required
//
// GET /api/booking/{booking}
//
// expects: ID by URL
//
// returns:
//
//	{
//		contact_id: string,
//		restaurant_id: string,
//		party_size: int,
//		booking_date: string,
//		time_slot: int,
//		customer_notes: string
//	}
type GetBookingByIDHandler struct{}

type getBookingByIDResponse struct {
	ContactID     uuid.UUID `json:"contact_id"`
	RestaurantID  uuid.UUID `json:"restaurant_id"`
	PartySize     int       `json:"party_size"`
	BookingDate   time.Time `json:"booking_date"`
	TimeSlot      int       `json:"time_slot"`
	CustomerNotes string    `json:"customer_notes"`
}

func (h *GetBookingByIDHandler) handle(ctx context.Context, db *gorm.DB, bookingId uuid.UUID) (getBookingByIDResponse, error) {
	booking, err := gorm.G[model.Booking](db).Where("id = ?", bookingId).First(ctx)
	if err != nil {
		return getBookingByIDResponse{}, err
	}

	return getBookingByIDResponse{
		ContactID:     booking.ContactID,
		RestaurantID:  booking.RestaurantID,
		PartySize:     booking.PartySize,
		BookingDate:   booking.BookingDate,
		TimeSlot:      booking.TimeSlot,
		CustomerNotes: booking.CustomerNotes,
	}, nil
}

func (h *GetBookingByIDHandler) ServeHTTP(ctx AppContext, w http.ResponseWriter, r *http.Request) {
	bookingId, err := uuid.Parse(r.PathValue("booking"))
	if err != nil {
		w.WriteHeader(http.StatusBadRequest)
		return
	}

	response, err := h.handle(r.Context(), ctx.DB, bookingId)

	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		return
	}

	err = json.NewEncoder(w).Encode(&response)

	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		return
	}
}

//endregion

//region Customer Online Booking

// CreateOnlineBookingHandler creates booking rows in the database for bookings made online by customers
//
// # No auth required
//
// POST /api/booking/create
//
// expects:
//
//	{
//		restaurant_id: uuid,
//		given_name: string,
//		family_name: string,
//		phone: string,
//		email: string,
//		party_size: string,
//		booking_date: string, (YYYY-MM-DDTHH:MM:ssZ)
//		time_slot: int,
//		customer_notes: string
//	}
type CreateOnlineBookingHandler struct{}

// handles customer contact creation and booking creation
type createBookingRequest struct {
	RestaurantID  uuid.UUID `json:"restaurant_id"`
	GivenName     string    `json:"given_name"`
	FamilyName    string    `json:"family_name"`
	Phone         string    `json:"phone"`
	Email         string    `json:"email"`
	PartySize     int       `json:"party_size"`
	BookingDate   time.Time `json:"booking_date"`
	TimeSlot      int       `json:"time_slot"`
	CustomerNotes string    `json:"customer_notes"`
}

func (h *CreateOnlineBookingHandler) handle(ctx context.Context, db *gorm.DB, request createBookingRequest) (model.Booking, error) {
	customerContact := model.CustomerContact{
		GivenName:  request.GivenName,
		FamilyName: request.FamilyName,
		Phone:      request.Phone,
		Email:      request.Email,
	}
	err := gorm.G[model.CustomerContact](db).Create(ctx, &customerContact)

	if err != nil {
		return model.Booking{}, err
	}

	booking := model.Booking{
		ContactID:       customerContact.ID,
		RestaurantID:    request.RestaurantID,
		PartySize:       request.PartySize,
		BookingDate:     request.BookingDate,
		TimeSlot:        request.TimeSlot,
		CustomerNotes:   request.CustomerNotes,
		CreationDate:    time.Now().UTC(),
		CustomerCreated: true,
	}
	err = gorm.G[model.Booking](db).Create(ctx, &booking)

	if err != nil {
		return model.Booking{}, err
	}
	return booking, nil
}

func (h *CreateOnlineBookingHandler) ServeHTTP(ctx AppContext, w http.ResponseWriter, r *http.Request) {
	request := createBookingRequest{}
	err := json.NewDecoder(r.Body).Decode(&request)
	if err != nil {
		w.WriteHeader(http.StatusBadRequest)
		return
	}
	// Start a GORM transaction that can be rolled back if there are any issues
	db := ctx.DB.Session(&gorm.Session{SkipDefaultTransaction: true}).Begin()
	booking, err := h.handle(r.Context(), db, request)

	if err != nil {
		db.Rollback()
		w.WriteHeader(http.StatusInternalServerError)
		return
	}

	// Transaction had no errors, so commit to database
	db.Commit()

	// Redirect to booking page once created
	w.Header().Add("Location", fmt.Sprintf("/booking/%s", booking.ID))
	w.WriteHeader(http.StatusSeeOther)
}

//endregion

// region Booking Update

// UpdateBookingHandler updates the specified booking row in the database
//
// # No auth required
//
// GET /api/booking/edit/{booking}
//
// expects:
//
//	{
//		time_slot: int,
//		party_size: int,
//		customer_notes: string
//	}
type UpdateBookingHandler struct{}
type updateBookingRequest struct {
	TimeSlot      int    `json:"time_slot"`
	PartySize     int    `json:"party_size"`
	CustomerNotes string `json:"customer_notes"`
}

func (h *UpdateBookingHandler) handle(ctx context.Context, db *gorm.DB, request updateBookingRequest, bookingId uuid.UUID) error {
	booking, err := gorm.G[model.Booking](db).Where("id = ?", bookingId).First(ctx)
	if err != nil {
		return err
	}

	booking.TimeSlot = request.TimeSlot
	booking.PartySize = request.PartySize

	db.Save(&booking)

	return nil
}

func (h *UpdateBookingHandler) ServeHTTP(ctx AppContext, w http.ResponseWriter, r *http.Request) {
	bookingId, err := uuid.Parse(r.PathValue("booking"))
	if err != nil {
		w.WriteHeader(http.StatusBadRequest)
		return
	}

	request := updateBookingRequest{}
	err = json.NewDecoder(r.Body).Decode(&request)
	if err != nil {
		w.WriteHeader(http.StatusBadRequest)
		return
	}

	db := ctx.DB.Session(&gorm.Session{SkipDefaultTransaction: true}).Begin()
	err = h.handle(r.Context(), db, request, bookingId)

	if err != nil {
		db.Rollback()
		w.WriteHeader(http.StatusInternalServerError)
		return
	}

	db.Commit()

	w.WriteHeader(http.StatusOK)
}

//endregion

//region Booking Delete
// TODO: Implement booking delete endpoints
//endregion

//region Cancel Booking

type CancelBookingHandler struct{}

func (h *CancelBookingHandler) handle(ctx context.Context, db *gorm.DB, bookingID uuid.UUID) error {
	booking, err := gorm.G[model.Booking](db).Where("id = ?", bookingID).First(ctx)
	if err != nil {
		return err
	}

	booking.Attendance = model.Cancelled

	db.Save(&booking)

	return nil
}

func (h *CancelBookingHandler) ServeHTTP(ctx AppContext, w http.ResponseWriter, r *http.Request) {
	bookingID, err := uuid.Parse(r.PathValue("booking"))
	if err != nil {
		w.WriteHeader(http.StatusBadRequest)
		return
	}

	db := ctx.DB.Session(&gorm.Session{SkipDefaultTransaction: true}).Begin()
	err = h.handle(r.Context(), db, bookingID)

	if err != nil {
		db.Rollback()
		w.WriteHeader(http.StatusInternalServerError)
		return
	}

	db.Commit()

	w.WriteHeader(http.StatusOK)
}

//endregion

//region Get Upcoming Bookings

// GetUpcomingBookingsHandler retrieves a list of future bookings for the requested restaurant.
// Auth required
//
// GET /api/booking/for/{restaurant}/upcoming
//
// expects: ID by URL
//
// returns:
//
//	{
//		booking_id: string,
//		given_name: string,
//		family_name: string,
//		phone: string,
//		email: string,
//		party_size: int,
//		booking_date: string,
//		time_slot: int,
//		creation_date: string,
//		customer_notes: string,
//		restaurant_notes: string
//	}
type GetUpcomingBookingsHandler struct{}

type getUpcomingBookingsResponse struct {
	BookingID       uuid.UUID `json:"booking_id"`
	GivenName       string    `json:"given_name"`
	FamilyName      string    `json:"family_name"`
	Phone           string    `json:"phone"`
	Email           string    `json:"email"`
	PartySize       int       `json:"party_size"`
	BookingDate     time.Time `json:"booking_date"`
	TimeSlot        int       `json:"time_slot"`
	CreationDate    time.Time `json:"creation_date"`
	CustomerNotes   string    `json:"customer_notes"`
	RestaurantNotes string    `json:"restaurant_notes"`
}

func (h *GetUpcomingBookingsHandler) handle(ctx context.Context, db *gorm.DB, restaurantID uuid.UUID, user User) ([]getUpcomingBookingsResponse, error) {
	bookings, err := gorm.G[getUpcomingBookingsResponse](db).Raw(`
SELECT 
	b.id AS booking_id,
	c.given_name,
	c.family_name,
	c.phone,
	c.email,
	b.party_size,
	b.booking_date,
	b.time_slot,
	b.creation_date,
	b.customer_notes,
	b.restaurant_notes
FROM booking b
JOIN customer_contact c ON c.id = b.contact_id
JOIN restaurant r on r.id = $2
JOIN account a ON a.id = r.account_id
WHERE a.email = $1
    AND b.restaurant_id = $2
	AND b.booking_date >= CURRENT_DATE
ORDER BY b.booking_date`,
		user.Email,
		restaurantID).Find(ctx)

	if err != nil {
		return []getUpcomingBookingsResponse{}, err
	}

	return bookings, nil
}

// Need to accept restaurant ID as URL param
func (h *GetUpcomingBookingsHandler) ServeHTTP(ctx AuthedAppContext, w http.ResponseWriter, r *http.Request) {
	restaurantID, err := uuid.Parse(r.PathValue("restaurant"))
	if err != nil {
		w.WriteHeader(http.StatusBadRequest)
		return
	}

	response, err := h.handle(r.Context(), ctx.DB, restaurantID, ctx.User)

	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		return
	}

	err = json.NewEncoder(w).Encode(response)

	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		return
	}
}

//endregion

//region Get Booking History
//endregion
