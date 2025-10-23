package api

import (
	"context"
	"encoding/json"
	"errors"
	"log/slog"
	"net/http"
	"plange/backend/model"
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// GetAvailabilitiesHandler gets the next 7 days of availabilities for a
// restaurant, factoring in any occasions
//
// expects: .../{restaurant}: restaurant id path-param
//
// bound to: GET /api/availability/{restaurant}
type GetAvailabilitiesHandler struct{}

func (*GetAvailabilitiesHandler) handle(ctx context.Context, db *gorm.DB, id uuid.UUID, today time.Time) ([7]model.OpeningHours, error) {
	today = time.Date(today.Year(), today.Month(), today.Day(), 0, 0, 0, 0, time.Local)
	nextWeek := today.AddDate(0, 0, 7)
	// select restaurant availability, and availability exclusions that are
	// in the upcoming week

	availability, err := gorm.G[model.Availability](db).Raw(`
SELECT availability.*
FROM availability
INNER JOIN restaurant
ON restaurant.id = ?
AND restaurant.availability_id = availability.id`,
		id,
	).First(ctx)

	if err != nil {
		return [7]model.OpeningHours{}, err
	}

	occasions, err := gorm.G[model.Occasion](db).Raw(`
SELECT occasion.*
FROM occasion
INNER JOIN availability
ON availability.id = ?
AND occasion.availability_id = availability.id`,
		availability.ID,
	).Find(ctx)

	if err != nil {
		return [7]model.OpeningHours{}, err
	}

	availability.Occasions = occasions

	availability.ApplyOccasions(today, nextWeek)
	return availability.IntoOrder(today), nil
}

func (h *GetAvailabilitiesHandler) ServeHTTP(ctx AppContext, w http.ResponseWriter, r *http.Request) {
	restaurant, err := uuid.Parse(r.PathValue("restaurant"))
	if err != nil {
		w.WriteHeader(http.StatusBadRequest)
		return
	}

	db := ctx.DB.Session(&gorm.Session{SkipDefaultTransaction: true}).Begin()

	availability, err := h.handle(r.Context(), db, restaurant, time.Now())

	if err != nil {
		db.Rollback()
		w.WriteHeader(http.StatusInternalServerError)
		return
	}

	db.Commit()
	json.NewEncoder(w).Encode(availability)
}

type rawAvailabilities struct {
	ID                uuid.UUID `json:"id"`
	MondayHourMask    int64     `json:"mondayHours"`
	TuesdayHourMask   int64     `json:"tuesdayHours"`
	WednesdayHourMask int64     `json:"wednesdayHours"`
	ThursdayHourMask  int64     `json:"thursdayHours"`
	FridayHourMask    int64     `json:"fridayHours"`
	SaturdayHourMask  int64     `json:"saturdayHours"`
	SundayHourMask    int64     `json:"sundayHours"`
}

type invalidRestaurantRequestError struct{}

func (invalidRestaurantRequestError) Error() string {
	return "No such restaurant associated with account"
}

// GetRawAvailabilitiesHandler gets the raw availabilities for a
// restaurant, for editing them
//
// expects: .../{restaurant}: restaurant id path-param
//
// bound to: GET /api/availability/{restaurant}/raw
type GetRawAvailabilitiesHandler struct{}

func (*GetRawAvailabilitiesHandler) handle(ctx context.Context, db *gorm.DB, id uuid.UUID, email string) (model.Availability, error) {
	return gorm.G[model.Availability](db).Raw(`
SELECT availability.*
FROM availability
JOIN restaurant
ON restaurant.id = ?
AND restaurant.availability_id = availability.id
JOIN account
ON account.email = ?
AND restaurant.account_id = account.id`, id, email).First(ctx)
}

func (h *GetRawAvailabilitiesHandler) ServeHTTP(ctx AuthedAppContext, w http.ResponseWriter, r *http.Request) {
	restaurant, err := uuid.Parse(r.PathValue("restaurant"))
	if err != nil {
		w.WriteHeader(http.StatusBadRequest)
		return
	}

	db := ctx.DB.Session(&gorm.Session{SkipDefaultTransaction: true}).Begin()

	availability, err := h.handle(r.Context(), db, restaurant, ctx.User.Email)

	if err != nil {
		db.Rollback()
		w.WriteHeader(http.StatusInternalServerError)
		return
	}

	db.Commit()
	json.NewEncoder(w).Encode(rawAvailabilities{
		ID:                availability.ID,
		MondayHourMask:    availability.MondayHourMask,
		TuesdayHourMask:   availability.TuesdayHourMask,
		WednesdayHourMask: availability.WednesdayHourMask,
		ThursdayHourMask:  availability.ThursdayHourMask,
		FridayHourMask:    availability.FridayHourMask,
		SaturdayHourMask:  availability.SaturdayHourMask,
		SundayHourMask:    availability.SundayHourMask,
	})
}

// UpdateAvailabilitiesHandler updates the availability details for a restaurant
// owned by the currently authed user.
//
// expects: { id: restaurant id, *_hour_mask: hour for that day }
//
// bound to: POST /api/availabilities/update
type UpdateAvailabilitiesHandler struct{}

func (*UpdateAvailabilitiesHandler) handle(
	ctx context.Context,
	db *gorm.DB,
	email string,
	request rawAvailabilities,
) error {
	result := gorm.WithResult()
	err := gorm.G[any](db, result).Exec(ctx, `
WITH authed AS (
	SELECT availability.id
	FROM availability
	INNER JOIN restaurant
		ON restaurant.id = ?
		AND restaurant.availability_id = availability.id
	INNER JOIN account
		ON account.email = ?
		AND restaurant.account_id = account.id
)
UPDATE availability
SET
	monday_hour_mask = ?,
	tuesday_hour_mask = ?,
	wednesday_hour_mask = ?,
	thursday_hour_mask = ?,
	friday_hour_mask = ?,
	saturday_hour_mask = ?,
	sunday_hour_mask = ?
FROM authed
WHERE availability.id = authed.id`,
		request.ID,
		email,
		request.MondayHourMask,
		request.TuesdayHourMask,
		request.WednesdayHourMask,
		request.ThursdayHourMask,
		request.FridayHourMask,
		request.SaturdayHourMask,
		request.SundayHourMask,
	)

	if err != nil {
		return err
	}

	if result.RowsAffected == 0 {
		return invalidRestaurantRequestError{}
	}

	return nil
}

func (h *UpdateAvailabilitiesHandler) ServeHTTP(ctx AuthedAppContext, w http.ResponseWriter, r *http.Request) {
	slog.Info("Updating availabilities")
	request := rawAvailabilities{}
	err := json.NewDecoder(r.Body).Decode(&request)
	if err != nil {
		w.WriteHeader(http.StatusBadRequest)
		return
	}

	err = h.handle(r.Context(), ctx.DB, ctx.User.Email, request)

	if errors.Is(err, invalidRestaurantRequestError{}) {
		slog.Debug("invalid restaurant")
		w.WriteHeader(http.StatusBadRequest)
		return
	}
	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		return
	}
}
