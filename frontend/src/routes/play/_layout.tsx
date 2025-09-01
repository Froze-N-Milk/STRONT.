// frontend/src/routes/play/_layout.tsx
import { createFileRoute, Outlet } from '@tanstack/react-router'
import PlayLayout from '../../components/play/_layout'

// ⚠️ 포인트: 레이아웃 라우트 키는 '/play'
export const Route = createFileRoute('/play/_layout')({
  component: () => (
    <PlayLayout>
      <Outlet />
    </PlayLayout>
  ),
})