package model

import "github.com/google/uuid"

type Account struct {
	ID           uuid.UUID `json:"id" gorm:"primary_key;default:gen_random_uuid()"`
	Email        string    `json:"email" gorm:"index:idx_account_email,unique"`
	PasswordHash []byte    `gorm:"type:bytea"` // omitted json tag as we shouldn't be sending this to a client
	PasswordSalt []byte    `gorm:"type:bytea"` // omitted json tag
}

func (Account) TableName() string {
	return "account"
}
