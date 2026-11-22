
import { useRef, useState } from 'react'
import { useAuth } from './AuthContext'
import {
  getPasswordRequirements,
  isValidEmail,
} from './passwordValidation'
import './AuthForm.css'

function getAuthErrorMessage(error) {
  const message = String(error?.message || '').toLowerCase()

  if (message.includes('invalid login credentials')) {
    return 'Correo o contraseña incorrectos.'
  }
  if (message.includes('already registered') || message.includes('user already exists')) {
    return 'Ya existe una cuenta con ese correo.'
  }
  if (message.includes('invalid email') || message.includes('email address is invalid')) {
    return 'El correo electrónico no tiene un formato válido.'
  }
  if (message.includes('weak password') || message.includes('password should')) {
    return 'La contraseña no cumple los requisitos de seguridad configurados.'
  }
  if (message.includes('email not confirmed')) {
    return 'Confirma tu correo electrónico antes de iniciar sesión.'
  }
  if (message.includes('rate limit') || message.includes('too many requests')) {
    return 'Se hicieron demasiados intentos. Espera un momento y vuelve a intentarlo.'
  }
  if (
    message.includes('failed to fetch') ||
    message.includes('network') ||
    message.includes('fetch')
  ) {
    return 'No se pudo conectar con el servicio. Revisa tu conexión e inténtalo de nuevo.'
  }

  return 'No se pudo completar la solicitud. Inténtalo de nuevo.'
}

export default function AuthForm({ onClose }) {
  const { login, register } = useAuth()

  const [mode, setMode] = useState('login')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)
  const submitLock = useRef(false)

  async function handleSubmit(e) {
    e.preventDefault()
    if (busy || submitLock.current) return

    setError('')
    setMessage('')

    if (mode === 'register') {
      if (!name.trim()) {
        setError('Ingresa un nombre de usuario válido.')
        return
      }
      if (!isValidEmail(email)) {
        setError('Ingresa un correo electrónico válido.')
        return
      }
      if (!passwordRequirements.every(requirement => requirement.met)) {
        setError('La contraseña debe cumplir todos los requisitos indicados.')
        return
      }
      if (!confirmPassword || password !== confirmPassword) {
        setError(confirmPassword
          ? 'Las contraseñas no coinciden.'
          : 'Confirma tu contraseña.')
        return
      }
    }

    submitLock.current = true
    setBusy(true)

    try {
      if (mode === 'login') {
        await login(email, password)
        onClose()
      } else {
        const data = await register(name, email, password)
        setPassword('')
        setConfirmPassword('')

        if (data.session) {
          onClose()
        } else {
          setMessage(
            'Revisa tu correo para confirmar tu cuenta.'
          )
        }
      }
    } catch (err) {
      setError(getAuthErrorMessage(err))
    } finally {
      submitLock.current = false
      setBusy(false)
    }
  }

  const passwordRequirements = getPasswordRequirements(password)
  const registrationValid = mode !== 'register' || (
    Boolean(name.trim()) &&
    isValidEmail(email) &&
    passwordRequirements.every(requirement => requirement.met) &&
    Boolean(confirmPassword) &&
    password === confirmPassword
  )
  const passwordsMismatch = Boolean(confirmPassword) && password !== confirmPassword
  const confirmationMissing = mode === 'register' && Boolean(password) && !confirmPassword
  const invalidEmail = Boolean(email) && !isValidEmail(email)
  const invalidName = Boolean(name) && !name.trim()

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
            <label className="auth-field">
              <span>Nombre completo</span>
              <input
                type="text"
                placeholder="Nombre completo"
                value={name}
                onChange={event => setName(event.target.value)}
                autoComplete="name"
                aria-invalid={invalidName}
                aria-describedby={invalidName ? 'auth-name-error' : undefined}
                required
              />
              {invalidName && (
                <span className="auth-field-error" id="auth-name-error" role="alert">
                  Ingresa un nombre de usuario válido.
                </span>
              )}
            </label>
          )}

          <label className="auth-field">
            <span>Correo electrónico</span>
            <input
              type="email"
              placeholder="Correo electrónico"
              value={email}
              onChange={event => setEmail(event.target.value)}
              autoComplete="email"
              aria-invalid={invalidEmail}
              aria-describedby={invalidEmail ? 'auth-email-error' : undefined}
              required
            />
            {invalidEmail && (
              <span className="auth-field-error" id="auth-email-error" role="alert">
                Ingresa un correo electrónico válido.
              </span>
            )}
          </label>

          <label className="auth-field">
            <span>Contraseña</span>
            <input
              type="password"
              placeholder="Contraseña"
              value={password}
              onChange={event => setPassword(event.target.value)}
              autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
              aria-invalid={mode === 'register' && password.length > 0 &&
                passwordRequirements.some(requirement => !requirement.met)}
              aria-describedby={mode === 'register' ? 'auth-password-requirements' : undefined}
              required
            />
            {mode === 'register' && (
              <ul
                className="auth-password-requirements"
                id="auth-password-requirements"
                aria-label="Requisitos de contraseña"
                aria-live="polite"
              >
                {passwordRequirements.map(requirement => (
                  <li
                    className={requirement.met ? 'is-met' : 'is-pending'}
                    aria-label={`${requirement.label}: ${requirement.met ? 'cumplido' : 'pendiente'}`}
                    key={requirement.id}
                  >
                    <span aria-hidden="true">{requirement.met ? '✓' : '○'}</span>
                    {requirement.label}
                  </li>
                ))}
              </ul>
            )}
          </label>

          {mode === 'register' && (
            <label className="auth-field">
              <span>Confirmar contraseña</span>
              <input
                type="password"
                placeholder="Confirmar contraseña"
                value={confirmPassword}
                onChange={event => setConfirmPassword(event.target.value)}
                autoComplete="new-password"
                aria-invalid={passwordsMismatch || confirmationMissing}
                aria-describedby={
                  passwordsMismatch || confirmationMissing ? 'auth-confirm-error' : undefined
                }
                required
              />
              {(passwordsMismatch || confirmationMissing) && (
                <span className="auth-field-error" id="auth-confirm-error" role="alert">
                  {passwordsMismatch
                    ? 'Las contraseñas no coinciden'
                    : 'Confirma tu contraseña.'}
                </span>
              )}
            </label>
          )}

          {error && <p className="auth-error" role="alert">{error}</p>}
          {message && <p className="auth-message" role="status">{message}</p>}

          <button disabled={busy || !registrationValid} type="submit">
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
            setMode(currentMode => currentMode === 'login' ? 'register' : 'login')
            setError('')
            setMessage('')
            setPassword('')
            setConfirmPassword('')
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
