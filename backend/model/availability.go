package model

import "github.com/google/uuid"

type Availability struct {
	ID                uuid.UUID `gorm:"primaryKey;default:gen_random_uuid()"`
	MondayHourMask    int64     `gorm:"not null"`
	TuesdayHourMask   int64     `gorm:"not null"`
	WednesdayHourMask int64     `gorm:"not null"`
	ThursdayHourMask  int64     `gorm:"not null"`
	FridayHourMask    int64     `gorm:"not null"`
	SaturdayHourMask  int64     `gorm:"not null"`
	SundayHourMask    int64     `gorm:"not null"`
	Occasions         []Occasion
}

func (Availability) TableName() string {
	return "availability"
}
