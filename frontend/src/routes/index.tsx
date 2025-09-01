import './index.css'
import { createFileRoute, Link } from '@tanstack/react-router'
import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

type R = {
  id: number
  slug: string
  name: string
  img: string
  tags: string[]
  about?: string
}

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

//login&sginup
type Mode = 'login' | 'signup'
type ApiError = { error: string }
type ApiUser = { id: number; email: string; name: string }
const isEmail = (v: string) => /\S+@\S+\.\S+/.test(v)
const isPhone = (v: string) => /^\d{9,}$/.test(v.replace(/\D/g, ''))
const DEMO = { email: 'demo@plange.app', password: 'pass1234', name: 'Demo User' } as const
const AUTH_KEY = 'plange_auth_user'
const LOGIN_MIN_HEIGHT = 560

function AuthModal({ onClose }: { onClose: () => void }) {
  const [mode, setMode] = useState<Mode>('login')
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [verificationCode, setVerificationCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [me, setMe] = useState<ApiUser | null>(() => {
    try {
      const raw = localStorage.getItem(AUTH_KEY)
      return raw ? (JSON.parse(raw) as ApiUser) : null
    } catch {
      return null
    }
  })

  const emailRef = useRef<HTMLInputElement>(null)
  useEffect(() => {
    emailRef.current?.focus()
  }, [mode])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  function setAuthedUser(user: ApiUser | null) {
    if (user) {
      localStorage.setItem(AUTH_KEY, JSON.stringify(user))
      setMe(user)
      window.dispatchEvent(new CustomEvent('auth:changed', { detail: { authed: true, user } }))
    } else {
      localStorage.removeItem(AUTH_KEY)
      setMe(null)
      window.dispatchEvent(new CustomEvent('auth:changed', { detail: { authed: false } }))
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (mode === 'login') {
      const okId = isEmail(email) || isPhone(email)
      if (!okId) return setError('Please enter a valid email or phone.')
      if (password.length < 6) return setError('Password must be ≥ 6 chars.')

      setLoading(true)
      try {
        // 프론트엔드 데모 로그인(백엔드 없이 동작)
        if (email.toLowerCase() === DEMO.email && password === DEMO.password) {
          const user: ApiUser = { id: 1, email: DEMO.email, name: DEMO.name }
          setAuthedUser(user)
          setPassword('')
          return
        }

        // 실제 백엔드가 있을 때
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ email, password }),
        })
        if (!res.ok) {
          const data = (await res.json()) as ApiError
          throw new Error(data.error || 'Request failed')
        }
        const data = (await res.json()) as { user: ApiUser }
        setAuthedUser(data.user)
        setPassword('')
      } catch (err: any) {
        setError(err?.message ?? 'Login failed')
      } finally {
        setLoading(false)
      }
    } else {
      // signup
      const okId = isEmail(email) || isPhone(email)
      if (!okId) return setError('Please enter a valid email or phone.')
      if (verificationCode.length !== 4)
        return setError('Verification code must be exactly 4 characters.')
      if (name.trim().length < 2) return setError('Please enter your name (2+ chars).')
      if (password.length < 6) return setError('Password must be ≥ 6 chars.')
      if (password !== confirmPassword) return setError('Passwords do not match.')

      setLoading(true)
      try {
        // 프론트엔드 데모 회원가입 성공
        const user: ApiUser = { id: Date.now(), email, name }
        setAuthedUser(user)
      } catch (err: any) {
        setError(err?.message ?? 'Signup failed')
      } finally {
        setLoading(false)
      }
    }
  }

  async function logout() {
    setLoading(true)
    setError(null)
    try {
      await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' })
    } catch {}
    finally {
      setAuthedUser(null)
      setLoading(false)
    }
  }

  const box: React.CSSProperties = {
    border: '1px solid #d9d9d9',
    borderRadius: 10,
    padding: 14,
    marginBottom: 12,
    width: '100%',
  }
  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '10px 12px',
    border: '1px solid #ccc',
    borderRadius: 8,
    boxSizing: 'border-box',
  }
  const padX14: React.CSSProperties = { paddingLeft: 14, paddingRight: 14 }

  const modal = (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,.45)',
        display: 'grid',
        placeItems: 'center',
        zIndex: 50,
      }}
      aria-modal="true"
      role="dialog"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: 'min(92vw, 640px)',
          background: '#fff',
          borderRadius: 12,
          boxShadow: '0 20px 60px rgba(0,0,0,.25)',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px 16px',
            borderBottom: '1px solid #eee',
          }}
        >
          <strong>Log in / Sign up</strong>
          <button
            aria-label="Close"
            onClick={onClose}
            style={{ fontSize: 22, lineHeight: 1, background: 'transparent', border: 0, cursor: 'pointer' }}
          >
            ×
          </button>
        </div>

        <div style={{ padding: 16 }}>
          <div id="auth-root" style={{ maxWidth: 520, margin: '0 auto', textAlign: 'left' }}>
            {me ? (
              <div className="card">
                <p style={{ marginBottom: 8 }}>
                  Logged in as <b>{me.name}</b> ({me.email})
                </p>
                <button onClick={logout} disabled={loading}>
                  {loading ? '…' : 'Log out'}
                </button>
              </div>
            ) : (
              <div className="card" style={mode === 'login' ? { minHeight: LOGIN_MIN_HEIGHT } : undefined}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
                  <button
                    onClick={() => setMode('login')}
                    style={{
                      padding: '.6em 1.2em',
                      borderRadius: 8,
                      border: '1px solid #ddd',
                      background: mode === 'login' ? '#00994C' : '#eee',
                      color: mode === 'login' ? '#fff' : '#333',
                    }}
                    aria-pressed={mode === 'login'}
                  >
                    Log in
                  </button>
                  <button
                    onClick={() => setMode('signup')}
                    style={{
                      padding: '.6em 1.2em',
                      borderRadius: 8,
                      border: '1px solid #ddd',
                      background: mode === 'signup' ? '#00994C' : '#eee',
                      color: mode === 'signup' ? '#fff' : '#333',
                    }}
                    aria-pressed={mode === 'signup'}
                  >
                    Sign up
                  </button>
                </div>

                <form onSubmit={submit}>
                  {mode === 'login' && (
                    <div style={box}>
                      <div style={{ marginBottom: 10 }}>
                        <label htmlFor="email" style={{ display: 'block', marginBottom: 6 }}>
                          Email or phone
                        </label>
                        <input
                          ref={emailRef}
                          id="email"
                          type="text"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="you@example.com / 123456789"
                          required
                          style={inputStyle}
                          autoComplete="username"
                        />
                      </div>
                      <div style={{ marginBottom: 10 }}>
                        <label htmlFor="password" style={{ display: 'block', marginBottom: 6 }}>
                          Password
                        </label>
                        <input
                          id="password"
                          type="password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="••••••••"
                          required
                          minLength={6}
                          style={inputStyle}
                          autoComplete="current-password"
                        />
                      </div>
                    </div>
                  )}

                  {mode === 'signup' && (
                    <div style={box}>
                      <div style={{ marginBottom: 10 }}>
                        <label htmlFor="email2" style={{ display: 'block', marginBottom: 6 }}>
                          Email or phone
                        </label>
                        <input
                          ref={emailRef}
                          id="email2"
                          type="text"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="you@example.com / 123456789"
                          required
                          style={inputStyle}
                          autoComplete="username"
                        />
                      </div>
                      <div style={{ marginBottom: 10 }}>
                        <label htmlFor="code" style={{ display: 'block', marginBottom: 6 }}>
                          Verification code (4 number)
                        </label>
                        <input
                          id="code"
                          type="text"
                          value={verificationCode}
                          onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 4))}
                          placeholder="****"
                          maxLength={4}
                          required
                          style={inputStyle}
                          inputMode="numeric"
                          pattern="\d{4}"
                        />
                      </div>
                      <div style={{ marginBottom: 10 }}>
                        <label htmlFor="name" style={{ display: 'block', marginBottom: 6 }}>
                          Name (nickname)
                        </label>
                        <input
                          id="name"
                          type="text"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="Your name"
                          required
                          style={inputStyle}
                          autoComplete="nickname"
                        />
                      </div>
                      <div style={{ marginBottom: 10 }}>
                        <label htmlFor="password1" style={{ display: 'block', marginBottom: 6 }}>
                          Password
                        </label>
                        <input
                          id="password1"
                          type="password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="6+ characters"
                          required
                          minLength={6}
                          style={inputStyle}
                          autoComplete="new-password"
                        />
                      </div>
                      <div style={{ marginBottom: 10 }}>
                        <label htmlFor="password2" style={{ display: 'block', marginBottom: 6 }}>
                          Re-enter password
                        </label>
                        <input
                          id="password2"
                          type="password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="Confirm password"
                          required
                          minLength={6}
                          style={inputStyle}
                          autoComplete="new-password"
                        />
                      </div>
                    </div>
                  )}

                  {error && (
                    <p role="alert" aria-live="assertive" style={{ color: '#b00020', margin: '6px 14px' }}>
                      {error}
                    </p>
                  )}

                  <div style={padX14}>
                    <button type="submit" disabled={loading} className="create_button" style={{ width: '100%' }}>
                      {loading ? '…' : mode === 'login' ? 'Log in' : 'Create account'}
                    </button>
                  </div>

                  <div style={{ ...padX14, marginTop: 10 }}>
                    <div style={{ border: '1px dashed #ccc', borderRadius: 8, padding: 10 }}>
                      <b>Demo login (frontend only)</b>
                      <div>
                        email: <code>{DEMO.email}</code>
                      </div>
                      <div>
                        password: <code>{DEMO.password}</code>
                      </div>
                    </div>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )

  return createPortal(modal, document.body)
}

function Home() {
	// 모달 열림 상태 + (선택) 로그인 사용자 이름 표시용
	const [open, setOpen] = useState(false)
	const [me, setMe] = useState<ApiUser | null>(() => {
	  try {
		const raw = localStorage.getItem(AUTH_KEY)
		return raw ? (JSON.parse(raw) as ApiUser) : null
	  } catch {
		return null
	  }
	})
  
	// AuthModal에서 dispatch 하는 'auth:changed' 이벤트 수신 → 버튼 라벨 갱신
	useEffect(() => {
	  const onAuth = (e: Event) =>
		setMe((e as CustomEvent).detail?.authed ? (e as CustomEvent).detail.user : null)
	  window.addEventListener('auth:changed', onAuth)
	  return () => window.removeEventListener('auth:changed', onAuth)
	}, [])

	useEffect(() => {
		const sp = new URLSearchParams(window.location.search)
		if (sp.get('auth') === '1') setOpen(true)
	  }, [])
  
	return (
	  <div>
		{/* 상단 헤더: 오른쪽 로그인/회원가입 버튼 */}
		<header style={{ marginBottom: 16 }}>
		  <div style={{
			display: 'flex',
			alignItems: 'center',
			justifyContent: 'space-between',
			gap: 12,
		  }}>
			<h2 style={{ fontWeight: 800 }}>
			  FOOD YUM <span style={{ fontSize: 12 }}>(inc)</span>
			</h2>
  
			<button
			  onClick={() => setOpen(true)}
			  style={{
				padding: '8px 12px',
				borderRadius: 8,
				border: '1px solid #ddd',
				background: '#00994C',
				color: '#fff',
				cursor: 'pointer',
			  }}
			>
			  {me ? `Hello, ${me.name.split(' ')[0]}` : 'Log in / Sign up'}
			</button>
		  </div>
		</header>
  
		{/* 기존 레스토랑 리스트 UI (그대로 유지) */}
		<div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12, marginBottom: 16 }}>
		  <h1 style={{ fontSize: 28, fontWeight: 800 }}>LIST OF RESTAURANTS · WHERE SHALL I EAT?</h1>
		  <div style={{ maxWidth: 360, color: '#666' }}>Simple bookings with calendar... bulabula</div>
		</div>
  
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
  
		{/* 🔹 버튼 클릭 시 모달 렌더 */}
		{open && <AuthModal onClose={() => setOpen(false)} />}
	  </div>
	)
  }

export const Route = createFileRoute('/')({
  component: Home,
})