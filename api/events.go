package api

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"strconv"
	"time"

	"gorm.io/gorm"
);

type Event struct {
	ID        uint64
	Name      string
	StartTime uint32
	Duration  uint32
	StartDate time.Time
	Days      uint32
}

func (Event) TableName() string {
	return "event"
}

type CreateEvent struct {
	DB  *gorm.DB
	CTX *context.Context
}

func (self *CreateEvent) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	name := r.FormValue("eventName")
	startTime, err := strconv.ParseUint(r.FormValue("startTime"), 10, 32)
	if err != nil {
		log.Println(err)
		// TODO: respond with error
		return
	}
	duration, err := strconv.ParseUint(r.FormValue("duration"), 10, 32)
	if err != nil {
		log.Println(err)
		// TODO: respond with error
		return
	}
	startDateUnix, err := strconv.ParseInt(r.FormValue("startDate"), 10, 0)
	if err != nil {
		log.Println(err)
		// TODO: respond with error
		return
	}
	startDate := time.Unix(startDateUnix, 0)
	days, err := strconv.ParseUint(r.FormValue("days"), 10, 32)
	if err != nil {
		log.Println(err)
		// TODO: respond with error
		return
	}
	result := gorm.WithResult()
	event := Event{
		Name:      name,
		StartTime: uint32(startTime),
		Duration:  uint32(duration),
		StartDate: startDate,
		Days:      uint32(days),
	}
	err = gorm.G[Event](self.DB, result).Create(*self.CTX, &event)
	if err != nil {
		log.Println(err)
		// TODO: respond with error
		return
	}
	w.Header().Add("Location", fmt.Sprintf("/event/%d", event.ID))
	w.WriteHeader(http.StatusSeeOther)
}
