import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/demo')({
	component: About,
})

function About() {
	return <div className="p-2">This is a demo sub-page!</div>
}
