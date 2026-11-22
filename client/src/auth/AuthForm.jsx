
import { useState } from 'react'
import { useAuth } from './AuthContext'
import './AuthForm.css'

export default function AuthForm({ onClose }) {
  const { login, register } = useAuth()

  const [mode, setMode] = useState('login')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setMessage('')
    setBusy(true)

    try {
      if (mode === 'login') {
        await login(email, password)
        onClose()
      } else {
        const data = await register(name, email, password)

        if (data.session) {
          onClose()
        } else {
          setMessage(
            'Revisa tu correo para confirmar tu cuenta.'
          )
        }
      }
    } catch (err) {
      setError(err.message || 'Ocurrió un error')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="auth-overlay" onClick={onClose}>
      <div
        className="auth-panel"
        role="dialog"
        aria-modal="true"
        aria-label="Acceso a AutoLibrary"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          className="auth-close"
          onClick={onClose}
          aria-label="Cerrar"
        >
          ×
        </button>

        <h2>AutoLibrary</h2>
        <p>Tu biblioteca digital automotriz</p>

        <h3>
          {mode === 'login'
            ? 'Iniciar sesión'
            : 'Crear cuenta'}
        </h3>

        <form onSubmit={handleSubmit}>
          {mode === 'register' && (
            <input
              type="text"
              placeholder="Nombre completo"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          )}

          <input
            type="email"
            placeholder="Correo electrónico"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <input
            type="password"
            placeholder="Contraseña"
            value={password}
            minLength={6}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          {error && <p className="auth-error">{error}</p>}
          {message && <p className="auth-message">{message}</p>}

          <button disabled={busy} type="submit">
            {busy
              ? 'Procesando...'
              : mode === 'login'
                ? 'Iniciar sesión'
                : 'Registrarse'}
          </button>
        </form>

        <button
          className="auth-switch"
          type="button"
          onClick={() => {
            setMode(mode === 'login' ? 'register' : 'login')
            setError('')
            setMessage('')
          }}
        >
          {mode === 'login'
            ? '¿No tienes cuenta? Regístrate'
            : '¿Ya tienes cuenta? Inicia sesión'}
        </button>
      </div>
    </div>
  )
}
