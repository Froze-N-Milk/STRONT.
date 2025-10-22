package api

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"slices"

	"github.com/google/uuid"
	"github.com/lib/pq"
	"gorm.io/gorm"

	"plange/backend/model"
)

// common restaurant details transport struct
type restaurantDetails struct {
	ID                uuid.UUID `json:"id"`
	Name              string    `json:"name"`
	Email             string    `json:"email"`
	Phone             string    `json:"phone"`
	Description       string    `json:"description"`
	LocationText      string    `json:"locationText"`
	LocationUrl       string    `json:"locationUrl"`
	FrontpageMarkdown string    `json:"frontpageMarkdown"`
	MaxPartySize      int       `json:"maxPartySize"`
	BookingCapacity   int       `json:"bookingCapacity"`
	BookingLength     int       `json:"bookingLength"`
	Tags              []string  `json:"tags"`
}

func (lhs restaurantDetails) Equal(rhs restaurantDetails) bool {
	return lhs.ID == rhs.ID &&
		lhs.Name == rhs.Name &&
		lhs.Email == rhs.Email &&
		lhs.Phone == rhs.Phone &&
		lhs.Description == rhs.Description &&
		lhs.LocationText == rhs.LocationText &&
		lhs.LocationUrl == rhs.LocationUrl &&
		lhs.FrontpageMarkdown == rhs.FrontpageMarkdown &&
		lhs.MaxPartySize == rhs.MaxPartySize &&
		lhs.BookingCapacity == rhs.BookingCapacity &&
		lhs.BookingLength == rhs.BookingLength &&
		slices.Equal(lhs.Tags, rhs.Tags)
}

// CreateRestaurantHandler creates a new restaurant in the database for the
// currently authenticated user
//
// authed endpoint
//
//	expects: {
//		name: string,
//		maxPartySize: number,
//		bookingCapacity: number,
//		bookingLength: number,
//	}
//
// bound to: POST /api/restaurant/create
type CreateRestaurantHandler struct{}

type createRestaurantRequest struct {
	Name            string `json:"name"`
	MaxPartySize    int    `json:"maxPartySize"`
	BookingCapacity int    `json:"bookingCapacity"`
	BookingLength   int    `json:"bookingLength"`
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
	sunday_hour_mask
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
	name,
	max_party_size,
	booking_capacity,
	booking_length
)
VALUES (
	(SELECT id FROM account WHERE email = ?),
	?,
	?,
	?,
	?,
	?
)
RETURNING (id)`,
		email,
		availability.ID,
		request.Name,
		request.MaxPartySize,
		request.BookingCapacity,
		request.BookingLength,
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

	w.Header().Add("Location", fmt.Sprintf("/account/%s", restaurant.ID))
	w.WriteHeader(http.StatusSeeOther)
}

// DeleteRestaurantHandler removes a restaurant from the database for the
// currently authenticated user
//
// authed endpoint
//
//	expects: {
//		id: string,
//		maxPartySize: number,
//		bookingCapacity: number,
//		bookingLength: number,
//	}
//
// bound to: POST /api/restaurant/delete
type DeleteRestaurantHandler struct{}

func (*DeleteRestaurantHandler) handle(
	ctx context.Context,
	db *gorm.DB,
	email string,
	id uuid.UUID,
) error {
	return gorm.G[any](db).Exec(ctx, `
DELETE FROM restaurant
USING account
WHERE restaurant.id = ?
	AND account.email = ?
	AND restaurant.account_id = account.id`,
		id,
		email,
	)
}

type restaurantRequest struct {
	ID uuid.UUID `json:"id"`
}

func (h *DeleteRestaurantHandler) ServeHTTP(ctx AuthedAppContext, w http.ResponseWriter, r *http.Request) {
	request := restaurantRequest{}
	err := json.NewDecoder(r.Body).Decode(&request)

	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		return
	}

	err = h.handle(r.Context(), ctx.DB, ctx.User.Email, request.ID)

	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		return
	}
}

// UpdateRestaurantHandler updates the details for a restaurant in the database
// for the currently authenticated user
//
// authed endpoint
//
//	expects: {
//		id: string,
//		name: string,
//		email: string,
//		phone: string,
//		description: string,
//		locationText: string,
//		locationUrl: string,
//		frontpageMarkdown: string,
//		maxPartySize: number,
//		bookingCapacity: number,
//		bookingLength: number,
//		tags: string[],
//	}
//
// bound to: POST /api/restaurant/update
type UpdateRestaurantHandler struct{}

type NonExistentRestaurantError struct{}

func (NonExistentRestaurantError) Error() string {
	return "Restaurant does not exist"
}

func (*UpdateRestaurantHandler) handle(
	ctx context.Context,
	db *gorm.DB,
	email string,
	restaurant restaurantDetails,
) error {
	rows, err := gorm.G[any](db).Raw(`
UPDATE restaurant
SET
	name = ?,
	email = ?,
	phone = ?,
	description = ?,
	location_text = ?,
	location_url = ?,
	frontpage_markdown = ?,
	max_party_size = ?,
	booking_capacity = ?,
	booking_length = ?,
	tags = ?
FROM account
WHERE restaurant.id = ?
	AND account.email = ?
	AND restaurant.account_id = account.id
RETURNING 0`,
		restaurant.Name,
		restaurant.Email,
		restaurant.Phone,
		restaurant.Description,
		restaurant.LocationText,
		restaurant.LocationUrl,
		restaurant.FrontpageMarkdown,
		restaurant.MaxPartySize,
		restaurant.BookingCapacity,
		restaurant.BookingLength,
		pq.StringArray(restaurant.Tags),
		restaurant.ID,
		email,
	).Find(ctx)

	if err != nil {
		return nil
	}

	if len(rows) == 0 {
		return NonExistentRestaurantError{}
	}

	return nil
}

func (h *UpdateRestaurantHandler) ServeHTTP(ctx AuthedAppContext, w http.ResponseWriter, r *http.Request) {
	request := restaurantDetails{}
	err := json.NewDecoder(r.Body).Decode(&request)

	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		return
	}

	db := ctx.DB.Begin()
	err = h.handle(r.Context(), db, ctx.User.Email, request)

	if err != nil {
		db.Rollback()
		w.WriteHeader(http.StatusInternalServerError)
		return
	}

	db.Commit()
}

// BrowseRestaurantsHandler fetches all restaurants
//
//	returns: {
//		id: string,
//		name: string,
//		email: string,
//		phone: string,
//		description: string,
//		locationText: string,
//		locationUrl: string,
//		frontpageMarkdown: string,
//		maxPartySize: number,
//		bookingCapacity: number,
//		bookingLength: number,
//		tags: string[],
//	}[]
//
// bound to: GET /api/restaurants
type BrowseRestaurantsHandler struct{}

func (*BrowseRestaurantsHandler) handle(
	ctx context.Context,
	db *gorm.DB,
) ([]restaurantDetails, error) {
	restaurants, err := gorm.G[model.Restaurant](db).
		Raw(`SELECT * FROM restaurant`).Find(ctx)

	if err != nil {
		return nil, err
	}

	res := make([]restaurantDetails, len(restaurants))
	for i, restaurant := range restaurants {
		res[i] = restaurantDetails{
			ID:                restaurant.ID,
			Name:              restaurant.Name,
			Email:             restaurant.Email,
			Phone:             restaurant.Phone,
			Description:       restaurant.Description,
			LocationText:      restaurant.LocationText,
			LocationUrl:       restaurant.LocationUrl,
			FrontpageMarkdown: restaurant.FrontpageMarkdown,
			MaxPartySize:      restaurant.MaxPartySize,
			BookingCapacity:   restaurant.BookingCapacity,
			BookingLength:     restaurant.BookingLength,
			Tags:              restaurant.Tags,
		}
	}

	return res, nil
}

func (h *BrowseRestaurantsHandler) ServeHTTP(ctx AppContext, w http.ResponseWriter, r *http.Request) {
	restaurants, err := h.handle(r.Context(), ctx.DB)

	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		return
	}

	err = json.NewEncoder(w).Encode(&restaurants)

	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		return
	}
}

// RestaurantDetailsHandler fetches the details of a single restaurant
//
// expects: .../{restaurant}: restaurant id path-param
//
//	returns: {
//		id: string,
//		name: string,
//		email: string,
//		phone: string,
//		description: string,
//		locationText: string,
//		locationUrl: string,
//		frontpageMarkdown: string,
//		maxPartySize: number,
//		bookingCapacity: number,
//		bookingLength: number,
//		tags: string[],
//	}
//
// bound to: GET /api/restaurant/{restaurant}
type RestaurantDetailsHandler struct{}

func (*RestaurantDetailsHandler) handle(
	ctx context.Context,
	db *gorm.DB,
	id uuid.UUID,
) (restaurantDetails, error) {
	restaurant, err := gorm.G[model.Restaurant](db).Raw(`
SELECT *
FROM restaurant
WHERE id = ?`, id).First(ctx)

	if err != nil {
		return restaurantDetails{}, err
	}

	return restaurantDetails{
		ID:                restaurant.ID,
		Name:              restaurant.Name,
		Email:             restaurant.Email,
		Phone:             restaurant.Phone,
		Description:       restaurant.Description,
		LocationText:      restaurant.LocationText,
		LocationUrl:       restaurant.LocationUrl,
		FrontpageMarkdown: restaurant.FrontpageMarkdown,
		MaxPartySize:      restaurant.MaxPartySize,
		BookingCapacity:   restaurant.BookingCapacity,
		BookingLength:     restaurant.BookingLength,
		Tags:              restaurant.Tags,
	}, nil
}

func (h *RestaurantDetailsHandler) ServeHTTP(ctx AppContext, w http.ResponseWriter, r *http.Request) {
	restaurant, err := uuid.Parse(r.PathValue("restaurant"))
	if err != nil {
		w.WriteHeader(http.StatusBadRequest)
		return
	}
	restaurants, err := h.handle(r.Context(), ctx.DB, restaurant)

	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		return
	}

	err = json.NewEncoder(w).Encode(&restaurants)

	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		return
	}
}
