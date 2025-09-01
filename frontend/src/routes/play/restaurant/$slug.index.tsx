import { createFileRoute, useParams } from '@tanstack/react-router'
import { useEffect, useMemo, useState } from 'react'

type ApiUser = { id: number; email: string; name: string }
const AUTH_KEY = 'plange_auth_user'

// 샘플 레스토랑 데이터 (홈 카드와 동일한 3개)
const RESTAURANTS: Record<
  string,
  { name: string; about: string; img: string; tags: string[] }
> = {
  'tony-strombolis-italian': {
    name: "Tony Stromboli’s Italian",
    about: 'TONY COOKS UP ONE HELL OF A PIZZA PIE',
    img: 'https://images.unsplash.com/photo-1523986371872-9d3ba2e2f642?q=80&w=1600&auto=format&fit=crop',
    tags: ['italian', 'ADULT', 'bar'],
  },
  'umami-sushi': {
    name: 'Umami Sushi',
    about: 'Fresh nigiri, maki and omakase.',
    img: 'https://images.unsplash.com/photo-1553621042-f6e147245754?q=80&w=1600&auto=format&fit=crop',
    tags: ['japanese', 'sushi'],
  },
  'green-garden': {
    name: 'Green Garden',
    about: 'Plant-forward seasonal plates.',
    img: 'https://images.unsplash.com/photo-1526318472351-c75fcf070305?q=80&w=1600&auto=format&fit=crop',
    tags: ['vegan', 'casual'],
  },
}

export const Route = createFileRoute('/play/restaurant/$slug/')({
  component: Page,
})

function Page() {
  const { slug } = useParams({ from: '/play/restaurant/$slug/' })

  // --- 로그인 상태 -------------------------------
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

  // --- 좌측: 레스토랑 정보 ------------------------
  const info =
    RESTAURANTS[slug ?? ''] ??
    ({
      name: (slug ?? '').replaceAll('-', ' '),
      about: 'Welcome!',
      img: 'https://picsum.photos/seed/restaurant/1200/800',
      tags: ['restaurant'],
    } as const)

  // --- 우측: 달력 + 시간 선택 ---------------------
  const [view, setView] = useState(() => {
    const d = new Date()
    return { year: d.getFullYear(), month: d.getMonth() } // month: 0~11
  })
  const [date, setDate] = useState<Date | null>(null)
  const [time, setTime] = useState<string | null>(null)

  const times = ['18:00', '18:30', '19:00', '19:30', '20:00']

  const weeks = useMemo(() => buildMonthMatrix(view.year, view.month), [view])

  function prevMonth() {
    setView((v) => {
      const m = v.month - 1
      return m < 0 ? { year: v.year - 1, month: 11 } : { year: v.year, month: m }
    })
  }
  function nextMonth() {
    setView((v) => {
      const m = v.month + 1
      return m > 11 ? { year: v.year + 1, month: 0 } : { year: v.year, month: m }
    })
  }
  function pick(d: Date) {
    if (!authed) return // 비로그인 시 선택 불가
    setDate(d)
    setTime(null)
  }

  function onBook() {
    if (!authed) {
      // 로그인 유도: 홈으로 이동 + 모달 자동 오픈
      window.location.href = '/?auth=1'
      return
    }
    if (!date || !time) return
    const y = date.getFullYear()
    const m = String(date.getMonth() + 1).padStart(2, '0')
    const dd = String(date.getDate()).padStart(2, '0')
    alert(`Booked: ${info.name}\nWhen: ${y}-${m}-${dd} ${time}\n(데모)`)
  }

  return (
    <div
      style={{
        display: 'grid',
        gap: 20,
        gridTemplateColumns: '2fr 1fr',
        alignItems: 'start',
      }}
    >
      {/* LEFT: Restaurant detail */}
      <section
        style={{
          border: '1px solid #e5e5e5',
          borderRadius: 12,
          overflow: 'hidden',
          background: '#fff',
        }}
      >
        <div style={{ padding: 16 }}>
          <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 8 }}>
            {info.name.toUpperCase()}
          </h1>
          <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
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
        <div style={{ width: '100%', aspectRatio: '16/9', background: '#f6f6f6' }}>
          <img
            src={info.img}
            alt={info.name}
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          />
        </div>
        <div style={{ padding: 16 }}>
          <h3 style={{ fontSize: 14, letterSpacing: 1, marginBottom: 8 }}>ABOUT US:</h3>
          <p style={{ fontWeight: 600 }}>{info.about}</p>
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
            <button
              onClick={prevMonth}
              aria-label="prev"
              style={navBtnStyle}
              title="Previous month"
            >
              ‹
            </button>
            <strong>
              {MONTH_NAMES[view.month]} {view.year}
            </strong>
            <button
              onClick={nextMonth}
              aria-label="next"
              style={navBtnStyle}
              title="Next month"
            >
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
                  title={
                    !authed
                      ? 'Log in to pick a date'
                      : disabled
                      ? 'Past date'
                      : `${cell.toDateString()}`
                  }
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

        {/* Time slots */}
        <label style={{ display: 'block', fontWeight: 700, marginBottom: 8 }}>Pick a time</label>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
          {times.map((t) => {
            const active = time === t
            const disabled = !authed || !date
            return (
              <button
                key={t}
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
              style={{ textDecoration: 'underline', border: 0, background: 'transparent', cursor: 'pointer', fontWeight: 600 }}
            >
              Log in / Sign up
            </button>
          </div>
        )}
      </aside>
    </div>
  )
}

/** Utilities */
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

/** 해당 월을 6주(최대 42칸) 매트릭스로 반환. 이전/다음달은 null 채움 */
function buildMonthMatrix(year: number, month: number): (Date | null)[] {
  const first = new Date(year, month, 1)
  const firstDay = first.getDay() // 0=Sun
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  const cells: (Date | null)[] = []
  // 앞쪽 빈칸
  for (let i = 0; i < firstDay; i++) cells.push(null)
  // 이번 달
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d))
  // 6*7=42 칸으로 패딩
  while (cells.length < 42) cells.push(null)
  return cells
}

export default Page