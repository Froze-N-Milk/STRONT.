import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { parseRestaurantInfo, timeFromMaskValue } from "./-utils";
import type { Restaurant } from "../../-components/restaurantType";

export const Route = createFileRoute("/$restaurantid/make-booking/")({
  component: BookingPageContent,
});

function parseDates(datedata: string) {
  const formattedDates: DateObj[] = [];
  JSON.parse(datedata).forEach((item: { date: number; hours: number }) => {
    formattedDates.push({
      date: new Date(item.date),
      hours: BigInt(item.hours),
    });
  });
  return formattedDates;
}

function* range(end: number) {
  for (let i = 0; i < end; i++) yield i;
}

function listAvailableTimes(hourmask: bigint): number[] {
  return Array.from(range(48)).filter((i) => checkTime(hourmask, i));
}

function checkTime(hourmask: bigint, periodIndex: number): boolean {
  const mask = BigInt(0b1);
  const x = BigInt(47 - periodIndex);
  const shuffled = hourmask >> x;

  return (shuffled & mask) === mask;
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

const weekdayTitles = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

type DateObj = {
  date: Date;
  hours: bigint;
};

interface DateButtonProps {
  dateObj: DateObj;
  onSelect: (date: DateObj) => void;
  classList: string;
}

function DateButton({ dateObj, onSelect, classList }: DateButtonProps) {
  const fullDate = dateObj;

  return (
    <div className="datebutton-wrapper">
      <p>{weekdayTitles[fullDate.date.getDay()]}</p>
      <button className={classList} onClick={() => onSelect(fullDate)}>
        {fullDate.date.getDate()}
      </button>
    </div>
  );
}

function BookingPageContent() {
  const { restaurantid } = Route.useParams();
  const [restaurantData, setRestaurantData] = useState<DateObj[] | null>(null);
  const [restaurantBioInfo, setRestaurantBioInfo] = useState<Restaurant | null>(
    null,
  );

  useEffect(() => {
    fetch("/api/availability/" + restaurantid, {
      method: "GET",
    }).then(async (r) => {
      if (r.status == 200) {
        setRestaurantData(parseDates(await r.text()));
      } else {
        setRestaurantData(null);
      }
    });
  }, [restaurantid]);

  useEffect(() => {
    fetch("/api/restaurant/" + restaurantid, {
      method: "GET",
    }).then(async (r) => {
      if (r.status == 200) {
        setRestaurantBioInfo(parseRestaurantInfo(await r.text()));
      } else {
        setRestaurantBioInfo(null);
      }
    });
  }, [restaurantid]);

  if (restaurantData == null) return <div>Channing Datum</div>;
  if (restaurantBioInfo == null) return <div>Channing Datum</div>;

  return (
    <MakeBookingForm
      restaurantData={restaurantData}
      restaurantBioInfo={restaurantBioInfo}
    />
  );
}

function MakeBookingForm({
  restaurantData,
  restaurantBioInfo,
}: {
  restaurantData: DateObj[];
  restaurantBioInfo: Restaurant;
}) {
  const [selectedDate, setSelectedDate] = useState(restaurantData[0]);
  const [partySize, setPartySize] = useState(1);
  const [contactEmail, setContactEmail] = useState("");
  const [contactFirstName, setContactFirstName] = useState("");
  const [contactFamilyName, setContactFamilyName] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [selectedTimeSlot, setSelectedTimeSlot] = useState(0);
  const [contactNumber, setContactNumber] = useState("");
  const [customerNotes, setCustomerNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [refresh, setRefresh] = useState(false);
  const restaurantid = Route.useParams().restaurantid;
  const maxTableSize = restaurantBioInfo.maxPartySize;

  const detailsFilled =
    selectedTime != "" &&
    contactFirstName != "" &&
    contactFamilyName != "" &&
    isValidEmail(contactEmail);

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

  function handleDateSelect(date: DateObj) {
    if (date != selectedDate) {
      setRefresh(true);
      setSelectedDate(date);
      setSelectedTime("");
    }
    setTimeout(() => {
      setRefresh(false);
    }, 10);
  }

  function handleTimeSelect(timeFormatted: string, timeValue: number) {
    setSelectedTime(timeFormatted);
    setSelectedTimeSlot(timeValue);
  }

  function preparePostData(): string {
    const postData = {
      restaurant_id: restaurantid,
      given_name: contactFirstName,
      family_name: contactFamilyName,
      phone: contactNumber,
      email: contactEmail,
      party_size: partySize,
      booking_date: selectedDate.date.getTime(),
      time_slot: selectedTimeSlot,
      customer_notes: customerNotes,
    };
    return JSON.stringify(postData, null, 2);
  }

  async function placeBookingRequest(bookingdata: string) {
    const res = await fetch("/api/booking/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: bookingdata,
    });
    return res;
  }

  async function handleSubmit() {
    console.log(preparePostData());
    setLoading(true);
    try {
      const res = await placeBookingRequest(preparePostData());
      if (res.redirected) {
        window.location.assign(res.url);
        return;
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="booking-form-wrapper">
      <h1>Booking for {restaurantBioInfo.name}</h1>
      <div className="booking-form">
        <div className="booking-form-datetime-select appearing">
          <h1>Select a Date & Time</h1>

          <div className="booking-day-selector">
            <h3>Select a day to book</h3>
            <div className="booking-days">
              {restaurantData.map((dateObj) => (
                <DateButton
                  key={dateObj.date.toString()}
                  dateObj={dateObj}
                  onSelect={handleDateSelect}
                  classList={
                    dateObj == selectedDate
                      ? "round-button disabled active-button"
                      : "round-button"
                  }
                />
              ))}
            </div>
          </div>

          <div className="people-count-selector">
            <h3>How many people are coming?</h3>
            <div className="people-count-buttons">
              <button
                onClick={partySizeMinus}
                className={
                  partySize == 1 ? "round-button disabled" : "round-button"
                }
              >
                <h2>&minus;</h2>
              </button>
              <div
                style={{
                  width: "10px",
                  display: "flex",
                  justifyContent: "center",
                  userSelect: "none",
                }}
              >
                <h1>{partySize}</h1>
              </div>
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
            <h5
              style={{ opacity: 0 }}
              className={partySize == maxTableSize ? "appearing" : ""}
            >
              max. party size is {maxTableSize}
            </h5>
          </div>

          <h3>Available seating times:</h3>
          <div className="seating-time-wrapper">
            <div
              className={
                refresh
                  ? "seating-time-selection"
                  : "seating-time-selection refreshing"
              }
            >
              {selectedDate.hours != BigInt(0) ? (
                listAvailableTimes(selectedDate.hours).map((i: number) => {
                  const timeFormatted = timeFromMaskValue(i);
                  const timeValue = i;
                  return (
                    <button
                      className={
                        selectedTime == timeFormatted
                          ? "time-selector-button selected"
                          : "time-selector-button"
                      }
                      key={i}
                      onClick={() => handleTimeSelect(timeFormatted, timeValue)}
                    >
                      {timeFormatted}
                    </button>
                  );
                })
              ) : (
                <div style={{ width: 400 }}>
                  no booking times available for this day, please check another
                  day!
                </div>
              )}
            </div>
          </div>
        </div>
        <div className={"booking-form-details-entry appearing"}>
          <h1>Enter Contact Details</h1>
          <div className="personal-details">
            <label htmlFor="booking-first-name">
              <h3>First Name:</h3>
            </label>
            <input
              type="text"
              name="booking-first-name"
              id="booking-first-name"
              value={contactFirstName}
              onChange={(e) => setContactFirstName(e.target.value)}
            />
            <label htmlFor="booking-family-name">
              <h3>Family Name:</h3>
            </label>
            <input
              type="text"
              name="booking-family-name"
              id="booking-family-name"
              value={contactFamilyName}
              onChange={(e) => setContactFamilyName(e.target.value)}
            />
            <label htmlFor="booking-email">
              <h3>Email Address:</h3>
            </label>
            <div className={"email-input"}>
              <input
                type="email"
                name="booking-email"
                id="booking-email"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                required
              />
              {isValidEmail(contactEmail) || contactEmail == "" ? (
                <></>
              ) : (
                <h6>please enter a valid email</h6>
              )}
            </div>
            <label htmlFor="booking-phone">
              <h3>
                Phone Number{" "}
                <span style={{ fontWeight: "300" }}>(optional)</span>:
              </h3>
            </label>
            <input
              type="number"
              name="booking-phone"
              id="booking-phone"
              value={contactNumber}
              onChange={(e) => setContactNumber(e.target.value)}
            />
          </div>
          <div className="booking-form-confirm">
            <button
              className={
                !detailsFilled ? "submit_button disabled" : "submit_button"
              }
              popoverTarget="confirm-popover"
              disabled={!detailsFilled}
            >
              Place Booking
            </button>
          </div>
          <div id="confirm-popover" popover="">
            <div className="confirm-popover-contents">
              <h2>Confirm Booking</h2>
              <p>
                Please confirm your details below before we submit your booking
                request.
              </p>
              <div className="confirm-popover-subdivision">
                <h4>Name:</h4>{" "}
                <p>&nbsp;{contactFirstName + " " + contactFamilyName}</p>
              </div>
              <div className="confirm-popover-subdivision">
                <h4>Date:</h4> <p>&nbsp;{selectedDate.date.toDateString()}</p>
              </div>
              <div className="confirm-popover-subdivision">
                <h4>Time:</h4> <p>&nbsp;{selectedTime}</p>
              </div>
              <div className="confirm-popover-subdivision">
                <h4>Email:</h4> <p>&nbsp;{contactEmail}</p>
              </div>
              <h4>Any additional notes:</h4>
              <textarea
                name="customer-notes"
                id="customer-notes"
                value={customerNotes}
                onChange={(e) => setCustomerNotes(e.target.value)}
              />
              <button
                className={loading ? "submit_button disabled" : "submit_button"}
                onClick={handleSubmit}
              >
                Submit Booking
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
