import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";

export const Route = createFileRoute("/make-booking/")({
  component: RouteComponent,
});

const datedummies = `[{ "date": "2025-09-25T00:00:00+10:00", "hours": 0 }, { "date": "2025-09-26T00:00:00+10:00", "hours": 2147483584 }, { "date": "2025-09-27T00:00:00+10:00", "hours": 536868864 }, { "date": "2025-09-28T00:00:00+10:00", "hours": 536868864 }, { "date": "2025-09-29T00:00:00+10:00", "hours": 2147483584 }, { "date": "2025-09-30T00:00:00+10:00", "hours": 2147483584 }, { "date": "2025-10-01T00:00:00+10:00", "hours": 2147483584 }]`;

function parseDates(datedata: string) {
  const formattedDates: DateObj[] = [];
  JSON.parse(datedata).forEach((item: { date: string; hours: number }) => {
    formattedDates.push({ date: new Date(item.date), hours: item.hours });
  });
  return formattedDates;
}

const maxTableSize = 5;

const weekdayTitles = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

type DateObj = {
  date: Date;
  hours: number;
};

interface DateButtonProps {
  dateObj: DateObj;
  onSelect: (date: Date) => void;
}

function DateButton({ dateObj, onSelect }: DateButtonProps) {
  const fullDate = dateObj;

  return (
    <div className="datebutton-wrapper">
      <p>{weekdayTitles[fullDate.date.getDay()]}</p>
      <button className="date-button" onClick={() => onSelect(fullDate.date)}>
        {" "}
        {fullDate.date.getDate()}{" "}
      </button>
    </div>
  );
}

export default function RouteComponent() {
  const todaysDate = new Date();
  const [selectedDate, setSelectedDate] = useState(todaysDate);
  const [headCount, setHeadCount] = useState(1);

  function headCountPlus() {
    if (headCount < maxTableSize) {
      setHeadCount(headCount + 1);
    }
  }
  function headCountMinus() {
    if (headCount > 1) {
      setHeadCount(headCount - 1);
    }
  }

  return (
    <div className="booking-form">
      <div className="booking-day-selector">
        <h3>Select a day to book</h3>
        <div className="booking-days">
          {parseDates(datedummies).map((dateObj) => (
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
            onClick={headCountMinus}
            className={
              !(headCount == 1) ? "round-button" : "round-button disabled"
            }
          >
            <h2>&minus;</h2>
          </button>
          <h1>{headCount}</h1>
          <button
            onClick={headCountPlus}
            className={
              !(headCount == maxTableSize)
                ? "round-button"
                : "round-button disabled"
            }
          >
            <h2>+</h2>
          </button>
        </div>
      </div>

      <h3>
        what time u be wanting for your {headCount} fool/s on{" "}
        {selectedDate.toLocaleDateString()}
      </h3>
      <div>
        <p>no tables mate.</p>
      </div>
    </div>
  );
}
