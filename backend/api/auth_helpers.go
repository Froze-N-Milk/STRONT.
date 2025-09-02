package api

import (
	"crypto/rand"
	"encoding/base64"
	"errors"
	"fmt"
	"log/slog"
	"net/http"
	"os"
	"plange/backend/lib"
	"time"

	"github.com/golang-jwt/jwt/v5"
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

type InccorectKeyLenError struct {
	len int
}

func (e *InccorectKeyLenError) Error() string {
	return fmt.Sprintf("Expected a 32 byte key, got %d bytes", e.len)
}

func GetOrMakeJWTSigningKey(path string) ([32]byte, error) {
	// key buffer
	key := [32]byte{}
	// try to open the file
	encodedKey, err := os.ReadFile(path)
	// if it doesn't exist, create the file and write a new key to it
	if errors.Is(err, os.ErrNotExist) {
		slog.Info(fmt.Sprintf("jwt signing key file %s, does not exist, creating a new signing key and making file", path))
		// fill key with random bytes
		rand.Read(key[:])
		// create file as it doesn't exist
		f, err := os.Create(path)
		if err != nil {
			return key, err
		}
		defer f.Close()
		// write base64 encoded key to file
		w := base64.NewEncoder(base64.StdEncoding, f)
		_, err = w.Write(key[:])
		if err != nil {
			return key, err
		}
		err = w.Close()
		if err != nil {
			return key, err
		}
		// return new key
		return key, nil
	} else if err != nil {
		return key, err
	}
	// try to decode the key from base64
	n, err := base64.StdEncoding.Decode(key[:], encodedKey)
	if err != nil {
		return key, err
	}
	if n != 32 {
		return key, &InccorectKeyLenError{n}
	}

	return key, nil
}

type jwtClaims struct {
	Email string `json:"email"`
	jwt.RegisteredClaims
}

// creates a new JWT that authorises email and is valid for 2 hours
func NewJWT(email string, key *[32]byte) (string, error) {
	return jwt.NewWithClaims(
		jwt.SigningMethodHS256,
		jwtClaims{
			email,
			jwt.RegisteredClaims{
				ExpiresAt: jwt.NewNumericDate(time.Now().Add(2 * time.Hour)),
				IssuedAt:  jwt.NewNumericDate(time.Now()),
				NotBefore: jwt.NewNumericDate(time.Now()),
			},
		},
	).SignedString(key[:])
}

type InvalidClaims struct {
	jwt.Claims
}

func (*InvalidClaims) Error() string {
	return "Invalid claims type"
}

func ValidateJWT(tokenString string, key *[32]byte) (email string, remainingTime time.Duration, err error) {
	token, err := jwt.ParseWithClaims(tokenString, &jwtClaims{}, func(token *jwt.Token) (any, error) {
		return key[:], nil
	})
	if err != nil {
		return "", -1, err
	}

	claims, ok := token.Claims.(*jwtClaims)
	if !ok {
		return "", -1, &InvalidClaims{token.Claims}
	}

	return claims.Email, claims.ExpiresAt.Sub(time.Now()), nil
}

type AuthMode int

const (
	Frontend AuthMode = iota
	SensitiveFrontend
	Api
	SensitiveApi
)

type AuthMiddleware struct {
	Mode AuthMode
	Key  *[32]byte
}

type User struct {
	Email string
}

func setSessionTokenCookie(w http.ResponseWriter, content string) {
	w.Header().Add("Set-Cookie", fmt.Sprintf("session-token=\"%s\"; HttpOnly; Secure; Partitioned; Path=/", content))
}

func setSessionToken(w http.ResponseWriter, email string, key *[32]byte) error {
	token, err := NewJWT(email, key)
	if err != nil {
		return err
	}
	setSessionTokenCookie(w, token)
	return nil
}

func (m *AuthMiddleware) Service(h lib.Handler[User]) http.Handler {
	switch m.Mode {
	case Api:
		return authMiddleware(h, m.Key, func(w http.ResponseWriter) {
			w.WriteHeader(http.StatusUnauthorized)
		})
	case Frontend:
		return authMiddleware(h, m.Key, func(w http.ResponseWriter) {
			w.Header().Add("Location", "/login")
			w.WriteHeader(http.StatusSeeOther)
		})
	case SensitiveApi:
		return authMiddleware(h, m.Key, func(w http.ResponseWriter) {
			w.WriteHeader(http.StatusForbidden)
		})
	case SensitiveFrontend:
		return authMiddleware(h, m.Key, func(w http.ResponseWriter) {
			w.WriteHeader(http.StatusForbidden)
		})
	default:
		panic(fmt.Sprintf("unexpected api.AuthMode: %#v", m.Mode))
	}
}

func authMiddleware(h lib.Handler[User], key *[32]byte, onErr func(http.ResponseWriter)) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		token, err := r.Cookie("session-token")
		if err != nil || token.Value == "" {
			slog.Error("session token not set", "url", r.URL, "error", err)
			onErr(w)
			return
		}
		email, remainingTime, err := ValidateJWT(token.Value, key)
		if err != nil {
			slog.Error("Invalid session token", "url", r.URL, "error", err)
			setSessionTokenCookie(w, "")
			onErr(w)
			return
		}

		if remainingTime > 0 && remainingTime < 30*time.Minute {
			err := setSessionToken(w, email, key)
			if err != nil {
				slog.Error("Unable to re-issue fresh token for", "email", email, "url", r.URL, "error", err)
			}
		}

		slog.Info("logged in as", "email", email)

		h.ServeHTTP(User{email}, w, r)
	})
}
