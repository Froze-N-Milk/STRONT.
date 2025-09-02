// frontend/src/routes/play/_layout.tsx
import { createFileRoute, Outlet } from '@tanstack/react-router'
import PlayLayout from '../../components/play/_layout'

// Layout routes key '/play'
export const Route = createFileRoute('/play/_layout')({
  component: () => (
    <PlayLayout>
      <Outlet />
    </PlayLayout>
  ),
})
