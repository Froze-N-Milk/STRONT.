package api

import (
	"crypto/rand"

	"github.com/google/uuid"
	"golang.org/x/crypto/argon2"
)

type Account struct {
	ID           uuid.UUID `json:"id" gorm:"primary_key;default:gen_random_uuid()"`
	Email        string    `json:"email"`
	PasswordHash []byte    `json:"password_hash" gorm:"type:bytea"`
	PasswordSalt []byte    `json:"password_salt" gorm:"type:bytea"`
}

func (Account) TableName() string {
	return "account"
}

func CreateSaltAndHashPassword(password string) (salt [128]byte, hash [256]byte) {
	salt = CreateSalt()
	hash = HashPassword(password, salt)
	return salt, hash
}

func HashPassword(password string, salt [128]byte) [256]byte {
	return [256]byte(argon2.IDKey([]byte(password), salt[:], 1, 64*1024, 4, 256))
}

func CreateSalt() [128]byte {
	salt := [128]byte{}
	// note: rand.Read will never return an err, so we just ignore the
	// value, rather than propagating it
	_, _ = rand.Read(salt[:])
	return salt
}
