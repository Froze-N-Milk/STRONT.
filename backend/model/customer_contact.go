package model

import "github.com/google/uuid"

type CustomerContact struct {
	ID         uuid.UUID `gorm:"primaryKey;default:gen_random_uuid()"`
	GivenName  string    `gorm:"type:text;not null"`
	FamilyName string    `gorm:"type:text;not null"`
	Phone      string    `gorm:"type:text"`
	Email      string    `gorm:"type:text;not null"`
}

func (CustomerContact) TableName() string {
	return "customer_contact"
}
