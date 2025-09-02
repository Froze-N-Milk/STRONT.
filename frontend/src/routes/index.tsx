import './index.css'
import { createFileRoute, Link } from '@tanstack/react-router'

/** ---------- Sample list data (cards on home) ---------- */
type R = { id: number; slug: string; name: string; img: string; tags: string[]; about?: string }

const samples: R[] = [
  {
    id: 1,
    slug: 'tony-strombolis-italian',
    name: 'Tony Italian',
    img: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTsoJNIVLwBhbrWqKWLXOxC2GOHMcrEBd3y5A&s',
    tags: ['italian', 'bar'],
    about: 'Italiano, and one hell of a pizza pie.',
  },
  {
    id: 2,
    slug: 'umami-sushi',
    name: 'Umami Sushi',
    img: 'https://i.pinimg.com/736x/72/86/4b/72864b63e190b74f8f5e2623f219c61a.jpg',
    tags: ['japanese', 'sushi'],
    about: 'Fresh nigiri, maki and omakase.',
  },
  {
    id: 3,
    slug: 'green-garden',
    name: 'Green Garden',
    img: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSopc4iP_-GLQhJN6re_KGoXA3CeOFm4iisEA&s',
    tags: ['vegan', 'casual'],
    about: 'Plant-forward seasonal plates.',
  },
]

function Home() {
  return (
    <div>
      {/* Title row */}
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12, marginBottom: 16 }}>
        <h1 style={{ fontSize: 28, fontWeight: 800 }}>LIST OF RESTAURANTS · WHERE SHALL I EAT?</h1>
        <div style={{ maxWidth: 360, color: '#666' }}>Simple bookings with calendar... bulabula</div>
      </div>

      {/* Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px,1fr))', gap: 16 }}>
        {samples.map((r) => (
          <div key={r.id} style={{ border: '1px solid #e5e5e5', borderRadius: 12, overflow: 'hidden', background: '#fff' }}>
            <div style={{ aspectRatio: '4/3', background: '#f6f6f6', overflow: 'hidden' }}>
              <img src={r.img} alt={r.name} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
            </div>
            <div style={{ padding: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                <h3 style={{ fontSize: 18, fontWeight: 700 }}>{r.name}</h3>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {r.tags.map((t) => (
                    <span key={t} style={{ fontSize: 12, padding: '2px 8px', borderRadius: 999, background: '#eef2ff', color: '#374151' }}>
                      {t}
                    </span>
                  ))}
                </div>
              </div>
              {r.about && <p style={{ color: '#666', marginTop: 6 }}>{r.about}</p>}
              <div style={{ marginTop: 10 }}>
                <Link
                  to="/play/restaurant/$slug"
                  params={{ slug: r.slug }}
                  style={{ display: 'inline-block', padding: '8px 12px', borderRadius: 8, border: '1px solid #ddd', background: '#111', color: '#fff', textDecoration: 'none' }}
                >
                  Go to booking
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export const Route = createFileRoute('/')({
  component: Home,
})