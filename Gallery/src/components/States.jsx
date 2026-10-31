import { Component } from 'react'

export function EmptyState({ icon = '🗂️', title, text, action }) {
  return (
    <div className="state">
      <div className="state__icon" aria-hidden="true">{icon}</div>
      <h3>{title}</h3>
      {text && <p className="muted">{text}</p>}
      {action}
    </div>
  )
}

export function LoadingState({ label = 'Loading…' }) {
  return (
    <div className="state" role="status">
      <div className="spinner" aria-hidden="true" />
      <p className="muted">{label}</p>
    </div>
  )
}

export function ErrorState({ title = 'Something went wrong', text }) {
  return (
    <div className="state state--error" role="alert">
      <div className="state__icon" aria-hidden="true">⚠️</div>
      <h3>{title}</h3>
      {text && <p className="muted">{text}</p>}
    </div>
  )
}

export class ErrorBoundary extends Component {
  state = { failed: false }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  componentDidCatch(error) {
    console.error('Gallery error:', error)
  }

  render() {
    if (this.state.failed) {
      return (
        <ErrorState
          title="The gallery failed to load"
          text="Please refresh the page. If the problem continues, check the media files."
        />
      )
    }
    return this.props.children
  }
}