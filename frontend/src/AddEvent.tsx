import { useEffect, useRef, useState } from "react";
import { Listbox, ListboxButton, ListboxOption, ListboxOptions } from '@headlessui/react';
import { Button, CalendarCell, CalendarGrid, CalendarGridBody, CalendarGridHeader, CalendarHeaderCell, type DateRange, Heading, RangeCalendar, Text } from 'react-aria-components';
import { parseDate } from '@internationalized/date';
import {ChevronLeft, ChevronRight} from 'lucide-react';

const times = [
    '00:00',
    '01:00',
    '02:00',
    '03:00',
    '04:00',
    '05:00',
    '06:00',
    '07:00',
    '08:00',
    '09:00',
    '10:00',
    '11:00',
    '12:00',
    '13:00',
    '14:00',
    '15:00',
    '16:00',
    '17:00',
    '18:00',
    '19:00',
    '20:00',
    '21:00',
    '22:00',
    '23:00',
    '24:00',
]

export default function AddEvent({ close }: { close: () => void }) {
    const ref = useRef(null)

    const [dateOnly, toggleDateOnly] = useState(false);
    const [startTime, setStartTime] = useState(times[9]);
    const [endTime, setEndTime] = useState(times[17]);

    const [range, setRange] = useState<DateRange | null>(null);

    return <div className="bg_tint" onClick={e => {
        const currentRef = ref.current
        if (currentRef == null) return
        if (e.nativeEvent.composedPath().includes(currentRef)) return
        close()
    }}>
        <div className="add_popover" ref={ref}>
            <h3>New event</h3>
            <input type="text" placeholder="Name your event..." />
            <div className="sel_date_specificity">
                <button onClick={() => {
                    toggleDateOnly(dateOnly => !dateOnly)
                }} className={`${dateOnly ? "" : "active"}`}>
                    Dates and times</button>
                <button onClick={() => {
                    toggleDateOnly(dateOnly => !dateOnly)
                }} className={`${dateOnly ? "active" : ""}`}>
                    Dates only</button>
            </div>

            <h3>What times might work?</h3>
            <div className="time_selection">
                <div className="dropdown_menu">
                    <Listbox value={startTime} onChange={setStartTime}>
                        <ListboxButton className="dropdown_button">{startTime}</ListboxButton>
                        <ListboxOptions className="dropdown_options">
                            {times.map((timeOption) => (
                                <ListboxOption key={timeOption} value={timeOption} className="dropdown_option">
                                    {timeOption}
                                </ListboxOption>
                            ))}
                        </ListboxOptions>
                    </Listbox>
                </div>
                <p>to</p>
                <div className="dropdown_menu">
                    <Listbox value={endTime} onChange={setEndTime}>
                        <ListboxButton className="dropdown_button">{endTime}</ListboxButton>
                        <ListboxOptions className="dropdown_options">
                            {times.map((timeOption) => (
                                <ListboxOption key={timeOption} value={timeOption} className="dropdown_option">
                                    {timeOption}
                                </ListboxOption>
                            ))}
                        </ListboxOptions>
                    </Listbox>
                </div>
            </div>
            <h3>What dates might work?</h3>
            <div className="cal_wrapper">
                <RangeCalendar 
                    aria-label="Date range" 
                    value={range} onChange={setRange}
                    defaultValue={{
                        start: parseDate('2020-02-03'),
                        end: parseDate('2020-02-12')
                    }}
                    allowsNonContiguousRanges
                    pageBehavior="single">
                    <div className="cal_nav">
                    <Button slot="previous"><ChevronLeft size={20} /></Button>
                    <Heading />
                    <Button slot="next"><ChevronRight size={20} /></Button>
                    </div>
                    <CalendarGrid>
                        <CalendarGridBody>
                            {(date) => <CalendarCell date={date} />}
                        </CalendarGridBody>
                    </CalendarGrid>
                    <Text slot="errorMessage" />
                </RangeCalendar>
            </div>
            <button id="create_button">Create Event</button>
        </div>
    </div>
}
