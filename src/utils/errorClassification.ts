/**
 * Error Classification Utility
 *
 * Classifies errors for user-friendly error messages and recovery suggestions.
 */

export type ErrorType = 'network' | 'state' | 'render' | 'unknown';

export interface ErrorInfo {
  type: ErrorType;
  heading: string;
  message: string;
  showClearCache: boolean;
}

/**
 * Classify an error into a category for user-friendly messaging
 */
export function classifyError(error: Error): ErrorType {
  const message = error.message.toLowerCase();
  const stack = error.stack?.toLowerCase() || '';
  const name = error.name.toLowerCase();

  // Network errors
  if (
    message.includes('network') ||
    message.includes('fetch') ||
    message.includes('failed to load') ||
    message.includes('connection') ||
    message.includes('timeout') ||
    name.includes('networkerror')
  ) {
    return 'network';
  }

  // State/serialization errors
  if (
    message.includes('json') ||
    message.includes('parse') ||
    message.includes('storage') ||
    message.includes('valueof') ||
    message.includes('undefined is not') ||
    message.includes('null is not') ||
    message.includes('cannot read propert')
  ) {
    return 'state';
  }

  // React render errors
  if (
    message.includes('hydration') ||
    message.includes('render') ||
    message.includes('component') ||
    stack.includes('react') ||
    stack.includes('tiptap') ||
    stack.includes('prosemirror')
  ) {
    return 'render';
  }

  return 'unknown';
}

/**
 * Get user-friendly error information based on error type
 */
export function getErrorInfo(error: Error): ErrorInfo {
  const type = classifyError(error);

  switch (type) {
    case 'network':
      return {
        type,
        heading: 'Connection Lost',
        message: 'Check your internet connection and try refreshing.',
        showClearCache: false,
      };
    case 'state':
      return {
        type,
        heading: 'Data Error',
        message: 'Some local data may be corrupted. Clearing the cache might help.',
        showClearCache: true,
      };
    case 'render':
      return {
        type,
        heading: 'Display Error',
        message: "The page couldn't render properly. Refreshing usually fixes this.",
        showClearCache: false,
      };
    default:
      return {
        type,
        heading: 'Something Went Wrong',
        message: 'An unexpected error occurred. Refreshing the page usually helps.',
        showClearCache: false,
      };
  }
}

/**
 * Format error for clipboard/bug report
 */
export function formatErrorForReport(error: Error): string {
  return [
    `Error: ${error.name}`,
    `Message: ${error.message}`,
    '',
    'Stack Trace:',
    error.stack || 'No stack trace available',
    '',
    `Timestamp: ${new Date().toISOString()}`,
    `URL: ${window.location.href}`,
    `User Agent: ${navigator.userAgent}`,
  ].join('\n');
}
