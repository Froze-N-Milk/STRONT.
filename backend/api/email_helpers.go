package api

import (
	"fmt"
	"html"
	"log/slog"
	"net/smtp"
	"slices"
	"strings"
	"time"

	"github.com/google/uuid"
)

// helper for sending emails
// leaving the username or password empty will cause all methods to do nothing
type EmailHelper struct {
	LocalHost        bool
	AllowedAddresses []string
	Username         string
	Password         string
}

type Mailbox struct {
	name    string
	address string
}

type NoAddress struct{}

func (NoAddress) Error() string {
	return "No email address provided"
}

func (m *Mailbox) to() (string, error) {
	if m.address == "" {
		return "", NoAddress{}
	}
	if m.name == "" {
		return fmt.Sprintf("To: %s\r\n", m.address), nil
	}
	return fmt.Sprintf("To: %s <%s>\r\n", m.name, m.address), nil
}

type EmailAuthUnconfigured struct{}

func (EmailAuthUnconfigured) Error() string {
	return "Email username or password not set, unable to send email"
}

type InvalidEmailAddress struct{}

func (InvalidEmailAddress) Error() string {
	return "Not an allowed email address"
}

// lower-level sendmail utility
func (h *EmailHelper) SendMail(toMailbox Mailbox, subject, plaintext, html, ics string) error {
	boundary := uuid.New()
	innerBoundary := fmt.Sprintf("--%s\r\n", boundary)
	finalBoundary := fmt.Sprintf("--%s--\r\n", boundary)

	toHeader, err := toMailbox.to()
	if err != nil {
		return err
	}
	message := fmt.Sprintf("Content-Type: multipart/alternative; boundary=\"%s\"\r\n", boundary) +
		toHeader +
		"From: STRONT. Bookings <bookings@stront.rest>\r\n" +
		fmt.Sprintf("Subject: %s\r\n", subject) +
		"\r\n" +
		innerBoundary +
		"Content-Type: text/plain; charset=UTF-8\r\nContent-Transfer-Encoding: 7bit\r\n\r\n" +
		plaintext + "\r\n" +
		innerBoundary +
		"Content-Type: text/html; charset=UTF-8\r\nContent-Transfer-Encoding: 7bit\r\n\r\n" +
		html + "\r\n" +
		innerBoundary +
		"Content-Type: text/calendar; charset=UTF-8; method=PUBLISH\r\nContent-Transfer-Encoding: 7bit\r\n\r\n" +
		ics + "\r\n" +
		finalBoundary

	// if addresses limited and this one not allowed, dont send
	if (len(h.AllowedAddresses) > 0 || h.LocalHost) && !slices.Contains(h.AllowedAddresses, toMailbox.address) {
		slog.Debug("not an allowed email address, unable to send email", "message", message)
		return InvalidEmailAddress{}
	}
	// if auth not configured, don't send
	if h.Username == "" || h.Password == "" {
		slog.Debug("email auth unconfigured, unable to send email", "message", message)
		return EmailAuthUnconfigured{}
	}

	return smtp.SendMail(
		"frozenmilk.dev:587",
		smtp.PlainAuth("", h.Username, h.Password, "frozenmilk.dev"),
		"bookings@stront.rest",
		[]string{toMailbox.address},
		[]byte(message),
	)
}

func htmlTemplate(body string) string {
	return fmt.Sprintf(`<!DOCTYPE html><html><head><meta http-equiv="Content-Type" content="text/html; charset=UTF-8"></head><body>%s</body></html>`, body)
}

type BookingNotification struct {
	Mailbox        Mailbox
	ID             uuid.UUID
	RestaurantName string
	Attendance     string
	CustomerName   string
	Date           time.Time
	Duration       time.Duration
	PartySize      int
	Notes          string
}

// sends an email to the restaurant
func (h *EmailHelper) NotifyRestaurant(notification BookingNotification) error {
	// TODO: get customer's timezone, and format with that
	dateTime := notification.Date.Format("Monday, January 2, 2006 at 3:04 PM")

	var subjectLine string
	var messageLine string
	switch notification.Attendance {
	case "attended", "no-show":
		// no need to notify
		return nil
	case "pending":
		subjectLine = fmt.Sprintf("New booking at %s on %s", notification.RestaurantName, dateTime)
		messageLine = fmt.Sprintf("%s has booked for %d people to dine at %s on %s.",
			notification.CustomerName,
			// party size
			notification.PartySize,
			// restaurant name
			notification.RestaurantName,
			// date and time
			// TODO: get account owner's timezone, and format with that
			dateTime,
		)
	case "cancelled":
		subjectLine = fmt.Sprintf("Cancelled booking at %s on %s", notification.RestaurantName, dateTime)
		messageLine = fmt.Sprintf("%s's booking for %d people to dine at %s on %s has been cancelled.",
			notification.CustomerName,
			// party size
			notification.PartySize,
			// restaurant name
			notification.RestaurantName,
			// date and time
			// TODO: get account owner's timezone, and format with that
			dateTime,
		)
	default:
		panic(fmt.Sprintf("unexpected attendance: %#v", notification.Attendance))
	}

	var plaintextNotes string
	var htmlNotes string
	if notification.Notes != "" {
		plaintextNotes = strings.ReplaceAll(notification.Notes, "\n", "\r\n") + "\r\n\r\n"
		htmlNotes = strings.ReplaceAll(html.EscapeString(notification.Notes), "\n", "<br>") + "<br><br>"
	}

	var host string
	if h.LocalHost {
		host = "http://localhost:3000"
	} else {
		host = "https://stront.rest"
	}

	plaintext := messageLine + "\r\n\r\n" +
		plaintextNotes +
		fmt.Sprintf("See it on STRONT: <%s>\r\n", fmt.Sprintf("%s/bookings/%s", host, notification.ID)) +
		fmt.Sprintf("Add it to your calendar: <%s>\r\n", fmt.Sprintf("%s/bookings/cal/%s.ics", host, notification.ID))

	html := htmlTemplate(messageLine + "<br><br>" +
		htmlNotes +
		fmt.Sprintf("<a href=\"%s\">See it on STRONT</a><br>", fmt.Sprintf("%s/bookings/%s", host, notification.ID)) +
		fmt.Sprintf("<a href=\"%s\">Add it to your calendar</a><br>", fmt.Sprintf("%s/bookings/cal/%s.ics", host, notification.ID)),
	)

	return h.SendMail(
		notification.Mailbox,
		subjectLine,
		plaintext,
		html,
		createIcs(
			h.LocalHost,
			notification.ID,
			notification.RestaurantName,
			notification.PartySize,
			notification.Date,
			notification.Duration,
			notification.Attendance,
		),
	)
}

// sends an email to a customer
func (h *EmailHelper) NotifyCustomer(notification BookingNotification) error {
	// TODO: get customer's timezone, and format with that
	dateTime := notification.Date.Format("Monday, January 2, 2006 at 3:04 PM")

	var subjectLine string
	var messageLine string
	switch notification.Attendance {
	case "attended", "no-show":
		// no need to notify
		return nil
	case "pending":
		subjectLine = fmt.Sprintf("New booking at %s on %s", notification.RestaurantName, dateTime)
		messageLine = fmt.Sprintf("You have booked for %d people to dine at %s on %s.",
			// party size
			notification.PartySize,
			// restaurant name
			notification.RestaurantName,
			// date and time
			// TODO: get account owner's timezone, and format with that
			dateTime,
		)
	case "cancelled":
		subjectLine = fmt.Sprintf("Cancelled booking at %s on %s", notification.RestaurantName, dateTime)
		messageLine = fmt.Sprintf("Your booking for %d people to dine at %s on %s has been cancelled.",
			// party size
			notification.PartySize,
			// restaurant name
			notification.RestaurantName,
			// date and time
			// TODO: get account owner's timezone, and format with that
			dateTime,
		)
	default:
		panic(fmt.Sprintf("unexpected attendance: %#v", notification.Attendance))
	}

	var plaintextNotes string
	var htmlNotes string
	if notification.Notes != "" {
		plaintextNotes = strings.ReplaceAll(notification.Notes, "\n", "\r\n") + "\r\n\r\n"
		htmlNotes = strings.ReplaceAll(html.EscapeString(notification.Notes), "\n", "<br>") + "<br><br>"
	}

	var host string
	if h.LocalHost {
		host = "http://localhost:3000"
	} else {
		host = "https://stront.rest"
	}

	plaintext := messageLine + "\r\n\r\n" +
		plaintextNotes +
		fmt.Sprintf("See it on STRONT: <%s>\r\n", fmt.Sprintf("%s/bookings/%s", host, notification.ID)) +
		fmt.Sprintf("Add it to your calendar: <%s>\r\n", fmt.Sprintf("%s/bookings/cal/%s.ics", host, notification.ID))

	html := htmlTemplate(messageLine + "<br><br>" +
		htmlNotes +
		fmt.Sprintf("<a href=\"%s\">See it on STRONT</a><br>", fmt.Sprintf("%s/booking/%s", host, notification.ID)) +
		fmt.Sprintf("<a href=\"%s\">Add it to your calendar</a><br>", fmt.Sprintf("%s/booking/cal/%s.ics", host, notification.ID)),
	)

	return h.SendMail(
		notification.Mailbox,
		subjectLine,
		plaintext,
		html,
		createIcs(
			h.LocalHost,
			notification.ID,
			notification.RestaurantName,
			notification.PartySize,
			notification.Date,
			notification.Duration,
			notification.Attendance,
		),
	)
}
