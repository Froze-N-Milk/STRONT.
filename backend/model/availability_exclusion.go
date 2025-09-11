package model

import (
	"time"

	"github.com/google/uuid"
)

type AvailabilityExclusion struct {
	ID              uuid.UUID `gorm:"primaryKey;default:gen_random_uuid()"`
	AvailabilityID  uuid.UUID `gorm:"not null"`
	CloseDate       time.Time `gorm:"type:date;not null"`
	HourMask        int64     `gorm:"not null"`
	YearlyRecurring bool      `gorm:"default:false;not null"`
}

func (AvailabilityExclusion) TableName() string {
	return "availability_exclusion"
}
