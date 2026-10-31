import { useEffect, useRef, useState } from 'react'
import { verifyPasskey } from '../services/authorizationService'
import { GALLERY_CONFIG } from '../config/galleryConfig'

export default function AuthorizationModal({ onSuccess }) {
  const [value, setValue] = useState('')
  const [show, setShow] = useState(false)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const inputRef = useRef(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const submit = async (e) => {
    e.preventDefault()
    if (busy) return
    if (!value) {
      setError('Please enter the passkey.')
      inputRef.current?.focus()
      return
    }
    setBusy(true)
    setError('')
    let ok = false
    try {
      ok = await verifyPasskey(value)
    } catch {
      setError('Verification failed. Please try again.')
    }
    setBusy(false)
    if (ok) {
      onSuccess()
      return
    }
    setError((prev) => prev || 'Incorrect passkey. Please try again.')
    setValue('')
    inputRef.current?.focus()
  }

  const cancel = () => {
    setValue('')
    setError('Authorization is required to view the gallery.')
    inputRef.current?.focus()
  }

  return (
    <div className="overlay overlay--auth">
      <form
        className="auth"
        role="dialog"
        aria-modal="true"
        aria-labelledby="auth-title"
        aria-describedby="auth-text"
        onSubmit={submit}
      >
        <div className="auth__logo" aria-hidden="true">🖼️</div>
        <h2 id="auth-title">Gallery Access Required</h2>
        <p id="auth-text" className="muted">
          This personal gallery is protected. Enter the authorization passkey to continue.
        </p>
        <label className="sr-only" htmlFor="passkey">Authorization passkey</label>
        <div className="auth__field">
          <input
            id="passkey"
            ref={inputRef}
            type={show ? 'text' : 'password'}
            value={value}
            autoComplete="off"
            placeholder="Enter authorization passkey"
            aria-invalid={Boolean(error)}
            onChange={(e) => setValue(e.target.value)}
          />
          <button
            type="button"
            className="btn btn--ghost"
            onClick={() => setShow((s) => !s)}
            aria-pressed={show}
            aria-label={show ? 'Hide passkey' : 'Show passkey'}
          >
            {show ? 'Hide' : 'Show'}
          </button>
        </div>
        <p className="auth__error" role="alert">{error}</p>
        <div className="auth__actions">
          <button type="button" className="btn" onClick={cancel} disabled={busy}>Cancel</button>
          <button type="submit" className="btn btn--primary" disabled={busy}>
            {busy ? 'Verifying…' : 'Submit'}
          </button>
        </div>
        <p className="auth__brand muted">{GALLERY_CONFIG.title}</p>
      </form>
    </div>
  )
}