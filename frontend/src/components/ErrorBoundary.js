import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
    this.setState({
      error: error,
      errorInfo: errorInfo
    });
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          padding: '40px',
          textAlign: 'center',
          minHeight: '100vh',
          backgroundColor: '#04080f',
          color: '#ffffff',
          fontFamily: "'Inter', sans-serif"
        }}>
          <h2 style={{ color: '#ff4f70', marginBottom: '20px' }}>
            Oops! Something went wrong
          </h2>
          <p style={{ color: '#7a9bb5', marginBottom: '30px' }}>
            We encountered an unexpected error. This has been logged for review.
          </p>
          <button
            onClick={this.handleReload}
            style={{
              background: 'linear-gradient(135deg, #00ffe0, #0091ff)',
              border: 'none',
              padding: '12px 24px',
              borderRadius: '6px',
              color: '#04080f',
              fontWeight: '600',
              cursor: 'pointer',
              fontSize: '16px'
            }}
          >
            Reload Application
          </button>
          {process.env.NODE_ENV === 'development' && (
            <details style={{ marginTop: '40px', textAlign: 'left' }}>
              <summary style={{ color: '#00ffe0', cursor: 'pointer' }}>
                Error Details (Development)
              </summary>
              <pre style={{ 
                background: '#0d1525', 
                padding: '20px', 
                borderRadius: '4px', 
                overflow: 'auto',
                marginTop: '10px',
                fontSize: '12px',
                color: '#7a9bb5'
              }}>
                {this.state.error && this.state.error.toString()}
                <br />
                {this.state.errorInfo.componentStack}
              </pre>
            </details>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;