import { createFileRoute } from '@tanstack/react-router'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button, Calendar, CalendarCell, CalendarGrid, Heading } from 'react-aria-components'

export const Route = createFileRoute('/make-booking/')({
    component: RouteComponent,
})

function RouteComponent() {

    
  
    return <div className='dateselect_calendar_wrapper'>
        <Calendar aria-label="Booking Date">
            <header>
                <Button slot="previous">
                    <ChevronLeft size={20} />
                </Button>
                <Heading />
                <Button slot="next">
                    <ChevronRight size={20} />
                </Button>
            </header>
            <CalendarGrid>
                {(date) => <CalendarCell date={date} />}
            </CalendarGrid>
        </Calendar>
        <h2></h2>
    </div>
}
