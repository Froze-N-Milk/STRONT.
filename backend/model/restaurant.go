package model

import (
	"github.com/google/uuid"
	"github.com/lib/pq"
)

type Restaurant struct {
	ID                uuid.UUID      `gorm:"primaryKey;default:gen_random_uuid()"`
	AccountID         uuid.UUID      `gorm:"not null"`
	AvailabilityID    uuid.UUID      `gorm:"not null"`
	Name              string         `gorm:"type:text;not null"`
	Description       string         `gorm:"type:text"`
	LocationText      string         `gorm:"type:text"`
	LocationUrl       string         `gorm:"type:text"`
	FrontpageMarkdown string         `gorm:"type:text"`
	MaxPartySize      int            `gorm:"not null"`
	BookingCapacity   int            `gorm:"not null"`
	BookingLength     int            `gorm:"not null"`
	Tags              pq.StringArray `gorm:"type:text[]"`
	Availability      *Availability
	Bookings          []Booking
}

func (Restaurant) TableName() string {
	return "restaurant"
}
