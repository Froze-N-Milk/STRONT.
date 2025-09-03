package model

import "github.com/google/uuid"

type Account struct {
	ID           uuid.UUID    `json:"id" gorm:"primaryKey;default:gen_random_uuid()"`
	Email        string       `json:"email" gorm:"index:idx_account_email;unique;not null"`
	PasswordHash []byte       `gorm:"type:bytea;not null"` // omitted json tag as we shouldn't be sending this to a client
	PasswordSalt []byte       `gorm:"type:bytea;not null"` // omitted json tag
	Restaurants  []Restaurant `gorm:"foreignKey:AccountID;references:ID"`
}

func (Account) TableName() string {
	return "account"
}
