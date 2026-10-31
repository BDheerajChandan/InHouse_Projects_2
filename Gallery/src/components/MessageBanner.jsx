const ICONS = { info: 'ℹ️', success: '✅', warn: '⚠️', error: '⛔' }

export default function MessageBanner({ text, type = 'info' }) {
  return (
    <div className="container">
      <div className={`banner banner--${type}`} role="note">
        <span aria-hidden="true">{ICONS[type]}</span>
        <p>{text}</p>
      </div>
    </div>
  )
}