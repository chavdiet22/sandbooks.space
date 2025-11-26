import { Component } from 'react';
import type { ErrorInfo as ReactErrorInfo, ReactNode } from 'react';
import { getErrorInfo, formatErrorForReport } from '../utils/errorClassification';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  copied: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    copied: false,
  };

  public static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error,
    };
  }

  public componentDidCatch(error: Error, errorInfo: ReactErrorInfo) {
    console.error('React Error Boundary caught an error:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null, copied: false });
    window.location.reload();
  };

  private handleClearCache = () => {
    try {
      localStorage.clear();
      sessionStorage.clear();
    } catch {
      // Ignore errors clearing storage
    }
    window.location.reload();
  };

  private handleCopyError = async () => {
    if (!this.state.error) return;

    try {
      const errorText = formatErrorForReport(this.state.error);
      await navigator.clipboard.writeText(errorText);
      this.setState({ copied: true });
      setTimeout(() => this.setState({ copied: false }), 2000);
    } catch {
      // Fallback: show alert with error text
      const errorText = formatErrorForReport(this.state.error);
      alert(`Copy this error:\n\n${errorText}`);
    }
  };

  public render() {
    if (this.state.hasError) {
      const errorInfo = this.state.error
        ? getErrorInfo(this.state.error)
        : { type: 'unknown' as const, heading: 'Something Went Wrong', message: 'An unexpected error occurred.', showClearCache: false };

      const isNetworkError = errorInfo.type === 'network';

      return (
        <div className="min-h-screen flex items-center justify-center bg-stone-50 dark:bg-stone-950 p-4">
          <div className="max-w-md w-full p-8 bg-white dark:bg-stone-900 rounded-xl shadow-lg dark:shadow-xl text-center border border-stone-200 dark:border-stone-800">
            {/* Icon */}
            <div
              className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-4 ${
                isNetworkError
                  ? 'bg-amber-100 dark:bg-amber-900/30'
                  : 'bg-red-100 dark:bg-red-900/30'
              }`}
            >
              <svg
                className={`w-8 h-8 ${isNetworkError ? 'text-amber-500' : 'text-red-500'}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                {isNetworkError ? (
                  // Wifi off icon for network errors
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824 2.167a1 1 0 111.414 1.414m-1.414-1.414L3 3m8.293 8.293l1.414 1.414"
                  />
                ) : (
                  // Warning triangle for other errors
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                )}
              </svg>
            </div>

            {/* Heading */}
            <h1 className="text-xl font-semibold text-stone-900 dark:text-stone-100 mb-2">
              {errorInfo.heading}
            </h1>

            {/* Message */}
            <p className="text-stone-600 dark:text-stone-400 mb-2">{errorInfo.message}</p>

            {/* Data Reassurance */}
            <p className="text-xs text-stone-500 dark:text-stone-500 mb-6">
              Your notes are safely stored locally.
            </p>

            {/* Primary Action */}
            <button
              onClick={this.handleReset}
              className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium mb-3"
            >
              Refresh Page
            </button>

            {/* Secondary Actions */}
            <div className="flex gap-2 justify-center">
              {errorInfo.showClearCache && (
                <button
                  onClick={this.handleClearCache}
                  className="px-4 py-2 text-sm text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-lg transition-colors"
                >
                  Clear Cache
                </button>
              )}
              <button
                onClick={this.handleCopyError}
                className="px-4 py-2 text-sm text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-lg transition-colors"
              >
                {this.state.copied ? 'Copied!' : 'Copy Error'}
              </button>
            </div>

            {/* Expandable Details */}
            {this.state.error && (
              <details className="mt-6 text-left">
                <summary className="text-sm text-stone-500 dark:text-stone-400 cursor-pointer hover:text-stone-700 dark:hover:text-stone-300">
                  Technical details
                </summary>
                <pre className="mt-2 text-xs bg-stone-100 dark:bg-stone-800 p-3 rounded-lg border border-stone-200 dark:border-stone-700 overflow-auto max-h-40 text-stone-700 dark:text-stone-300 whitespace-pre-wrap break-words">
                  {this.state.error.toString()}
                  {this.state.error.stack && `\n\n${this.state.error.stack}`}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
