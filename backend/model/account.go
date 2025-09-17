package model

import "github.com/google/uuid"

type Account struct {
	ID           uuid.UUID `gorm:"primaryKey;default:gen_random_uuid()"`
	Email        string    `gorm:"index:idx_account_email;unique;not null"`
	PasswordHash []byte    `gorm:"type:bytea;not null"` // omitted json tag as we shouldn't be sending this to a client
	PasswordSalt []byte    `gorm:"type:bytea;not null"` // omitted json tag
	Restaurants  []Restaurant
}

func (Account) TableName() string {
	return "account"
}
