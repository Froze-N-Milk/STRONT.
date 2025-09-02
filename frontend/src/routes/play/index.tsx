// frontend/src/routes/index.tsx
import { createFileRoute, Link } from '@tanstack/react-router'

/** ---------- Sample list data (cards on home) ---------- */
type R = { id: number; slug: string; name: string; img: string; tags: string[]; about?: string }

const samples: R[] = [
  {
    id: 1,
    slug: "Bar-Totti's",
    name: "Bar Totti's",
    img: 'data:image/png;base64,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',
    tags: ['italian', 'bar'],
    about: 'Italiano, bula bula.',
  },
  {
    id: 2,
    slug: 'Ragazzi-restaurant',
    name: 'Ragazzi',
    img: 'https://i.pinimg.com/736x/72/86/4b/72864b63e190b74f8f5e2623f219c61a.jpg',
    tags: ['Franch', 'pasta'],
    about: 'Pasta, wine, good mood.',
  },
  {
    id: 3,
    slug: 'St-Hubert',
    name: 'St Hubert',
    img: 'https://resources.zhayieye.com/news/data/article/2015_01_20/yMbsYfJAXj4t.jpg?x-oss-process=image/resize,w_650,m_lfit',
    tags: ['Franch', 'casual'],
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

export const Route = createFileRoute('/play/')({
  component: Home,
})
