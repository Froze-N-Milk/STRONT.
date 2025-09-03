package model

import "github.com/google/uuid"

type Restaurant struct {
	ID             uuid.UUID     `json:"id" gorm:"primaryKey;default:gen_random_uuid()"`
	AccountID      uuid.UUID     `gorm:"not null"`
	AvailabilityID uuid.UUID     `gorm:"not null"`
	Name           string        `json:"name" gorm:"type:text;not null"`
	Description    string        `json:"description" gorm:"type:text"`
	LocationText   string        `json:"location_test" gorm:"type:text"`
	LocationUrl    string        `json:"location_url" gorm:"type:text"`
	Availability   *Availability `json:"availability" gorm:"foreignKey:AvailabilityID;references:ID"`
}

func (Restaurant) TableName() string {
	return "restaurant"
}
