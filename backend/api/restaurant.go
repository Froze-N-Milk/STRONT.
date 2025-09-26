package api

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"

	"github.com/google/uuid"
	"gorm.io/gorm"

	"plange/backend/model"
)

// common restaurant details transport struct
type restaurantDetails struct {
	ID                uuid.UUID `json:"id"`
	Name              string    `json:"name"`
	Description       string    `json:"description"`
	LocationText      string    `json:"locationText"`
	LocationUrl       string    `json:"locationUrl"`
	FrontpageMarkdown string    `json:"frontpageMarkdown"`
}

// CreateRestaurantHandler creates a new restaurant in the database for the
// currently authenticated user
//
// authed endpoint
//
// expects: { name: string, }
//
// bound to: POST /api/restaurant/create
type CreateRestaurantHandler struct{}

type createRestaurantRequest struct {
	Name string `json:"name"`
}

func (*CreateRestaurantHandler) handle(ctx context.Context, db *gorm.DB, email string, request createRestaurantRequest) (model.Restaurant, error) {
	// create a new, empty availability
	availability, err := gorm.G[model.Availability](db).Raw(`
INSERT INTO availability (
	monday_hour_mask,
	tuesday_hour_mask,
	wednesday_hour_mask,
	thursday_hour_mask,
	friday_hour_mask,
	saturday_hour_mask,
	sunday_hour_mask,
)
VALUES (
	0,
	0,
	0,
	0,
	0,
	0,
	0
)
RETURNING (id)`).Take(ctx)

	if err != nil {
		return model.Restaurant{}, err
	}

	// create a new restaurant with said availability, owned by
	// the account associated with email
	return gorm.G[model.Restaurant](db).Raw(`
INSERT INTO restaurant (
	account_id,
	availability_id,
	name
)
VALUES (
	(SELECT id FROM account WHERE email = ?),
	?,
	?,
)
RETURNING (id)`,
		email,
		availability.ID,
		request.Name,
	).Take(ctx)
}

func (h *CreateRestaurantHandler) ServeHTTP(ctx AuthedAppContext, w http.ResponseWriter, r *http.Request) {
	request := createRestaurantRequest{}
	err := json.NewDecoder(r.Body).Decode(&request)
	if err != nil {
		w.WriteHeader(http.StatusBadRequest)
		return
	}

	// turn off transactions and begin our own transactions session
	db := ctx.DB.Session(&gorm.Session{SkipDefaultTransaction: true}).Begin()
	restaurant, err := h.handle(
		r.Context(),
		db,
		ctx.User.Email,
		request,
	)

	// roll back the transactions, send back internal server error
	if err != nil {
		db.Rollback()
		w.WriteHeader(http.StatusInternalServerError)
		return
	}

	// success, commit changes and redirect to the new restaurant page for further editing
	db.Commit()

	w.Header().Add("Location", fmt.Sprintf("/restaurant/%s", restaurant.ID))
	w.WriteHeader(http.StatusSeeOther)
}

// UpdateRestaurantHandler updates the details for a restaurant in the database
// for the currently authenticated user
//
// authed endpoint
//
//	expects: {
//		id: string,
//		name: string,
//		description: string,
//		locationText: string,
//		locationUrl: string,
//		frontpageMarkdown: string,
//	}
//
// bound to: POST /api/restaurant/update
type UpdateRestaurantHandler struct{}

func (*UpdateRestaurantHandler) handle(
	ctx context.Context,
	db *gorm.DB,
	user User,
	restaurant restaurantDetails,
) error {
	return gorm.G[any](db).Exec(ctx, `
UPDATE restaurant
SET
	name = ?,
	description = ?,
	location_text = ?,
	location_url = ?,
	frontpage_markdown = ?
FROM account
WHERE restaurant.id = ?
	AND account.email = ?
	AND restaurant.account_id = account.id`,
		restaurant.Name,
		restaurant.Description,
		restaurant.LocationText,
		restaurant.LocationUrl,
		restaurant.FrontpageMarkdown,
		restaurant.ID,
		user.Email,
	)
}

func (h *UpdateRestaurantHandler) ServeHTTP(ctx AuthedAppContext, w http.ResponseWriter, r *http.Request) {
	request := restaurantDetails{}
	err := json.NewDecoder(r.Body).Decode(&request)

	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		return
	}

	err = h.handle(r.Context(), ctx.DB, ctx.User, request)

	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		return
	}
}
