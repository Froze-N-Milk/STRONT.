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
	email string,
	request occasionRequest,
) error {
	return gorm.G[model.Occasion](db).Exec(ctx, `
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
INSERT INTO occasion (
	availability_id,
	close_date,
	hour_mask
)
VALUES (
	(SELECT id FROM authed),
	?,
	0
)`,
		request.Restaurant,
		email,
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
		ctx.User.Email,
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
	email string,
	request occasionRequest,
) error {
	return gorm.G[model.Occasion](db).Exec(ctx, `
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
DELETE
	FROM occasion
	USING authed
	WHERE occasion.availability_id = authed.id
	AND close_date = ?`,
		request.Restaurant,
		email,
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
		ctx.User.Email,
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

type NonExistentOccasionError struct {}
func (NonExistentOccasionError) Error() string {
	return "Occasion does not exist"
}

func (*UpdateOccasionHandler) handle(
	ctx context.Context,
	db *gorm.DB,
	email string,
	occasion occasionDetails,
) error {
	rows, err := gorm.G[any](db).Raw(`
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
UPDATE occasion
SET
	hour_mask = ?,
	yearly_recurring = ?
FROM authed
WHERE occasion.availability_id = authed.id AND close_date = ?
RETURNING 0`,
		occasion.Restaurant,
		email,
		occasion.Hours,
		occasion.Recurring,
		occasion.CloseDate,
	).Find(ctx)

	if err != nil {
		return err
	}

	if len(rows) == 0 {
		return NonExistentOccasionError{}
	}

	return nil
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
		ctx.User.Email,
		request,
	)

	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		return
	}
}
