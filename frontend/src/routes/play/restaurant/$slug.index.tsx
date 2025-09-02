// frontend/src/routes/play/restaurant/$slug.index.tsx
import { createFileRoute, useParams } from '@tanstack/react-router'
import { useEffect, useMemo, useState, Fragment } from 'react'

type ApiUser = { id: number; email: string; name: string }
const AUTH_KEY = 'plange_auth_user'

/** Restaurant record type with optional second image + per-restaurant details */
type RInfo = {
  name: string
  about: string
  img: string
  img2?: string
  tags: string[]
  // Added per-restaurant detail fields (rendered only if provided)
  address?: string
  hours?: string
  price?: string
  phone?: string
  website?: string
}

/** Seed restaurants keyed by slug */
const RESTAURANTS: Record<string, RInfo> = {
  // NOTE: Make sure home card slugs match these keys exactly.
  "Bar-Totti's": {
    name: "Bar Totti's",
    about:
      "Bar Totti's is the perfect place to stop in for an Italian wine and house-made antipasti, grilled snacks and Totti's signature wood-fired bread.",
    img: 'https://sweetandsourfork.com/wp-content/uploads/2022/01/2-Interior-3.jpg',
    img2:
      'https://s3.ap-southeast-2.amazonaws.com/production.assets.merivale.com.au/wp-content/uploads/2020/02/25171545/BarTottis_Credit_StevenWoodburn_20191127-70.jpg',
    tags: ['italian', 'bar'],
    // Per-restaurant details (example values)
    address: '330C-330D George St, Sydney NSW',
    hours: 'Mon–Sun 12:00–22:00',
    price: '$$',
    phone: '+61 2 9000 0000',
    website: 'https://www.merivale.com/venues/bartottis/',
  },
  'Ragazzi-restaurant': {
    name: 'Ragazzi',
    about: "We're pouring wine and serving pasta in Angel Place, Sydney.",
    img: 'https://younggunofwine.com/wp-content/uploads/2020/08/Ragazzi.jpg',
    img2: 'https://media.timeout.com/images/105590500/750/422/image.jpg',
    tags: ['pasta', 'wine'],
    address: 'Shop 3, 2–12 Angel Pl, Sydney NSW',
    hours: 'Mon–Sat 12:00–22:30',
    price: '$$',
    phone: '+61 2 7209 0120',
    website: 'https://ragazzi.com.au/',
  },
  'St-Hubert': {
    name: 'St Hubert',
    about:
      'Hubert is a restaurant for people who love restaurants. From Martini and oysters to cheese and Cognac.',
    img: 'https://media.timeout.com/images/105288869/750/422/image.jpg',
    img2: 'https://swillhouse.com/wp-content/uploads/2023/05/MARCH-17.jpg',
    tags: ['french', 'classic'],
    address: '15 Bligh St, Sydney NSW',
    hours: 'Mon–Sat 12:00–24:00',
    price: '$$$',
    phone: '+61 2 9232 0881',
    website: 'https://www.restaurant-hubert.com/',
  },
}

export const Route = createFileRoute('/play/restaurant/$slug/')({
  component: Page,
})

function Page() {
  const { slug } = useParams({ from: '/play/restaurant/$slug/' })

  /** Login state (read from localStorage and listen to modal events) */
  const [me, setMe] = useState<ApiUser | null>(() => {
    try {
      const raw = localStorage.getItem(AUTH_KEY)
      return raw ? (JSON.parse(raw) as ApiUser) : null
    } catch {
      return null
    }
  })
  useEffect(() => {
    const onAuth = (e: Event) =>
      setMe((e as CustomEvent).detail?.authed ? (e as CustomEvent).detail.user : null)
    window.addEventListener('auth:changed', onAuth)
    return () => window.removeEventListener('auth:changed', onAuth)
  }, [])
  const authed = !!me

  /** Left: restaurant information (fallback if slug not in seed) */
  const info: RInfo =
    RESTAURANTS[slug ?? ''] ??
    ({
      name: (slug ?? '').replaceAll('-', ' ') || 'Restaurant',
      about: 'Welcome!',
      img: `https://picsum.photos/seed/${slug ?? 'restaurant'}/1200/800`,
      img2: `https://picsum.photos/seed/${(slug ?? 'restaurant') + '-2'}/1200/800`,
      tags: ['restaurant'],
    } as RInfo)

  /** Right: simple client-side calendar + time selector */
  const [view, setView] = useState(() => {
    const d = new Date()
    return { year: d.getFullYear(), month: d.getMonth() } // month: 0..11
  })
  const [date, setDate] = useState<Date | null>(null)
  const [time, setTime] = useState<string | null>(null)

  // time slots (divider after '14:00')
  const times = [
    '09:30',
    '10:00',
    '10:30',
    '11:00',
    '11:30',
    '12:00',
    '12:30',
    '13:00',
    '13:30',
    '14:00',
    '17:00',
    '17:30',
    '18:00',
    '18:30',
    '19:00',
    '19:30',
    '20:00',
    '20:30',
    '21:00',
    '21:30',
    '22:00',
  ]

  const weeks = useMemo(() => buildMonthMatrix(view.year, view.month), [view])

  function prevMonth() {
    setView((v) =>
      v.month - 1 < 0 ? { year: v.year - 1, month: 11 } : { year: v.year, month: v.month - 1 },
    )
  }
  function nextMonth() {
    setView((v) =>
      v.month + 1 > 11 ? { year: v.year + 1, month: 0 } : { year: v.year, month: v.month + 1 },
    )
  }
  function pick(d: Date) {
    if (!authed) return // cannot pick if not logged in
    setDate(d)
    setTime(null)
  }
  function onBook() {
    if (!authed) {
      window.location.href = '/?auth=1' // open login on home
      return
    }
    if (!date || !time) return
    alert(`Booked: ${info.name}\nWhen: ${fmtDate(date)} ${time}\n(demo only)`)
  }

  // choose second image (restaurant-specific if provided)
  const img2 = info.img2 ?? `https://picsum.photos/seed/${(slug ?? 'restaurant') + '-2'}/1200/800`

  return (
    <div
      style={{
        display: 'grid',
        gap: 20,
        gridTemplateColumns: '2fr 1fr',
        alignItems: 'start',
      }}
    >
      {/* LEFT: Gallery(2×2) + Text panel on the right */}
      <section
        style={{
          border: '1px solid #e5e5e5',
          borderRadius: 12,
          overflow: 'hidden',
          background: '#fff',
        }}
      >
        {/* Title + tags */}
        <div style={{ padding: 16 }}>
          <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 8 }}>
            {info.name.toUpperCase()}
          </h1>
          <div style={{ display: 'flex', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
            {info.tags.map((t) => (
              <span
                key={t}
                style={{
                  fontSize: 12,
                  padding: '4px 10px',
                  borderRadius: 8,
                  background: '#eee',
                  color: '#222',
                }}
              >
                {t}
              </span>
            ))}
          </div>
        </div>

        {/* 2×2 grid: (left) two stacked images, (right) text box spanning two rows */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gridTemplateRows: '1fr 1fr',
            gap: 10,
            padding: 12,
            minHeight: 420,
          }}
        >
          {/* Left-Top Image */}
          <div
            style={{
              gridColumn: '1 / 2',
              gridRow: '1 / 2',
              borderRadius: 12,
              overflow: 'hidden',
              background: '#f6f6f6',
              aspectRatio: '4/3',
            }}
          >
            <img
              src={info.img}
              alt={info.name}
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
            />
          </div>

          {/* Left-Bottom Image */}
          <div
            style={{
              gridColumn: '1 / 2',
              gridRow: '2 / 3',
              borderRadius: 12,
              overflow: 'hidden',
              background: '#f6f6f6',
              aspectRatio: '4/3',
            }}
          >
            <img
              src={img2}
              alt={`${info.name} secondary`}
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
            />
          </div>

          {/* Right Text Box (span 2 rows) */}
          <div
            style={{
              gridColumn: '2 / 3',
              gridRow: '1 / 3',
              border: '1px solid #eee',
              borderRadius: 12,
              padding: 14,
              background: '#fff',
              display: 'flex',
              flexDirection: 'column',
              gap: 10,
            }}
          >
            <h3 style={{ fontSize: 14, letterSpacing: 1 }}>ABOUT</h3>
            <p style={{ lineHeight: 1.55 }}>{info.about}</p>

            <div style={{ height: 1, background: '#f0f0f0', margin: '6px 0' }} />

            {/* Per-restaurant details (render only if provided) */}
            <div style={{ fontSize: 14, color: '#444' }}>
              {info.address && (
                <div>
                  <b>Address</b>: <span style={{ color: '#666' }}>{info.address}</span>
                </div>
              )}
              {info.hours && (
                <div>
                  <b>Hours</b>: <span style={{ color: '#666' }}>{info.hours}</span>
                </div>
              )}
              {info.price && (
                <div>
                  <b>Price</b>: <span style={{ color: '#666' }}>{info.price}</span>
                </div>
              )}
              {info.phone && (
                <div>
                  <b>Phone</b>: <span style={{ color: '#666' }}>{info.phone}</span>
                </div>
              )}
              {info.website && (
                <div>
                  <b>Website</b>:{' '}
                  <a
                    href={info.website}
                    target="_blank"
                    rel="noreferrer"
                    style={{ color: '#2563eb', textDecoration: 'underline' }}
                  >
                    {info.website}
                  </a>
                </div>
              )}
              {!info.address &&
                !info.hours &&
                !info.price &&
                !info.phone &&
                !info.website && <div style={{ color: '#888' }}>More details coming soon.</div>}
            </div>
          </div>
        </div>
      </section>

      {/* RIGHT: Calendar + time slots */}
      <aside
        style={{
          border: '1px solid #e5e5e5',
          borderRadius: 12,
          padding: 12,
          background: '#fff',
        }}
      >
        <h3 style={{ textAlign: 'center', marginBottom: 10 }}>book now:</h3>

        {/* Calendar */}
        <div
          style={{
            border: '1px solid #eee',
            borderRadius: 10,
            padding: 12,
            marginBottom: 12,
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 8,
            }}
          >
            <button onClick={prevMonth} aria-label="prev" style={navBtnStyle} title="Previous month">
              ‹
            </button>
            <strong>
              {MONTH_NAMES[view.month]} {view.year}
            </strong>
            <button onClick={nextMonth} aria-label="next" style={navBtnStyle} title="Next month">
              ›
            </button>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(7, 1fr)',
              gap: 4,
              textAlign: 'center',
              fontSize: 12,
              color: '#666',
              marginBottom: 6,
            }}
          >
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
              <div key={d}>{d}</div>
            ))}
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(7, 1fr)',
              gap: 4,
            }}
          >
            {weeks.map((cell, i) => {
              if (!cell) return <div key={i} />
              const isSame =
                !!date &&
                cell.getFullYear() === date.getFullYear() &&
                cell.getMonth() === date.getMonth() &&
                cell.getDate() === date.getDate()
              const disabled = isPast(cell)
              return (
                <button
                  key={cell.toISOString()}
                  onClick={() => pick(cell)}
                  disabled={disabled || !authed}
                  title={!authed ? 'Log in to pick a date' : disabled ? 'Past date' : `${cell.toDateString()}`}
                  style={{
                    padding: '8px 0',
                    borderRadius: 8,
                    border: isSame ? '2px solid #111' : '1px solid #ddd',
                    background: isSame ? '#111' : '#fff',
                    color: isSame ? '#fff' : '#111',
                    cursor: disabled || !authed ? 'not-allowed' : 'pointer',
                    opacity: disabled || !authed ? 0.6 : 1,
                  }}
                >
                  {cell.getDate()}
                </button>
              )
            })}
          </div>
        </div>

        {/* Time slots (divider after 14:00) */}
        <label style={{ display: 'block', fontWeight: 700, marginBottom: 8 }}>Pick a time</label>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
          {times.map((t) => {
            const active = time === t
            const disabled = !authed || !date
            return (
              <Fragment key={t}>
                <button
                  onClick={() => !disabled && setTime(t)}
                  disabled={disabled}
                  title={disabled ? 'Select a date & log in first' : ''}
                  style={{
                    padding: '8px 12px',
                    borderRadius: 8,
                    border: active ? '2px solid #111' : '1px solid #ddd',
                    background: active ? '#111' : '#fff',
                    color: active ? '#fff' : '#111',
                    cursor: disabled ? 'not-allowed' : 'pointer',
                    opacity: disabled ? 0.6 : 1,
                  }}
                >
                  {t}
                </button>

                {t === '14:00' && (
                  <div
                    style={{
                      flexBasis: '100%',
                      height: 0,
                      borderTop: '1px dashed #e5e5e5',
                      margin: '6px 0',
                    }}
                  />
                )}
              </Fragment>
            )
          })}
        </div>

        <button
          onClick={onBook}
          disabled={!authed || !date || !time}
          className="create_button"
          style={{
            width: '100%',
            cursor: !authed || !date || !time ? 'not-allowed' : 'pointer',
            opacity: !authed || !date || !time ? 0.6 : 1,
          }}
        >
          {!authed
            ? 'Log in to book'
            : !date
            ? 'Select a date'
            : !time
            ? 'Select a time'
            : `Book ${fmtDate(date)} ${time}`}
        </button>

        {!authed && (
          <div
            style={{
              marginTop: 10,
              fontSize: 12,
              color: '#92400e',
              background: '#fffbeb',
              border: '1px solid #fde68a',
              padding: 8,
              borderRadius: 8,
              textAlign: 'center',
            }}
          >
            You need to log in.{' '}
            <button
              onClick={() => (window.location.href = '/?auth=1')}
              style={{
                textDecoration: 'underline',
                border: 0,
                background: 'transparent',
                cursor: 'pointer',
                fontWeight: 600,
              }}
            >
              Log in / Sign up
            </button>
          </div>
        )}
      </aside>
    </div>
  )
}

/** ---------- Utilities ---------- */
const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
]

const navBtnStyle: React.CSSProperties = {
  width: 28,
  height: 28,
  borderRadius: 6,
  border: '1px solid #ddd',
  background: '#fff',
  cursor: 'pointer',
}

function startOfDay(d: Date) {
  const x = new Date(d)
  x.setHours(0, 0, 0, 0)
  return x
}
function isPast(d: Date) {
  return startOfDay(d).getTime() < startOfDay(new Date()).getTime()
}
function fmtDate(d: Date) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${dd}`
}

/** Build 6x7 matrix for a month (padding with null) */
function buildMonthMatrix(year: number, month: number): (Date | null)[] {
  const first = new Date(year, month, 1)
  const firstDay = first.getDay() // 0=Sun
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  const cells: (Date | null)[] = []
  for (let i = 0; i < firstDay; i++) cells.push(null) // leading blanks
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d)) // days
  while (cells.length < 42) cells.push(null) // trailing blanks
  return cells
}

export default Page