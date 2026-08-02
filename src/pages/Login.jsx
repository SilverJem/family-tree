import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth.js'

export default function Login() {
  const [tab, setTab] = useState('signin') // 'signin' | 'register'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [registered, setRegistered] = useState(false)

  const { signIn, signUp } = useAuth()
  const navigate = useNavigate()

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      if (tab === 'signin') {
        await signIn({ email, password })
        navigate('/')
      } else {
        await signUp({ email, password })
        setRegistered(true)
      }
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {/* Ambient background blobs */}
      <div className="clay-blobs">
        <div className="blob b1" />
        <div className="blob b2" />
        <div className="blob b3" />
      </div>

      <div className="auth-page">
        <div className="auth-card">
          {/* Brand */}
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <div style={{
              width: 64, height: 64, borderRadius: '50%', background: 'linear-gradient(135deg, #0ea5e9, #0891b2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 16px', border: '2px solid #2F363D',
              boxShadow: '4px 4px 0px rgba(47,54,61,0.15)', fontSize: 28,
            }}>
              🌳
            </div>
            <h1 style={{ fontSize: 28, marginBottom: 4 }}>Family Tree Builder</h1>
            <p className="text-muted text-sm">Build, explore, and share your family history</p>
          </div>

          {/* Tabs */}
          <div className="auth-tabs">
            <button
              className={`auth-tab${tab === 'signin' ? ' active' : ''}`}
              onClick={() => { setTab('signin'); setError(''); setRegistered(false) }}
            >
              Sign In
            </button>
            <button
              className={`auth-tab${tab === 'register' ? ' active' : ''}`}
              onClick={() => { setTab('register'); setError(''); setRegistered(false) }}
            >
              Create Account
            </button>
          </div>

          {registered ? (
            <div style={{
              textAlign: 'center', padding: '24px',
              background: 'var(--accent-faint)', border: '2px solid var(--accent)',
              borderRadius: 'var(--radius-md)',
            }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>📬</div>
              <p style={{ fontWeight: 700, marginBottom: 8 }}>Check your inbox!</p>
              <p className="text-muted text-sm">
                We sent a confirmation link to <strong>{email}</strong>.<br />
                Click it to activate your account, then sign in.
              </p>
              <button
                className="btn btn-ghost btn-sm"
                style={{ marginTop: 16 }}
                onClick={() => { setTab('signin'); setRegistered(false) }}
              >
                Back to Sign In
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              {error && <div className="modal-error">{error}</div>}

              <div className="field">
                <label htmlFor="email">Email address</label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  autoComplete="email"
                />
              </div>

              <div className="field">
                <label htmlFor="password">Password</label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={tab === 'register' ? 'At least 8 characters' : '••••••••'}
                  required
                  minLength={tab === 'register' ? 8 : undefined}
                  autoComplete={tab === 'signin' ? 'current-password' : 'new-password'}
                />
              </div>

              <button
                type="submit"
                className="btn btn-primary btn-block"
                disabled={loading}
                style={{ marginTop: 8 }}
              >
                {loading
                  ? 'Please wait…'
                  : tab === 'signin'
                  ? 'Sign In'
                  : 'Create Account'}
              </button>
            </form>
          )}
        </div>
      </div>
    </>
  )
}
