package model

import (
	"fmt"
	"testing"
	"time"
)

// ensures that the lookup of `time.Weekday` -> `*Availability.*HourMask` is correct
func TestWeekdayMask(t *testing.T) {
	availability := func() Availability {
		return Availability{
			MondayHourMask:    0b1,
			TuesdayHourMask:   0b10,
			WednesdayHourMask: 0b100,
			ThursdayHourMask:  0b1000,
			FridayHourMask:    0b10000,
			SaturdayHourMask:  0b100000,
			SundayHourMask:    0b1000000,
		}
	}
	inner := func(weekday time.Weekday, expected int64) func(*testing.T) {
		return func(t *testing.T) {
			availability := availability()
			mask := *availability.WeekdayMask(weekday)
			if mask != expected {
				t.Errorf(`availability.WeekdayMask(%#v) = %#b, want %#b`, weekday, mask, expected)
			}
		}
	}

	t.Run("Monday", inner(time.Monday, 0b1))
	t.Run("Tuesday", inner(time.Tuesday, 0b10))
	t.Run("Wednesday", inner(time.Wednesday, 0b100))
	t.Run("Thursday", inner(time.Thursday, 0b1000))
	t.Run("Friday", inner(time.Friday, 0b10000))
	t.Run("Saturday", inner(time.Saturday, 0b100000))
	t.Run("Sunday", inner(time.Sunday, 0b1000000))
}

func TestOccasions(t *testing.T) {
	now := time.Now()
	today := time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, time.Local)
	nextWeek := today.AddDate(0, 0, 7)
	adjustToWeekday := func(date time.Time, weekday time.Weekday) time.Time {
		weekdayOffset := (7 - date.Weekday())
		return date.AddDate(0, 0, (int)((weekday+weekdayOffset)%7))
	}

	oneOff := func(weekday time.Weekday) func(*testing.T) {
		return func(t *testing.T) {
			occasionDate := adjustToWeekday(today, weekday)
			if occasionDate.Weekday() != weekday {
				t.Errorf(`test logic incorrect: occasionDate.Weekday() = %#v, want %#v`, occasionDate.Weekday(), weekday)
				return
			}
			availability := Availability{
				MondayHourMask:    0,
				TuesdayHourMask:   0,
				WednesdayHourMask: 0,
				ThursdayHourMask:  0,
				FridayHourMask:    0,
				SaturdayHourMask:  0,
				SundayHourMask:    0,
				Occasions: []Occasion{
					{
						Date:     occasionDate,
						HourMask: 1,
					},
				},
			}

			availability.ApplyOccasions(today, nextWeek)
			for i := range time.Weekday(7) {
				mask := *availability.WeekdayMask(i)
				if i == weekday && mask != 1 {
					t.Errorf(`availability.WeekdayMask(%#v) = %#b, want %#b`, weekday, mask, 1)
				} else if i != weekday && mask != 0 {
					t.Errorf(`availability.WeekdayMask(%#v) = %#b, want %#b`, weekday, mask, 0)
				}
			}
		}
	}

	recurringApply := func(weekday time.Weekday) func(*testing.T) {
		return func(t *testing.T) {
			occasionDate := adjustToWeekday(time.Date(0, now.Month(), now.Day(), 0, 0, 0, 0, time.Local), weekday)
			if occasionDate.Weekday() != weekday {
				t.Errorf(`test logic incorrect: occasionDate.Weekday() = %#v, want %#v`, occasionDate.Weekday(), weekday)
				return
			}
			availability := Availability{
				MondayHourMask:    0,
				TuesdayHourMask:   0,
				WednesdayHourMask: 0,
				ThursdayHourMask:  0,
				FridayHourMask:    0,
				SaturdayHourMask:  0,
				SundayHourMask:    0,
				Occasions: []Occasion{
					{
						Date:            occasionDate,
						HourMask:        1,
						YearlyRecurring: true,
					},
				},
			}
			availability.ApplyOccasions(today, nextWeek)
			for i := range time.Weekday(7) {
				mask := *availability.WeekdayMask(i)
				if i == weekday && mask != 1 {
					t.Errorf(`availability.WeekdayMask(%#v) = %#b, want %#b. availability: %#v`, weekday, mask, 1, availability)
				} else if i != weekday && mask != 0 {
					t.Errorf(`availability.WeekdayMask(%#v) = %#b, want %#b`, weekday, mask, 0)
				}
			}
		}
	}

	recurringDontApply := func(weekday time.Weekday) func(*testing.T) {
		return func(t *testing.T) {
			occasionDate := adjustToWeekday(time.Date(0, now.Month() + 1, now.Day(), 0, 0, 0, 0, time.Local), weekday)
			if occasionDate.Weekday() != weekday {
				t.Errorf(`test logic incorrect: occasionDate.Weekday() = %#v, want %#v`, occasionDate.Weekday(), weekday)
				return
			}
			availability := Availability{
				MondayHourMask:    0,
				TuesdayHourMask:   0,
				WednesdayHourMask: 0,
				ThursdayHourMask:  0,
				FridayHourMask:    0,
				SaturdayHourMask:  0,
				SundayHourMask:    0,
				Occasions: []Occasion{
					{
						Date:            occasionDate,
						HourMask:        1,
						YearlyRecurring: true,
					},
				},
			}
			availability.ApplyOccasions(today, nextWeek)
			for i := range time.Weekday(7) {
				mask := *availability.WeekdayMask(i)
				if mask != 0 {
					t.Errorf(`availability.WeekdayMask(%#v) = %#b, want %#b`, weekday, mask, 0)
				}
			}
		}
	}

	for i := range time.Weekday(7) {
		t.Run(fmt.Sprintf("%s one-off occasion", i.String()), oneOff(i))
		t.Run(fmt.Sprintf("%s recurring occasion", i.String()), recurringApply(i))
		t.Run(fmt.Sprintf("%s recurring occasion on different month", i.String()), recurringDontApply(i))
	}
}

func TestOrder(t *testing.T) {
	availability := func() Availability {
		return Availability{
			MondayHourMask:    0,
			TuesdayHourMask:   1,
			WednesdayHourMask: 2,
			ThursdayHourMask:  3,
			FridayHourMask:    4,
			SaturdayHourMask:  5,
			SundayHourMask:    6,
			Occasions:         []Occasion{},
		}
	}

	now := time.Now()
	today := time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, time.Local)
	weekdayOffset := today.Weekday()

	inner := func(weekday time.Weekday, expectedHours [7]int64) func(*testing.T) {
		return func(t *testing.T) {
			availability := availability()
			today := today.AddDate(0, 0, int(weekday-weekdayOffset))
			ordered := availability.IntoOrder(today)

			expected := [7]OpeningHours{}
			for i := range 7 {
				expected[i] = OpeningHours{
					Date:  today.AddDate(0, 0, i),
					Hours: expectedHours[i],
				}
			}

			if ordered != expected {
				t.Errorf(`availability.intoOrder(%#v) = %#v, want %#v`, today, ordered, expected)
			}
		}
	}

	t.Run("Monday", inner(time.Monday, [7]int64{0, 1, 2, 3, 4, 5, 6}))
	t.Run("Tuesday", inner(time.Tuesday, [7]int64{1, 2, 3, 4, 5, 6, 0}))
	t.Run("Wednesday", inner(time.Wednesday, [7]int64{2, 3, 4, 5, 6, 0, 1}))
	t.Run("Thursday", inner(time.Thursday, [7]int64{3, 4, 5, 6, 0, 1, 2}))
	t.Run("Friday", inner(time.Friday, [7]int64{4, 5, 6, 0, 1, 2, 3}))
	t.Run("Saturday", inner(time.Saturday, [7]int64{5, 6, 0, 1, 2, 3, 4}))
	t.Run("Sunday", inner(time.Sunday, [7]int64{6, 0, 1, 2, 3, 4, 5}))
}
