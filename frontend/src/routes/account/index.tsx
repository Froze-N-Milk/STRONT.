// frontend/src/routes/account/index.tsx
import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useMemo, useState } from 'react'

/** Types */
type ApiUser = { id: number; email: string; name: string }
type Booking = { id: number; slug: string; time: string; createdAt: number }

/** LocalStorage keys */
const AUTH_KEY = 'plange_auth_user'
const BOOKINGS_KEY = 'plange_bookings' // storage shape: { [userId: string]: Booking[] }

/** fetch hello text from backend (kept from master) */
const accountInfo = (): Promise<string> =>
  fetch('/api/account', { method: 'GET' })
    .then(async (r) => r.text())
    .catch(() => '')

/** LocalStorage helpers */
function readMe(): ApiUser | null {
  try {
    const raw = localStorage.getItem(AUTH_KEY)
    return raw ? (JSON.parse(raw) as ApiUser) : null
  } catch {
    return null
  }
}
function saveMe(user: ApiUser | null) {
  if (user) localStorage.setItem(AUTH_KEY, JSON.stringify(user))
  else localStorage.removeItem(AUTH_KEY)
  window.dispatchEvent(new CustomEvent('auth:changed', { detail: { authed: !!user, user } }))
}
type BookingMap = Record<string, Booking[]>
function readAllBookings(): BookingMap {
  try {
    const raw = localStorage.getItem(BOOKINGS_KEY)
    return raw ? (JSON.parse(raw) as BookingMap) : {}
  } catch {
    return {}
  }
}
function writeAllBookings(map: BookingMap) {
  localStorage.setItem(BOOKINGS_KEY, JSON.stringify(map))
}

/** Page component */
function Account() {
  // auth + profile
  const [me, setMe] = useState<ApiUser | null>(readMe())
  const [name, setName] = useState(me?.name ?? '')
  const [email, setEmail] = useState(me?.email ?? '')
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)

  // for backend hello (from master version)
  const [helloEmail, setHelloEmail] = useState('')
  useEffect(() => {
    accountInfo().then(setHelloEmail).catch(() => {})
  }, [])

  // react to auth / bookings changes
  useEffect(() => {
    const onAuth = (e: any) => {
      const u = e.detail?.authed ? (e.detail.user as ApiUser) : null
      setMe(u)
      setName(u?.name ?? '')
      setEmail(u?.email ?? '')
    }
    const onBookings = () => setTick((t) => t + 1)
    window.addEventListener('auth:changed', onAuth)
    window.addEventListener('bookings:changed', onBookings as any)
    return () => {
      window.removeEventListener('auth:changed', onAuth)
      window.removeEventListener('bookings:changed', onBookings as any)
    }
  }, [])

  // bookings
  const [tick, setTick] = useState(0)
  const bookings = useMemo<Booking[]>(() => {
    if (!me) return []
    const all = readAllBookings()
    const key = String(me.id)
    return (all[key] ?? []).sort((a, b) => b.createdAt - a.createdAt)
  }, [me, tick])

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault()
    if (!me) return
    setSaving(true)
    setMsg(null)
    try {
      const updated: ApiUser = { ...me, name: name.trim(), email: email.trim() }
      saveMe(updated)
      setMe(updated)
      setMsg('Saved!')
    } finally {
      setSaving(false)
    }
  }

  function deleteBooking(id: number) {
    if (!me) return
    const all = readAllBookings()
    const key = String(me.id)
    all[key] = (all[key] ?? []).filter((b) => b.id !== id)
    writeAllBookings(all)
    setTick((t) => t + 1)
  }

  // Not authed UI
  if (!me) {
    return (
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '16px' }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 12 }}>Account</h1>
        <p>You are not logged in. Please go back and log in first.</p>
        {helloEmail && (
          <p style={{ color: '#666' }}>
            (Hello <b>{helloEmail}</b>!)
          </p>
        )}
      </div>
    )
  }

  // Authed UI
  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '16px', display: 'grid', gap: 24 }}>
      <header style={{ borderBottom: '1px solid #eee', paddingBottom: 8 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800 }}>Account</h1>
      </header>

      {/* Profile */}
      <section style={{ border: '1px solid #e5e5e5', borderRadius: 12, padding: 16, background: '#fff' }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 12 }}>Profile</h2>
        <form onSubmit={saveProfile} style={{ display: 'grid', gap: 12, maxWidth: 420 }}>
          <div>
            <label style={{ display: 'block', fontWeight: 600, marginBottom: 6 }}>Name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={{ width: '100%', padding: '10px 12px', border: '1px solid #ccc', borderRadius: 8 }}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontWeight: 600, marginBottom: 6 }}>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{ width: '100%', padding: '10px 12px', border: '1px solid #ccc', borderRadius: 8 }}
            />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button type="submit" disabled={saving} className="create_button" style={{ padding: '8px 16px' }}>
              {saving ? 'Saving…' : 'Save'}
            </button>
            {msg && <span style={{ color: '#16a34a' }}>{msg}</span>}
          </div>
        </form>
      </section>

      {/* Bookings */}
      <section style={{ border: '1px solid #e5e5e5', borderRadius: 12, padding: 16, background: '#fff' }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 12 }}>My bookings</h2>
        {!bookings.length ? (
          <p style={{ color: '#666' }}>No bookings yet.</p>
        ) : (
          <div style={{ display: 'grid', gap: 12 }}>
            {bookings.map((b) => (
              <div
                key={b.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  border: '1px solid #eee',
                  padding: '12px 14px',
                  borderRadius: 10,
                }}
              >
                <div>
                  <div style={{ fontWeight: 700 }}>{b.slug.replaceAll('-', ' ')}</div>
                  <div style={{ color: '#666', fontSize: 14 }}>
                    {b.time} · {new Date(b.createdAt).toLocaleString()}
                  </div>
                </div>
                <button
                  onClick={() => deleteBooking(b.id)}
                  style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #ddd', background: '#fff' }}
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

/** TanStack Router route */
export const Route = createFileRoute('/account/')({
  component: Account,
})

export default Account