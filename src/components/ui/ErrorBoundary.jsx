import React from 'react'

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 40, textAlign: 'center', height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <h2 style={{ fontSize: 24, marginBottom: 16 }}>Something went wrong.</h2>
          <p style={{ color: 'var(--danger)', marginBottom: 24, maxWidth: 500, wordWrap: 'break-word' }}>
            {this.state.error?.toString()}
          </p>
          <button 
            className="btn btn-primary"
            onClick={() => window.location.reload()}
          >
            Reload Page
          </button>
        </div>
      )
    }

    return this.props.children
  }
}
