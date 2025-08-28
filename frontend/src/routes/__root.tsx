import { createRootRoute, Link, Outlet } from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools'

export const Route = createRootRoute({
	component: () => <>
		<Link to="/demo" />
		<Outlet />
		<TanStackRouterDevtools />
	</>,
})
