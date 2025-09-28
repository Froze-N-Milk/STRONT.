import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";

export const Route = createFileRoute("/make-booking/")({
  component: RouteComponent,
});

const datedummies = `[{ "date": "2025-09-25T00:00:00+10:00", "hours": 0 }, { "date": "2025-09-26T00:00:00+10:00", "hours": 2147483584 }, { "date": "2025-09-27T00:00:00+10:00", "hours": 536868864 }, { "date": "2025-09-28T00:00:00+10:00", "hours": 536868864 }, { "date": "2025-09-29T00:00:00+10:00", "hours": 2147483584 }, { "date": "2025-09-30T00:00:00+10:00", "hours": 2147483584 }, { "date": "2025-10-01T00:00:00+10:00", "hours": 2147483584 }]`;

function parseDates(datedata: string) {
  const formattedDates: DateObj[] = [];
  JSON.parse(datedata).forEach((item: { date: number; hours: number }) => {
    formattedDates.push({ date: new Date(item.date), hours: item.hours });
  });
  return formattedDates;
}

const datesParsed = parseDates(datedummies);

function* range(end: number) {
  for (let i = 0; i < end; i++) yield i;
}

function listAvailableTimes(hourmask: number): number[] {
  return Array.from(range(48)).filter((i) => checkTime(hourmask, i));
}

function checkTime(hourmask: number, periodIndex: number): boolean {
  const mask = 0b1;
  const x = 47 - periodIndex;
  const shuffled = hourmask >> x;

  return (shuffled & mask) === mask;
}

function timeFromMaskValue(maskvalue: number): string {
  const mins = maskvalue % 2 == 0 ? "00 " : "30 ";
  let hours = "";
  let ampm = "";
  if (maskvalue >= 24) {
    hours =
      maskvalue > 25 ? Math.floor(maskvalue / 2 - 12).toString() + ":" : "12:";
    ampm = "PM";
  } else {
    hours += maskvalue > 1 ? Math.floor(maskvalue / 2).toString() + ":" : "00:";
    ampm = "AM";
  }
  return hours + mins + ampm;
}

const maxTableSize = 5;

const weekdayTitles = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

type DateObj = {
  date: Date;
  hours: number;
};

interface DateButtonProps {
  dateObj: DateObj;
  onSelect: (date: DateObj) => void;
}

function DateButton({ dateObj, onSelect }: DateButtonProps) {
  const fullDate = dateObj;

  return (
    <div className="datebutton-wrapper">
      <p>{weekdayTitles[fullDate.date.getDay()]}</p>
      <button
        className={
          fullDate.hours == 0 ? "round-button disabled" : "round-button"
        }
        onClick={() => onSelect(fullDate)}
      >
        {fullDate.date.getDate()}
      </button>
    </div>
  );
}

export default function RouteComponent() {
  const [selectedDate, setSelectedDate] = useState(datesParsed[0]);
  const [partySize, setPartySize] = useState(1);
  const [contactEmail, setContactEmail] = useState("");
  const [contactName, setContactName] = useState("");
  const [selectedTime, setSelectedTime] = useState("");

  function partySizePlus() {
    if (partySize < maxTableSize) {
      setPartySize(partySize + 1);
    }
  }
  function partySizeMinus() {
    if (partySize > 1) {
      setPartySize(partySize - 1);
    }
  }

  return (
    <div className="booking-form">
      <div className="booking-day-selector">
        <h3>Select a day to book</h3>
        <div className="booking-days">
          {datesParsed.map((dateObj) => (
            <DateButton
              key={dateObj.date.toString()}
              dateObj={dateObj}
              onSelect={setSelectedDate}
            />
          ))}
        </div>
      </div>
      <div className="people-count-selector">
        <h3>how many fools you got</h3>
        <div className="people-count-buttons">
          <button
            onClick={partySizeMinus}
            className={
              partySize == 1 ? "round-button disabled" : "round-button"
            }
          >
            <h2>&minus;</h2>
          </button>
          <h1>{partySize}</h1>
          <button
            onClick={partySizePlus}
            className={
              partySize == maxTableSize
                ? "round-button disabled"
                : "round-button"
            }
          >
            <h2>+</h2>
          </button>
        </div>
      </div>

      <h3>
        what time u be wanting for your{" "}
        {partySize == 1 ? "foolish ass" : partySize + " fools"} on{" "}
        {selectedDate.date.toLocaleDateString()}
      </h3>
      <div className="seating-time-wrapper">
        <div
          className={
            selectedDate.hours == 0
              ? "seating-time-selection closed"
              : "seating-time-selection opened"
          }
        >
          {listAvailableTimes(selectedDate.hours).map((i: number) => {
            const timeFormatted = timeFromMaskValue(i);

            return (
              <button
                className={
                  selectedTime == timeFormatted
                    ? "time-selector-button selected"
                    : "time-selector-button"
                }
                key={"timeselector" + i}
                onClick={() => setSelectedTime(timeFormatted)}
              >
                {timeFormatted}
              </button>
            );
          })}
        </div>
      </div>
      <div className="contact-details">
        <h3>what your name</h3>
        <input
          type="text"
          name="booking-name"
          id="booking-name"
          value={contactName}
          onChange={(e) => setContactName(e.target.value)}
        />
        <h3>what your email</h3>
        <input
          type="email"
          name="booking-email"
          id="booking-email"
          value={contactEmail}
          onChange={(e) => setContactEmail(e.target.value)}
        />
      </div>

      <div className="devpanel">
        <p>{selectedTime}</p>
      </div>
    </div>
  );
}
