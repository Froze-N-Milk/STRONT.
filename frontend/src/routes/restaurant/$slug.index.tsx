// frontend/src/routes/restaurant/$slug.index.tsx
import '../index.css' // uses .create_button
import * as React from 'react'
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { AccountContext } from '../__root' // read login state

type Detail = {
  name: string
  image: string
  cuisine: string
  rating: number
  priceLevel: '$' | '$$' | '$$$' | '$$$$' | '$$$$$'
  description: string
  hours: string
  location: string
  phone: string
}

const SAMPLE_DETAIL: Record<string, Detail> = {
  'bella-vista': {
    name: 'Bella Vista',
    image: '',
    cuisine: 'Italian',
    rating: 4.5,
    priceLevel: '$$$',
    description: 'Authentic Italian cuisine with fresh ingredients.',
    hours: 'Mon–Sun: 17:00–22:00',
    location: '123 Main Street, Downtown',
    phone: '(555) 123-4567',
  },
  'sakura-sushi': {
    name: 'Sakura Sushi',
    image: '',
    cuisine: 'Japanese',
    rating: 4.8,
    priceLevel: '$$$$',
    description: 'Traditional sushi and modern fusion dishes.',
    hours: 'Tue–Sun: 18:00–23:00',
    location: '456 Ocean Ave, Waterfront',
    phone: '(555) 987-6543',
  },
  'casa-miguel': {
    name: 'Casa Miguel',
    image: '',
    cuisine: 'Mexican',
    rating: 4.2,
    priceLevel: '$$',
    description: 'Vibrant Mexican flavors and signature margaritas.',
    hours: 'Daily: 11:00–22:00',
    location: '789 Fiesta Blvd, Arts District',
    phone: '(555) 246-8135',
  },
  'le-petit-bistro': {
    name: 'Le Petit Bistro',
    image: '',
    cuisine: 'French',
    rating: 4.6,
    priceLevel: '$$$',
    description: 'Elegant French dining with classic dishes.',
    hours: 'Wed–Sun: 17:30–21:30',
    location: '321 Vineyard Lane, Historic Quarter',
    phone: '(555) 369-2580',
  },
  'prime-cut-steak': {
    name: 'Prime Cut Steak',
    image: '',
    cuisine: 'American',
    rating: 4.7,
    priceLevel: '$$$$',
    description: 'Dry-aged beef, fresh seafood, and great wine.',
    hours: 'Mon–Sat: 17:00–23:00',
    location: '654 Executive Plaza, Business District',
    phone: '(555) 147-9630',
  },
  'bangkok-garden': {
    name: 'Bangkok Garden',
    image: '',
    cuisine: 'Thai',
    rating: 4.3,
    priceLevel: '$$',
    description: 'Authentic Thai with bold flavors and aromatic spices.',
    hours: 'Daily: 12:00–21:00',
    location: '987 Spice Market Rd, Little Thailand',
    phone: '(555) 852-7410',
  },
}

export const Route = createFileRoute('/restaurant/$slug/')({
  component: RestaurantPage,
})

// stars
function Stars({ value }: { value: number }) {
  const full = Math.floor(value)
  return (
    <span style={{ color: '#FACC15' }}>
      {'★'.repeat(full)}
      <span style={{ color: '#D1D5DB' }}>{'☆'.repeat(5 - full)}</span>
    </span>
  )
}

// $$$$$ price scale
function PriceDollars({ level }: { level: number }) {
  return (
    <span aria-label={`price level ${level}/5`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <span key={i} style={{ color: i < level ? '#111827' : '#D1D5DB' }}>$</span>
      ))}
    </span>
  )
}

// responsive 1/2-column toggle
function useIsWide(breakpoint = 1024) {
  const [wide, setWide] = React.useState(
    typeof window !== 'undefined' ? window.innerWidth >= breakpoint : false
  )
  React.useEffect(() => {
    const onResize = () => setWide(window.innerWidth >= breakpoint)
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [breakpoint])
  return wide
}

function RestaurantPage() {
  const { slug } = Route.useParams()
  const navigate = useNavigate()
  const account = React.useContext(AccountContext)
  const isWide = useIsWide(1024)

  // Redirect to /login if user is signed out (e.g., after clicking "sign out" in navbar)
  React.useEffect(() => {
    if (account === null) {
      navigate({ to: '/login/', replace: true })
    }
  }, [account, navigate])

  // Mock data (replace with fetch(`/api/restaurants/${slug}`))
  const r: Detail =
    SAMPLE_DETAIL[slug] ??
    ({
      name: slug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
      image: '',
      cuisine: 'Cuisine',
      rating: 4.5,
      priceLevel: '$$',
      description: 'Description from backend will appear here.',
      hours: 'Mon–Sun: 11:00–22:00',
      location: '123 Main Street',
      phone: '(000) 000-0000',
    } as Detail)

  const priceLevelNumber = r.priceLevel.length

  // CTA: if not logged in → /login; else → /account (placeholder for booking flow)
  const onReserve = () => {
    if (!account) navigate({ to: '/login/' })
    else navigate({ to: '/account/' })
  }

  return (
    <main style={{ maxWidth: 1200, margin: '0 auto', padding: 24 }}>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: isWide ? 'minmax(420px,560px) 1fr' : '1fr',
          gap: 24,
          alignItems: 'start',
        }}
      >
        {/* left: image/placeholder (sticky on wide) */}
        <div style={{ position: isWide ? 'sticky' as const : 'static' as const, top: isWide ? 80 : undefined }}>
          <div
            style={{
              aspectRatio: '4/3',
              background: '#e5e7eb',
              overflow: 'hidden',
              borderRadius: 12,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#6b7280',
            }}
          >
            {r.image ? (
              <img
                src={r.image}
                alt={r.name}
                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                onError={(e) => ((e.currentTarget as HTMLImageElement).style.display = 'none')}
              />
            ) : (
              'image'
            )}
          </div>
        </div>

        {/* right: content */}
        <div
          style={{
            background: '#fff',
            border: '1px solid #e5e5e5',
            borderRadius: 12,
            padding: 16,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
            <div>
              <h1 style={{ fontSize: 24, fontWeight: 700 }}>{r.name}</h1>

              {/* top info row */}
              <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 14, color: '#4B5563' }}>
                <span style={{ display: 'flex', gap: 6 }}>
                  <span>Type of cuisine</span>
                  <span style={{ color: '#374151' }}>{r.cuisine}</span>
                </span>

                <span>
                  <Stars value={r.rating} /> <span style={{ color: '#111', marginLeft: 4 }}>{r.rating}</span>
                </span>

                <span style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                  <span>price</span>
                  <PriceDollars level={priceLevelNumber} />
                </span>
              </div>
            </div>
            {/* top-right CTA intentionally removed */}
          </div>

          <p style={{ marginTop: 12, color: '#374151', lineHeight: 1.6 }}>{r.description}</p>

          <div
            style={{
              marginTop: 16,
              display: 'grid',
              gap: 12,
              gridTemplateColumns: isWide ? '1fr 1fr' : '1fr',
            }}
          >
            <div style={{ border: '1px solid #e5e5e5', borderRadius: 8, padding: 12 }}>
              <h3 style={{ fontWeight: 600, marginBottom: 6 }}>Opening hours</h3>
              <div style={{ color: '#4B5563' }}>{r.hours}</div>
            </div>
            <div style={{ border: '1px solid #e5e5e5', borderRadius: 8, padding: 12 }}>
              <h3 style={{ fontWeight: 600, marginBottom: 6 }}>Location</h3>
              <div style={{ color: '#4B5563' }}>{r.location}</div>
            </div>
            <div style={{ border: '1px solid #e5e5e5', borderRadius: 8, padding: 12, gridColumn: isWide ? '1 / -1' : undefined }}>
              <h3 style={{ fontWeight: 600, marginBottom: 6 }}>Phone</h3>
              <div style={{ color: '#4B5563' }}>{r.phone}</div>
            </div>
          </div>

          {/* centered CTA between Phone and Back */}
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: 18 }}>
            <button
              type="button"               // avoid form submit
              onClick={onReserve}          // navigate to login/account
              className="create_button"    // reuse green style
              style={{
                height: '2.2em',          // thicker button
                padding: '0 1.6em',
                fontSize: 14,
                minWidth: 220,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 8,
                cursor: 'pointer',
              }}
            >
              Reserve now
            </button>
          </div>

          <div style={{ marginTop: 16, fontSize: 14, textAlign: 'center' }}>
            <Link to="/" style={{ color: '#374151', textDecoration: 'none' }}>
              ← Back to Browse
            </Link>
          </div>
        </div>
      </div>
    </main>
  )
}