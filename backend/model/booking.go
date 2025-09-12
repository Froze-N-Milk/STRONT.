package model

import (
	"database/sql"
	"database/sql/driver"
	"fmt"
	"strconv"
	"strings"
	"time"

	"github.com/google/uuid"
)

type Booking struct {
	ID             uuid.UUID      `gorm:"primaryKey;default:gen_random_uuid()"`
	ContactID      uuid.UUID      `gorm:"not null"`
	RestaurantID   uuid.UUID      `gorm:"not null"`
	SeatingID      uuid.UUID      `gorm:"not null"`
	StartTime      time.Time      `gorm:"type:timestamptz;not null"`
	EndTime        time.Time      `gorm:"type:timestamptz;not null"`
	CreationDate   time.Time      `gorm:"type:timestamptz;not null"`
	CreationMethod CreationMethod `gorm:"type:text;not null"`
	Attendance     Attendance     `gorm:"type:text"`
	Bill           Monetary       `gorm:"type:numeric(12, 2)"`
	Paid           Monetary       `gorm:"type:numeric(12, 2)"`
	Contact        *CustomerContact
	Restaurant     *Restaurant
	Seating        *SeatingZone
}

func (Booking) TableName() string {
	return "booking"
}

/*
CreationMethod is a type-safe wrapper around a string to ensure that only valid strings can be inserted into the database

Valid values = { "online, "phone", "walk-in" }
*/
type CreationMethod string

const (
	Online CreationMethod = "online"
	Phone  CreationMethod = "phone"
	WalkIn CreationMethod = "walk-in"
)

// Value is a custom gorm serialisation method for the CreationMethod type.
func (cm CreationMethod) Value() (driver.Value, error) {
	return string(cm), nil
}

// Scan is a custom gorm deserialisation method for the CreationMethod type.
func (cm *CreationMethod) Scan(value interface{}) error {
	str, ok := value.([]byte)
	if !ok {
		return fmt.Errorf("failed to deserialise CreationMethod value")
	}
	*cm = CreationMethod(str)
	return nil
}

/*
Attendance is a type-safe wrapper around a string to ensure that only valid strings can be inserted into the database

Valid values = { "attended", "late", "cancelled", "no-show" }
*/
type Attendance string

const (
	Attended  Attendance = "attended"
	Late      Attendance = "late"
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

/*
Monetary is a limited implementation of the NUMERIC type from Postgres, in which it is expected to store an arbitrary
number of dollar digits, but only two cents digits. This does not fulfil the full functionality of NUMERIC, as it does
not length-check the digits for the dollars field, and it does not allow arbitrary lengths for the cents field.
*/
type Monetary struct {
	Dollars int64
	Cents   int64
}

// Value is a custom gorm serialisation method for the Monetary struct.
func (n Monetary) Value() (driver.Value, error) {
	return fmt.Sprintf("%d.%02d", n.Dollars, n.Cents), nil
}

// Scan is a custom gorm deserialisation method for the Monetary struct.
// It accepts formats with or without cents after a decimal place, but always requires dollars.
func (n *Monetary) Scan(value interface{}) error {
	var s sql.NullString
	// Try to scan in the value returned from the db query
	if err := s.Scan(value); err != nil {
		return err
	}

	// Remove any excess whitespace
	str := strings.TrimSpace(s.String)
	if str == "" { // If there's nothing left after removing excess whitespace, there's no value to set. Return early.
		return nil
	}

	// Get all parts of the string separated by a period
	parts := strings.Split(str, ".")

	// If there's more than two parts separated by a period, it's not a valid monetary value format.
	if len(parts) > 2 {
		return fmt.Errorf("invalid monetary value format: %s", str)
	}

	// Attempt to parse the first part of the string in Base 10, as a 64-bit integer.
	dollars, err := strconv.ParseInt(parts[0], 10, 64)
	if err != nil {
		return fmt.Errorf("invalid dollars part: %w", err)
	}
	n.Dollars = dollars

	// Check if there's a second part of the string
	if len(parts) == 2 {
		// If there is, attempt to parse the second part in Base 10 as a 64-bit integer.
		cents, err := strconv.ParseInt(parts[1], 10, 64)
		if err != nil {
			return fmt.Errorf("invalid cents part: %w", err)
		}
		n.Cents = cents
	}

	return nil
}
