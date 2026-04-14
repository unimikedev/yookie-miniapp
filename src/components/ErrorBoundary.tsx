/**
 * ErrorBoundary — catches any unhandled JS errors in the component tree.
 * Shows a friendly error screen with "Go Home" button instead of blank screen.
 */

import { Component, type ReactNode } from 'react'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(): State {
    return { hasError: true }
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[ErrorBoundary]', error, info.componentStack)
  }

  handleGoHome = () => {
    this.setState({ hasError: false })
    window.location.href = '/'
  }

  handleRetry = () => {
    this.setState({ hasError: false })
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          padding: '32px',
          textAlign: 'center',
          background: 'var(--color-bg, #0F1115)',
        }}>
          <svg width="48" height="48" viewBox="0 0 48 48" fill="none" style={{ marginBottom: 20, opacity: 0.6 }}>
            <circle cx="24" cy="24" r="22" stroke="#6B7280" strokeWidth="2" />
            <path d="M24 14V28" stroke="#6B7280" strokeWidth="2.5" strokeLinecap="round" />
            <circle cx="24" cy="34" r="1.5" fill="#6B7280" />
          </svg>
          <h2 style={{
            fontSize: 20,
            fontWeight: 700,
            color: 'var(--color-text, #F9FAFB)',
            margin: '0 0 8px',
          }}>
            Что-то пошло не так
          </h2>
          <p style={{
            fontSize: 14,
            color: 'var(--color-text-secondary, #9CA3AF)',
            lineHeight: 1.5,
            margin: '0 0 28px',
          }}>
            Произошла непредвиденная ошибка. Попробуйте обновить страницу.
          </p>
          <div style={{ display: 'flex', gap: 12, width: '100%' }}>
            <button
              onClick={this.handleGoHome}
              style={{
                flex: 1,
                height: 48,
                background: 'var(--color-accent, #6BCEFF)',
                color: 'var(--color-bg, #0F1115)',
                fontSize: 15,
                fontWeight: 700,
                border: 'none',
                borderRadius: 999,
                cursor: 'pointer',
                fontFamily: "'Gilroy', sans-serif",
              }}
            >
              На главную
            </button>
            <button
              onClick={this.handleRetry}
              style={{
                flex: 1,
                height: 48,
                background: 'var(--color-surface, #1A1D22)',
                color: 'var(--color-text, #F9FAFB)',
                fontSize: 15,
                fontWeight: 600,
                border: 'none',
                borderRadius: 999,
                cursor: 'pointer',
                fontFamily: "'Gilroy', sans-serif",
              }}
            >
              Повторить
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
