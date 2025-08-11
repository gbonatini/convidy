import React from 'react';

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error | null;
  info?: React.ErrorInfo | null;
}

export class ErrorBoundary extends React.Component<React.PropsWithChildren<{}>, ErrorBoundaryState> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('🛑 ErrorBoundary caught an error:', error, info);
    this.setState({ error, info });
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-6 border rounded-md bg-destructive/5">
          <h2 className="text-lg font-semibold mb-2">Houve um erro ao carregar esta seção.</h2>
          <p className="text-sm text-muted-foreground mb-4">Tente recarregar a página. O erro foi registrado no console para diagnóstico.</p>
          <button onClick={this.handleReload} className="px-3 py-2 rounded bg-primary text-primary-foreground">Recarregar</button>
        </div>
      );
    }

    return this.props.children as any;
  }
}

export default ErrorBoundary;
