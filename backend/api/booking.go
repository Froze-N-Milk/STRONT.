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
