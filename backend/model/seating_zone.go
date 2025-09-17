package model

import "github.com/google/uuid"

type SeatingZone struct {
	ID           uuid.UUID `gorm:"primaryKey;default:gen_random_uuid()"`
	RestaurantID uuid.UUID `gorm:"not null"`
	ZoneName     string    `gorm:"type:text;not null"`
	Seats        int       `gorm:"not null"`
	Restaurant   *Restaurant
}

func (SeatingZone) TableName() string {
	return "seating_zone"
}
