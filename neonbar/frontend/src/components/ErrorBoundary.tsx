import { Component, type ReactNode, type ErrorInfo } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[ErrorBoundary]', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div
          role="alert"
          className="flex flex-col items-center justify-center p-8 text-center"
        >
          <AlertTriangle size={40} className="text-[var(--color-error)] mb-4" />
          <h2 className="text-lg font-semibold text-[var(--color-on-surface)] mb-2">
          </h2>
          <p className="text-sm text-[var(--color-on-surface-variant)] mb-4 max-w-md">
            Ocorreu um erro inesperado. Tente recarregar a pagina.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--color-primary-container)] text-[var(--color-on-primary)] text-sm font-medium hover:brightness-110 transition-all cursor-pointer"
          >
            <RefreshCw size={16} />
            Recarregar Pagina
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
