import { createRootRoute, Link, Outlet } from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools'

export const Route = createRootRoute({
	component: () => <>
		<div id="pagecontent_container">
			<div className="navbar_wrapper">
				<div id="navbar_container">
					<div className="stront">STRONT.</div>
					<div className="navbar_items">
						<Link className="navbar_button" to="/login">login</Link>
						<Link className="navbar_button" to="/sign-up">sign up</Link>
					</div>
				</div>
			</div>
		</div>
		<div id="pagebody_wrapper">
			<Outlet />
		</div>
		<TanStackRouterDevtools />
	</>,
})
