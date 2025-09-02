// frontend/src/routes/play/_layout.tsx
import { createFileRoute, Outlet, Link } from '@tanstack/react-router'

function PlayLayout() {
  return (
    <div style={{ display: 'grid', gap: 20 }}>
      {/* (Optional) simple sub-nav for /play */}
      <nav style={{ borderBottom: '1px solid #eee', paddingBottom: 8 }}>
        <Link to="/" style={{ textDecoration: 'none', color: '#111', fontWeight: 700 }}>← Home</Link>
      </nav>
      <Outlet />
    </div>
  )
}

export const Route = createFileRoute('/play/_layout')({
  component: PlayLayout,
})

export default PlayLayout // default export added to satisfy default import style
