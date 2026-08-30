import { Component, type ReactNode } from 'react';

interface Props { children: ReactNode; }
interface State { error: Error | null; }

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  render() {
    if (this.state.error) {
      return (
        <div style={{ padding: 24, background: '#131313', color: '#ffb4ab', fontFamily: 'monospace', minHeight: '100dvh', whiteSpace: 'pre-wrap', overflow: 'auto' }}>
          <h2 style={{ color: '#ff6b6b' }}>Runtime Error</h2>
          <p>{this.state.error.message}</p>
          <pre style={{ color: '#bac9cc', fontSize: 12 }}>{this.state.error.stack}</pre>
        </div>
      );
    }
    return this.props.children;
  }
}
