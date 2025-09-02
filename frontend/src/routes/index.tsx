import './index.css'
import { createFileRoute, Link } from '@tanstack/react-router'

function App() {

	return <div>
		Restaurant Bookin
		{/* TODO: if logged in, change login to account? */}
		<Link to="/login">login</Link>
		<Link to="/sign-up">sign up</Link>
		<Link to="/account">account</Link>
	</div>
}

export const Route = createFileRoute('/')({
	component: App,
})
