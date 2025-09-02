// frontend/src/routes/play/index.tsx
import { createFileRoute, Link } from '@tanstack/react-router'

function ServiceLanding() {
  return (
    <div>
      <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 12 }}>Play · Restaurants</h1>
      <p style={{ color: '#555', marginBottom: 16 }}>
        Pick a restaurant to start a booking.
      </p>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <Link to="/play/restaurant/$slug" params={{ slug: "Bar-Totti's" }} style={buttonStyle}>Bar Totti's</Link>
        <Link to="/play/restaurant/$slug" params={{ slug: 'Ragazzi-restaurant' }} style={buttonStyle}>Ragazzi</Link>
        <Link to="/play/restaurant/$slug" params={{ slug: 'St-Hubert' }} style={buttonStyle}>St Hubert</Link>
      </div>
    </div>
  )
}

const buttonStyle: React.CSSProperties = {
  padding: '10px 14px',
  borderRadius: 8,
  border: '1px solid #ddd',
  background: '#111',
  color: '#fff',
  textDecoration: 'none',
}

export const Route = createFileRoute('/play/')({
  component: ServiceLanding, // CHANGED: use local component to avoid missing default export
})

export default ServiceLanding // CHANGED: provide default export
