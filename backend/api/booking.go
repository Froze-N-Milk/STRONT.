package api

import (
	"context"
	"encoding/json"
	"fmt"
	"log/slog"
	"net/http"
	"plange/backend/model"
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type bookingRequest struct {
	RestaurantID  uuid.UUID
	GivenName     string
	FamilyName    string
	Phone         string
	Email         string
	PartySize     int
	BookingDate   time.Time
	TimeSlot      int
	CustomerNotes string
}

func (b bookingRequest) MarshalJSON() ([]byte, error) {
	return json.Marshal(struct {
		RestaurantID  uuid.UUID `json:"restaurant_id"`
		GivenName     string    `json:"given_name"`
		FamilyName    string    `json:"family_name"`
		Phone         string    `json:"phone"`
		Email         string    `json:"email"`
		PartySize     int       `json:"party_size"`
		BookingDate   int64     `json:"booking_date"`
		TimeSlot      int       `json:"time_slot"`
		CustomerNotes string    `json:"customer_notes"`
	}{
		RestaurantID:  b.RestaurantID,
		GivenName:     b.GivenName,
		FamilyName:    b.FamilyName,
		Phone:         b.Phone,
		Email:         b.Email,
		PartySize:     b.PartySize,
		BookingDate:   b.BookingDate.UnixMilli(),
		TimeSlot:      b.TimeSlot,
		CustomerNotes: b.CustomerNotes,
	})
}

func (b *bookingRequest) UnmarshalJSON(data []byte) error {
	raw := struct {
		RestaurantID  uuid.UUID `json:"restaurant_id"`
		GivenName     string    `json:"given_name"`
		FamilyName    string    `json:"family_name"`
		Phone         string    `json:"phone"`
		Email         string    `json:"email"`
		PartySize     int       `json:"party_size"`
		BookingDate   int64     `json:"booking_date"`
		TimeSlot      int       `json:"time_slot"`
		CustomerNotes string    `json:"customer_notes"`
	}{}

	err := json.Unmarshal(data, &raw)

	if err != nil {
		return err
	}

	b.RestaurantID = raw.RestaurantID
	b.GivenName = raw.GivenName
	b.FamilyName = raw.FamilyName
	b.Phone = raw.Phone
	b.Email = raw.Email
	b.PartySize = raw.PartySize
	b.BookingDate = time.UnixMilli(raw.BookingDate)
	b.TimeSlot = raw.TimeSlot
	b.CustomerNotes = raw.CustomerNotes

	return nil
}

// TODO: Check booking capacity for surrounding timeslots to see if ongoing bookings will cause overlap into this timeslot
func validateBookingDateAndTime(timeSlot int, date time.Time, availability *model.Availability, db *gorm.DB, ctx context.Context) (bool, error) {
	if timeSlot < 0 {
		return false, nil
	}

	weekdayHourMask := *availability.WeekdayMask(date.Weekday())

	if (weekdayHourMask & (1 << timeSlot)) == 0 {
		return false, nil
	}

	occasions, err := gorm.G[model.Occasion](db).Raw(`
SELECT * FROM occasion o
JOIN availability a on a.id = o.availability_id
WHERE
    o.availability_id = $2
AND
    (
		o.close_date = $1 -- Check the exact date
	OR
		( -- Check if any recurring dates
			yearly_recurring = TRUE
			AND EXTRACT(DAY FROM close_date) = EXTRACT(DAY FROM $1)
			AND EXTRACT(MONTH FROM close_date) = EXTRACT(MONTH FROM $1)
		)
    )
`, date.UTC(), availability.ID).Find(ctx)
	if err != nil {
		return false, err
	}

	for _, o := range occasions {
		if (o.HourMask & (1 << timeSlot)) != 0 {
			return false, nil
		}
	}
	return true, nil
}

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
//		restaurant_id: uuid,
//		given_name: string,
//		family_name: string,
//		phone: string,
//		email: string,
//		party_size: int,
//		booking_date: int, (unix millis)
//		time_slot: int,
//		customer_notes: string
//	}
type GetBookingByIDHandler struct{}

func (h *GetBookingByIDHandler) handle(ctx context.Context, db *gorm.DB, bookingId uuid.UUID) (bookingRequest, error) {
	booking, err := gorm.G[model.Booking](db).Where("id = ?", bookingId).First(ctx)
	if err != nil {
		return bookingRequest{}, err
	}

	contact, err := gorm.G[model.CustomerContact](db).Where("id = ?", booking.ContactID).First(ctx)
	if err != nil {
		return bookingRequest{}, err
	}

	return bookingRequest{
		RestaurantID:  booking.RestaurantID,
		GivenName:     contact.GivenName,
		FamilyName:    contact.FamilyName,
		Phone:         contact.Phone,
		Email:         contact.Email,
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
//		party_size: int,
//		booking_date: string, (YYYY-MM-DDTHH:MM:ssZ)
//		time_slot: int,
//		customer_notes: string
//	}
type CreateOnlineBookingHandler struct {
	EmailHelper EmailHelper
}

func (h *CreateOnlineBookingHandler) handle(ctx context.Context, db *gorm.DB, request bookingRequest) (model.Booking, error) {
	restaurant, err := gorm.G[model.Restaurant](db).Where("id = ?", request.RestaurantID).First(ctx)

	if err != nil {
		return model.Booking{}, err
	}

	// check party size is allowed
	if request.PartySize < 0 || request.PartySize > restaurant.MaxPartySize {
		return model.Booking{}, fmt.Errorf("requested party size exceeds restaurant limit: %d/%d",
			request.PartySize,
			restaurant.MaxPartySize)
	}

	bookingsAtTimeSlot, err := gorm.G[model.Booking](db).Raw(`
SELECT * FROM booking
WHERE
    restaurant_id = $1
	AND booking_date = $2
	AND time_slot = $3`,
		request.RestaurantID,
		request.BookingDate,
		request.TimeSlot).Find(ctx)

	if err != nil {
		return model.Booking{}, err
	}

	// Booking capacity for this timeslot has been reached/exceeded
	if len(bookingsAtTimeSlot) >= restaurant.BookingCapacity {
		return model.Booking{},
			fmt.Errorf("restaurant has reached capacity for the requested timeslot: %d (capacity: %d)",
				request.TimeSlot, restaurant.BookingCapacity)
	}

	// check booking date and time slot is available
	// load the associations for the restaurant availability and occasions
	availability, err := gorm.G[model.Availability](db).Where("id = ?", restaurant.AvailabilityID).First(ctx)

	if err != nil {
		return model.Booking{}, err
	}

	if result, err := validateBookingDateAndTime(request.TimeSlot, request.BookingDate, &availability, db, ctx); err != nil {
		return model.Booking{}, err
	} else if !result {
		return model.Booking{}, fmt.Errorf("invalid booking date or time")
	}

	customerContact := model.CustomerContact{
		GivenName:  request.GivenName,
		FamilyName: request.FamilyName,
		Phone:      request.Phone,
		Email:      request.Email,
	}
	err = gorm.G[model.CustomerContact](db).Create(ctx, &customerContact)

	if err != nil {
		return model.Booking{}, err
	}

	booking := model.Booking{
		ContactID:       customerContact.ID,
		RestaurantID:    request.RestaurantID,
		PartySize:       request.PartySize,
		BookingDate:     request.BookingDate.UTC(),
		TimeSlot:        request.TimeSlot,
		CustomerNotes:   request.CustomerNotes,
		Attendance:      "pending",
		CreationDate:    time.Now().UTC(),
		CustomerCreated: true,
	}
	err = gorm.G[model.Booking](db).Create(ctx, &booking)

	if err != nil {
		return model.Booking{}, err
	}

	// populate contact field
	booking.Contact = &customerContact

	return booking, nil
}

func (h *CreateOnlineBookingHandler) ServeHTTP(ctx AppContext, w http.ResponseWriter, r *http.Request) {
	request := bookingRequest{}
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

	meta, err := gorm.G[struct{ Email, Name string }](db).Raw(`
SELECT account.email, restaurant.name
FROM account
INNER JOIN restaurant
ON restaurant.id = ?
AND account.id = restaurant.account_id`,
		request.RestaurantID).First(r.Context())

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

	// send notification emails
	date := booking.BookingDate.Add(time.Duration(booking.TimeSlot*30) * time.Minute)

	// run in go routines to not block each other, or blocking this handler
	go slog.Debug("customer email", "error", h.EmailHelper.NotifyCustomer(BookingNotification{
		Mailbox: Mailbox{
			name:    booking.Contact.GivenName,
			address: booking.Contact.Email,
		},
		ID:             booking.ID,
		RestaurantName: meta.Name,
		Attendance:     booking.Attendance,
		CustomerName:   booking.Contact.GivenName,
		Date:           date,
		Duration:       time.Duration(booking.TimeSlot) * 30 * time.Minute,
		PartySize:      booking.PartySize,
		Notes:          booking.CustomerNotes,
	}))
	go slog.Debug("restaurant email", "error", h.EmailHelper.NotifyRestaurant(BookingNotification{
		Mailbox: Mailbox{
			address: meta.Email,
		},
		ID:             booking.ID,
		RestaurantName: meta.Name,
		Attendance:     booking.Attendance,
		CustomerName:   booking.Contact.GivenName,
		Date:           date,
		Duration:       time.Duration(booking.TimeSlot) * 30 * time.Minute,
		PartySize:      booking.PartySize,
		Notes:          booking.CustomerNotes,
	}))
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

	availability, err := gorm.G[model.Availability](db).Raw(`
SELECT * FROM availability a
JOIN restaurant r ON r.availability_id = a.id
WHERE
    r.id = $1
`, booking.RestaurantID).First(ctx)

	if result, err := validateBookingDateAndTime(request.TimeSlot, booking.BookingDate, &availability, db, ctx); err != nil {
		return err
	} else if !result {
		return fmt.Errorf("invalid booking date or time")
	}

	booking.TimeSlot = request.TimeSlot
	booking.PartySize = request.PartySize
	booking.CustomerNotes = request.CustomerNotes

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

//region Cancel Booking

type CancelBookingHandler struct{}

func (h *CancelBookingHandler) handle(ctx context.Context, db *gorm.DB, bookingID uuid.UUID) error {
	booking, err := gorm.G[model.Booking](db).Where("id = ?", bookingID).First(ctx)
	if err != nil {
		return err
	}

	booking.Attendance = "cancelled"

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
//
// # Auth required
//
// GET /api/booking/upcoming/{restaurant}
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
//		restaurant_notes: string,
//		attendance: string
//	}
type GetUpcomingBookingsHandler struct{}

type restaurantBookingResponse struct {
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
	Attendance      string    `json:"attendance"`
}

func (h *GetUpcomingBookingsHandler) handle(ctx context.Context, db *gorm.DB, restaurantID uuid.UUID, user User) ([]restaurantBookingResponse, error) {
	slog.Debug("", "ctx", ctx, "db", db, "user", user, "id", restaurantID)
	bookings, err := gorm.G[restaurantBookingResponse](db).Raw(`
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
	b.restaurant_notes,
	b.attendance
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
		return []restaurantBookingResponse{}, err
	}

	return bookings, nil
}

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

	slog.Debug("", "response", response)

	err = json.NewEncoder(w).Encode(response)

	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		return
	}
}

//endregion

//region Get Booking History

// GetBookingHistoryHandler retrieves a list of past bookings for the requested restaurant.
//
// # Auth required
//
// GET /api/booking/history/{restaurant}
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
//		restaurant_notes: string,
//		attendance: string
//	}
type GetBookingHistoryHandler struct{}

func (h *GetBookingHistoryHandler) handle(ctx context.Context, db *gorm.DB, restaurantID uuid.UUID, user User) ([]restaurantBookingResponse, error) {
	bookings, err := gorm.G[restaurantBookingResponse](db).Raw(`
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
	b.restaurant_notes,
	b.attendance
FROM booking b
JOIN customer_contact c ON c.id = b.contact_id
JOIN restaurant r on r.id = $2
JOIN account a ON a.id = r.account_id
WHERE a.email = $1
    AND b.restaurant_id = $2
	AND b.booking_date < CURRENT_DATE
ORDER BY b.booking_date`,
		user.Email,
		restaurantID).Find(ctx)

	if err != nil {
		return []restaurantBookingResponse{}, err
	}

	return bookings, nil
}

func (h *GetBookingHistoryHandler) ServeHTTP(ctx AuthedAppContext, w http.ResponseWriter, r *http.Request) {
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

//region Restaurant Notes

// UpdateRestaurantNotesHandler updates the specified booking row in the database
//
// # No auth required
//
// POST /api/booking/restaurant-notes/{booking}
//
// expects:
//
//	{
//		restaurant_notes: string
//	}
type UpdateRestaurantNotesHandler struct{}
type updateRestaurantNotesRequest struct {
	RestaurantNotes string `json:"restaurant_notes"`
}

func (h *UpdateRestaurantNotesHandler) handle(ctx context.Context, db *gorm.DB, request updateRestaurantNotesRequest, bookingId uuid.UUID, user User) error {
	return gorm.G[model.Booking](db).Exec(ctx, `
UPDATE booking AS b
SET restaurant_notes = $2
FROM restaurant AS r 
	JOIN account a ON a.id = r.account_id
WHERE
    b.id = $1
	AND a.email = $3
`, bookingId, request.RestaurantNotes, user.Email)
}

func (h *UpdateRestaurantNotesHandler) ServeHTTP(ctx AuthedAppContext, w http.ResponseWriter, r *http.Request) {
	bookingId, err := uuid.Parse(r.PathValue("booking"))
	if err != nil {
		w.WriteHeader(http.StatusBadRequest)
		return
	}

	request := updateRestaurantNotesRequest{}
	err = json.NewDecoder(r.Body).Decode(&request)
	if err != nil {
		w.WriteHeader(http.StatusBadRequest)
		return
	}

	db := ctx.DB.Session(&gorm.Session{SkipDefaultTransaction: true}).Begin()
	err = h.handle(r.Context(), db, request, bookingId, ctx.User)

	if err != nil {
		db.Rollback()
		w.WriteHeader(http.StatusInternalServerError)
		return
	}

	db.Commit()

	w.WriteHeader(http.StatusOK)
}

//endregion

//region Update Attendance

// UpdateAttendanceHandler updates the attendance for the specified booking in the database
//
// # No auth required
//
// POST /api/booking/attendance/{booking}
//
// expects:
//
//	{
//		attendance: string
//	}
type UpdateAttendanceHandler struct{}
type updateAttendanceRequest struct {
	Attendance string `json:"attendance"`
}

func (h *UpdateAttendanceHandler) handle(ctx context.Context, db *gorm.DB, request updateAttendanceRequest, bookingId uuid.UUID, user User) error {
	return gorm.G[model.Booking](db).Exec(ctx, `
UPDATE booking AS b
SET attendance = $2
FROM restaurant AS r
	JOIN account a ON a.id = r.account_id
WHERE
    b.id = $1
	AND b.restaurant_id = r.id
`, bookingId, request.Attendance)
}

func (h *UpdateAttendanceHandler) ServeHTTP(ctx AuthedAppContext, w http.ResponseWriter, r *http.Request) {
	bookingId, err := uuid.Parse(r.PathValue("booking"))
	if err != nil {
		w.WriteHeader(http.StatusBadRequest)
		return
	}

	request := updateAttendanceRequest{}
	err = json.NewDecoder(r.Body).Decode(&request)
	if err != nil {
		w.WriteHeader(http.StatusBadRequest)
		return
	}

	db := ctx.DB.Session(&gorm.Session{SkipDefaultTransaction: true}).Begin()
	err = h.handle(r.Context(), db, request, bookingId, ctx.User)

	if err != nil {
		db.Rollback()
		w.WriteHeader(http.StatusInternalServerError)
		return
	}

	db.Commit()

	w.WriteHeader(http.StatusOK)
}

//endregion
