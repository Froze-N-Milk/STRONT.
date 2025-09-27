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
// TODO: Update booking details like attendance, restaurant notes, bill, paid

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
//		start_time: string, (YYYY-MM-DDTHH:MM:ssZ)
//		end_time: string (YYYY-MM-DDTHH:MM:ssZ)
//	}
type CreateOnlineBookingHandler struct{}

// handles customer contact creation and booking creation
type createBookingRequest struct {
	RestaurantID uuid.UUID `json:"restaurant_id"`
	GivenName    string    `json:"given_name"`
	FamilyName   string    `json:"family_name"`
	Phone        string    `json:"phone"`
	Email        string    `json:"email"`
	HeadCount    int       `json:"head_count"`
	StartTime    time.Time `json:"start_time"`
	EndTime      time.Time `json:"end_time"`
}

func (*CreateOnlineBookingHandler) handle(ctx context.Context, db *gorm.DB, request createBookingRequest) (model.Booking, error) {
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
		ContactID:      customerContact.ID,
		RestaurantID:   request.RestaurantID,
		StartTime:      request.StartTime,
		EndTime:        request.EndTime,
		CreationDate:   time.Now().UTC(),
		CreationMethod: model.Online,
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

//region Restaurant Booking Creation

// CreateRestaurantBookingHandler creates a booking in the database for bookings made by restaurant staff for offline customers
//
// # Auth required
//
// expects:
//
//	{
//		restaurant_id: uuid,
//		given_name: string,
//		family_name: string,
//		phone: string,
//		email: string,
//		start_time: string, (YYYY-MM-DDTHH:MM:ssZ)
//		end_time: string, (YYYY-MM-DDTHH:MM:ssZ)
//		creation_method: string, (accepts: "online", "walk-in", "phone")
//		preapproved: bool
//	}
type CreateRestaurantBookingHandler struct{}

type createRestaurantBookingRequest struct {
	RestaurantID   uuid.UUID `json:"restaurant_id"`
	GivenName      string    `json:"given_name"`
	FamilyName     string    `json:"family_name"`
	Phone          string    `json:"phone"`
	Email          string    `json:"email"`
	HeadCount      int       `json:"head_count"`
	StartTime      time.Time `json:"start_time"`
	EndTime        time.Time `json:"end_time"`
	CreationMethod string    `json:"creation_method"`
	Preapproved    bool      `json:"preapproved"`
}

func (h *CreateRestaurantBookingHandler) handle(ctx context.Context, db *gorm.DB, user User, request createRestaurantBookingRequest) (model.Booking, error) {
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

	// Inserts new row only if the user account of this session owns the restaurant being requested
	booking, err := gorm.G[model.Booking](db).Raw(`
INSERT INTO booking (contact_id, restaurant_id, start_time, end_time, approved, head_count, creation_date, creation_method)
SELECT $1, r.id, $3, $4, $5, $6, $7, $8
FROM restaurant r
JOIN account a ON r.account_id = a.id
WHERE r.id = $2 AND a.email = $9
RETURNING id`,
		customerContact.ID,
		request.RestaurantID,
		request.StartTime,
		request.EndTime,
		request.Preapproved,
		request.HeadCount,
		time.Now().UTC(),
		request.CreationMethod,
		user.Email).Take(ctx)

	if err != nil {
		return model.Booking{}, err
	}

	return booking, nil
}

func (h *CreateRestaurantBookingHandler) ServeHTTP(ctx AuthedAppContext, w http.ResponseWriter, r *http.Request) {
	request := createRestaurantBookingRequest{}
	err := json.NewDecoder(r.Body).Decode(&request)
	if err != nil {
		w.WriteHeader(http.StatusBadRequest)
		return
	}

	// Start GORM transaction
	db := ctx.DB.Session(&gorm.Session{SkipDefaultTransaction: true}).Begin()
	_, err = h.handle(r.Context(), db, ctx.User, request)

	if err != nil {
		db.Rollback()
		w.WriteHeader(http.StatusInternalServerError)
		return
	}

	// Transaction had no issues, so commit to database
	db.Commit()

	w.WriteHeader(http.StatusOK)
	return
}

//endregion

// region Booking Update

// UpdateBookingHandler updates the specified booking row in the database
//
// # No auth required
//
// expects:
//
//	{
//		start_time: string,
//		end_time: string,
//		head_count: int
//	}
type UpdateBookingHandler struct{}
type updateBookingRequest struct {
	StartTime time.Time `json:"start_time"`
	EndTime   time.Time `json:"end_time"`
	HeadCount int       `json:"head_count"`
}

func (h *UpdateBookingHandler) handle(ctx context.Context, db *gorm.DB, request updateBookingRequest, bookingId uuid.UUID) error {
	booking, err := gorm.G[model.Booking](db).Where("id = ?", bookingId).First(ctx)
	if err != nil {
		return err
	}

	booking.StartTime = request.StartTime
	booking.EndTime = request.EndTime
	// booking.HeadCount = request.HeadCount TODO: Update when schema update is merged

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
