package model

import (
	"encoding/json"
	"fmt"
	"time"

	"github.com/google/uuid"
)

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

// for any occasions for the week, set the hours for that day to be that
// of the occasion
func (a *Availability) ApplyOccasions(today time.Time, nextWeek time.Time) {
	for _, occasion := range a.Occasions {
		// check if a yearly recurring occasion should be included
		if occasion.YearlyRecurring {
			newDate := time.Date(today.Year(), occasion.Date.Month(), occasion.Date.Day(), 0, 0, 0, 0, time.Local)
			if newDate.Before(today) || newDate.After(nextWeek) {
				continue
			}
		}
		// all other occasions are assumed to be applied for this
		// current week
		*a.WeekdayMask(occasion.Date.Weekday()) = occasion.HourMask
	}
}

type OpeningHours struct {
	Date  time.Time
	Hours int64
}

func (o OpeningHours) MarshalJSON() ([]byte, error) {
	return json.Marshal(struct {
		Date  int64 `json:"date"`
		Hours int64 `json:"hours"`
	}{
		Date:  o.Date.UnixMilli(),
		Hours: o.Hours,
	})
}

func (o *OpeningHours) UnmarshalJSON(data []byte) error {
	raw := struct {
		Date  int64 `json:"date"`
		Hours int64 `json:"hours"`
	}{}


	err := json.Unmarshal(data, &raw)

	if err != nil {
		return err
	}

	o.Date = time.UnixMilli(raw.Date)
	o.Hours = raw.Hours

	return nil
}

// returns the next 7 days of restaurant openings in order
//
// weekday: 'current' day of the week
func (a *Availability) IntoOrder(today time.Time) [7]OpeningHours {
	weekday := today.Weekday()
	res := [7]OpeningHours{}

	// fill res with the correct mask per week day
	for i := range time.Weekday(7) {
		res[i].Date = today.AddDate(0, 0, int(i))
		// weekday value for the current `i`
		weekday := time.Weekday((weekday + i) % 7)
		// set i to be the hours of the weekday
		res[i].Hours = *a.WeekdayMask(weekday)
	}

	return res
}

// maps time.Weekday to a pointer to the hour mask
func (a *Availability) WeekdayMask(weekday time.Weekday) *int64 {
	switch weekday {
	case time.Monday:
		return &a.MondayHourMask
	case time.Tuesday:
		return &a.TuesdayHourMask
	case time.Wednesday:
		return &a.WednesdayHourMask
	case time.Thursday:
		return &a.ThursdayHourMask
	case time.Friday:
		return &a.FridayHourMask
	case time.Saturday:
		return &a.SaturdayHourMask
	case time.Sunday:
		return &a.SundayHourMask
	default:
		panic(fmt.Sprintf("unexpected time.Weekday: %#v", weekday))
	}
}
