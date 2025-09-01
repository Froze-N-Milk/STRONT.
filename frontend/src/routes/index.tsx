import './index.css'
import { createFileRoute} from '@tanstack/react-router'

function App() {

	return <div>
		{/* TODO: if logged in, change login to account? */}
	</div>
}

export const Route = createFileRoute('/')({
	component: App,
})
