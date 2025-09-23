package model

import (
	"time"

	"github.com/google/uuid"
)

type Occasion struct {
	AvailabilityID  uuid.UUID `gorm:"not null"`
	Date            time.Time `gorm:"type:date;not null"`
	HourMask        int64     `gorm:"not null"`
	YearlyRecurring bool      `gorm:"default:false;not null"`
}

func (Occasion) TableName() string {
	return "occasion"
}
