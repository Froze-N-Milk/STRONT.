import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/account/App')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/account/Page"!</div>
}
