package api

import (
	"context"
	"encoding/json"
	"net/http"
	"plange/backend/model"
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// request type for selecing a specific occasion
type occasionRequest struct {
	Date       time.Time
	Restaurant uuid.UUID
}

func (o occasionRequest) MarshalJSON() ([]byte, error) {
	return json.Marshal(struct {
		Date       int64     `json:"date"`
		Restaurant uuid.UUID `json:"restaurant"`
	}{
		Date:       o.Date.UnixMilli(),
		Restaurant: o.Restaurant,
	})
}

func (o *occasionRequest) UnmarshalJSON(data []byte) error {
	raw := struct {
		Date       int64     `json:"date"`
		Restaurant uuid.UUID `json:"restaurant"`
	}{}

	err := json.Unmarshal(data, &raw)

	if err != nil {
		return err
	}

	o.Date = time.UnixMilli(raw.Date)
	o.Restaurant = raw.Restaurant

	return nil
}

// CreateOccasionHandler creates a new occasion in the database for the
// specified restaurant, on the specified date, and ensures that it is owned by
// the currently authenticed user
//
// authed endpoint
//
// expects: { date: number, restaurant: string }
//
// bound to: POST /api/restaurant/occasion/create
type CreateOccasionHandler struct{}

func (*CreateOccasionHandler) handle(
	ctx context.Context,
	db *gorm.DB,
	user User,
	request occasionRequest,
) error {
	return gorm.G[model.Occasion](db).Exec(ctx, `
WITH a AS (
	SELECT availability.id
	FROM availability
	INNER JOIN restaurant
		ON restaurant.id = ?
		AND restaurant.availability_id = availability.id
	INNER JOIN account
		ON account.email = ?
		AND restaurant.account_id = account.id
)
INSERT INTO occasion (
	availability_id,
	date,
	hour_mask
)
VALUES (
	a.id,
	?,
	0,
)`,
		request.Restaurant,
		user.Email,
		request.Date)
}

func (h *CreateOccasionHandler) ServeHTTP(ctx AuthedAppContext, w http.ResponseWriter, r *http.Request) {
	request := occasionRequest{}
	err := json.NewDecoder(r.Body).Decode(&request)
	if err != nil {
		w.WriteHeader(http.StatusBadRequest)
		return
	}

	err = h.handle(
		r.Context(),
		ctx.DB,
		ctx.User,
		request,
	)

	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		return
	}
}

// DeleteOccasionHandler deletes an occasion from the database for the
// specified restaurant, on the specified date, and ensures that it is owned by
// the currently authenticed user
//
// authed endpoint
//
// expects: { date: number, restaurant: string }
//
// bound to: POST /api/restaurant/occasion/delete
type DeleteOccasionHandler struct{}

func (*DeleteOccasionHandler) handle(
	ctx context.Context,
	db *gorm.DB,
	user User,
	request occasionRequest,
) error {
	return gorm.G[model.Occasion](db).Exec(ctx, `
WITH a AS (
	SELECT availability.id
	FROM availability
	INNER JOIN restaurant
		ON restaurant.id = ?
		AND restaurant.availability_id = availability.id
	INNER JOIN account
		ON account.email = ?
		AND restaurant.account_id = account.id
)
DELETE FROM occasion
WHERE availability_id = a.id
	AND date = ?`,
		request.Restaurant,
		user.Email,
		request.Date)
}

func (h *DeleteOccasionHandler) ServeHTTP(ctx AuthedAppContext, w http.ResponseWriter, r *http.Request) {
	request := occasionRequest{}
	err := json.NewDecoder(r.Body).Decode(&request)
	if err != nil {
		w.WriteHeader(http.StatusBadRequest)
		return
	}

	err = h.handle(
		r.Context(),
		ctx.DB,
		ctx.User,
		request,
	)

	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		return
	}
}
