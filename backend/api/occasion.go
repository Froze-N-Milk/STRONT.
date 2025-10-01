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

// request type for selecting a specific occasion
type occasionRequest struct {
	CloseDate  time.Time
	Restaurant uuid.UUID
}

// invoked by `(*json.Encoder) json.Encode(any)` in order to encode
// `occasionRequest`
//
// encodes the `CloseDate` to a millisecond unix timestamp, instead of a date time
// string
func (o occasionRequest) MarshalJSON() ([]byte, error) {
	return json.Marshal(struct {
		CloseDate  int64     `json:"close_date"`
		Restaurant uuid.UUID `json:"restaurant"`
	}{
		CloseDate:  o.CloseDate.UnixMilli(),
		Restaurant: o.Restaurant,
	})
}

// invoked by `(*json.Decoder) json.Decode(any)` in order to decode
// `occasionRequest`
//
// decodes the `CloseDate` from a millisecond unix timestamp, instead of a date time
// string
func (o *occasionRequest) UnmarshalJSON(data []byte) error {
	raw := struct {
		CloseDate  int64     `json:"close_date"`
		Restaurant uuid.UUID `json:"restaurant"`
	}{}

	err := json.Unmarshal(data, &raw)

	if err != nil {
		return err
	}

	o.CloseDate = time.UnixMilli(raw.CloseDate)
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
	close_date,
	hour_mask
)
VALUES (
	a.id,
	?,
	0,
)`,
		request.Restaurant,
		user.Email,
		request.CloseDate)
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
	AND close_date = ?`,
		request.Restaurant,
		user.Email,
		request.CloseDate)
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

// UpdateOccasionHandler updates the hours and recurring status for an occasion
// from the database for the specified restaurant, on the specified date, and
// ensures that it is owned by the currently authenticed user
//
// authed endpoint
//
// expects: { date: number
//
//		restaurant: string
//		hours: number
//		recurring: bool
//	}
//
// bound to: POST /api/restaurant/occasion/update
type UpdateOccasionHandler struct{}

type occasionDetails struct {
	Hours     int64 `json:"hours"`
	Recurring bool  `json:"recurring"`
	occasionRequest
}

func (*UpdateOccasionHandler) handle(
	ctx context.Context,
	db *gorm.DB,
	user User,
	occasion occasionDetails,
) error {
	return gorm.G[any](db).Exec(ctx, `
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
UPDATE occasion
SET
	hour_mask = ?,
	yearly_recurring = ?
WHERE occasion.availability_id = a.id AND close_date = ?`,
		occasion.Restaurant,
		user.Email,
		occasion.Hours,
		occasion.Recurring,
		occasion.CloseDate,
	)
}

func (h *UpdateOccasionHandler) ServeHTTP(ctx AuthedAppContext, w http.ResponseWriter, r *http.Request) {
	request := occasionDetails{}
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
