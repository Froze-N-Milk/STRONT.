package model

import "github.com/google/uuid"

type Availability struct {
	ID                uuid.UUID               `json:"id" gorm:"primaryKey;default:gen_random_uuid()"`
	MondayHourMask    int64                   `json:"monday_hour_mask" gorm:"not null"`
	TuesdayHourMask   int64                   `json:"tuesday_hour_mask" gorm:"not null"`
	WednesdayHourMask int64                   `json:"wednesday_hour_mask" gorm:"not null"`
	ThursdayHourMask  int64                   `json:"thursday_hour_mask" gorm:"not null"`
	FridayHourMask    int64                   `json:"friday_hour_mask" gorm:"not null"`
	SaturdayHourMask  int64                   `json:"saturday_hour_mask" gorm:"not null"`
	SundayHourMask    int64                   `json:"sunday_hour_mask" gorm:"not null"`
	Exclusions        []AvailabilityExclusion `json:"exclusions" gorm:"foreignKey:AvailabilityID;references:ID"`
}

func (Availability) TableName() string {
	return "availability"
}
