import React from 'react';

type ErrorBoundaryProps = {
  children: React.ReactNode;
};

type ErrorBoundaryState = {
  hasError: boolean;
  error?: Error;
  info?: React.ErrorInfo;
};

export default class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // Log to console; could be extended to remote logging
    console.error('App crashed:', error, info);
    this.setState({ info });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-black text-zinc-100 flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-zinc-900 border border-zinc-800 rounded-xl p-6 text-center space-y-3">
            <h1 className="text-xl font-bold">Something went wrong</h1>
            <p className="text-zinc-400 text-sm">The app encountered an error. Try reloading.</p>
            {this.state.error && (
              <pre className="text-xs text-red-300 bg-black/40 border border-red-900/40 rounded p-3 overflow-auto max-h-40">
                {String(this.state.error.message || this.state.error)}
              </pre>
            )}
            <button
              onClick={() => window.location.reload()}
              className="bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold px-4 py-2 rounded"
            >
              Reload
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
