package model

import (
	"database/sql/driver"
	"fmt"
	"time"

	"github.com/google/uuid"
)

type Booking struct {
	ID              uuid.UUID  `gorm:"primaryKey;default:gen_random_uuid()"`
	ContactID       uuid.UUID  `gorm:"not null"`
	RestaurantID    uuid.UUID  `gorm:"not null"`
	PartySize       int32      `gorm:"not null"`
	BookingDate     time.Time  `gorm:"type:date;not null"`
	TimeSlot        int32      `gorm:"not null"`
	CreationDate    time.Time  `gorm:"type:timestamptz;not null"`
	CustomerCreated bool       `gorm:"default:false;not null"`
	Attendance      Attendance `gorm:"type:text"`
	CustomerNotes   string     `gorm:"type:text"`
	RestaurantNotes string     `gorm:"type:text"`
	Contact         *CustomerContact
	Restaurant      *Restaurant
}

func (Booking) TableName() string {
	return "booking"
}

/*
Attendance is a type-safe wrapper around a string to ensure that only valid strings can be inserted into the database

Valid values = { "attended", "late", "cancelled", "no-show" }
*/
type Attendance string

const (
	Attended  Attendance = "attended"
	Cancelled Attendance = "cancelled"
	NoShow    Attendance = "no-show"
)

// Value is a custom gorm serialisation method for the Attendance type.
func (a Attendance) Value() (driver.Value, error) {
	return string(a), nil
}

// Scan is a custom gorm deserialisation method for the Attendance type.
func (a *Attendance) Scan(value interface{}) error {
	str, ok := value.([]byte)
	if !ok {
		return fmt.Errorf("failed to deserialise Attendance value")
	}
	*a = Attendance(str)
	return nil
}
