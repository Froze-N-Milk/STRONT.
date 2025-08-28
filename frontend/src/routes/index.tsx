import { useState } from 'react'
import './index.css'
import AddEvent from './-AddEvent'
import { createFileRoute } from '@tanstack/react-router'

function App() {
	const [open, setOpen] = useState(false)

	return <>
		<h1>Plange</h1>
		<div className="card">
			<button className="create_button" onClick={() => setOpen(open => !open)}>
				Create event
			</button>
			{open && <AddEvent close={() => setOpen(false)} />}
		</div>
	</>
}

export const Route = createFileRoute('/')({
	component: App,
})
