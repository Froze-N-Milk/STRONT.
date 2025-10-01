package model

import (
	"time"

	"github.com/google/uuid"
)

type Booking struct {
	ID              uuid.UUID `gorm:"primaryKey;default:gen_random_uuid()"`
	ContactID       uuid.UUID `gorm:"not null"`
	RestaurantID    uuid.UUID `gorm:"not null"`
	PartySize       int       `gorm:"not null"`
	BookingDate     time.Time `gorm:"type:date;not null"`
	TimeSlot        int       `gorm:"not null"`
	CreationDate    time.Time `gorm:"type:timestamptz;not null"`
	CustomerCreated bool      `gorm:"default:false;not null"`
	Attendance      string    `gorm:"type:text;default:'pending'"`
	CustomerNotes   string    `gorm:"type:text"`
	RestaurantNotes string    `gorm:"type:text"`
	Contact         *CustomerContact
	Restaurant      *Restaurant
}

func (Booking) TableName() string {
	return "booking"
}
