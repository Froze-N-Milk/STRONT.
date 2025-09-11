package model

import (
	"time"

	"github.com/google/uuid"
)

type AvailabilityExclusion struct {
	ID              uuid.UUID `json:"id" gorm:"primaryKey;default:gen_random_uuid()"`
	AvailabilityID  uuid.UUID `gorm:"not null"`
	CloseDate       time.Time `json:"close_date" gorm:"type:date;not null"`
	HourMask        int64     `json:"hour_mask" gorm:"not null"`
	YearlyRecurring bool      `json:"yearly_recurring" gorm:"default:false;not null"`
}
