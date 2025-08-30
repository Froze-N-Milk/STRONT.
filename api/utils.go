package api

import (
	"crypto/rand"

	"golang.org/x/crypto/argon2"
)

func HashPassword(password string, salt [128]byte) [256]byte {
	return [256]byte(argon2.IDKey([]byte(password), salt[:], 1, 64*1024, 4, 256))
}

func CreateSalt() (salt [128]byte, err error) {
	salt = [128]byte{}
	_, err = rand.Read(salt[:])

	return salt, err
}
