import { Component, type ErrorInfo, type ReactNode } from 'react';

import { ErrorState } from '@/components/states/ErrorState';

type AppErrorBoundaryProps = Readonly<{
  children: ReactNode;
}>;

type AppErrorBoundaryState = Readonly<{
  hasError: boolean;
}>;

/**
 * Catches React render and lifecycle errors in the child tree.
 * Does not catch event-handler errors, async errors, or server errors.
 */
export class AppErrorBoundary extends Component<
  AppErrorBoundaryProps,
  AppErrorBoundaryState
> {
  public override state: AppErrorBoundaryState = {
    hasError: false,
  };

  public static getDerivedStateFromError(): AppErrorBoundaryState {
    return { hasError: true };
  }

  public override componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    if (import.meta.env.DEV) {
      console.error('AppErrorBoundary caught a render error', error, errorInfo);
    }
  }

  private readonly handleRetry = (): void => {
    this.setState({ hasError: false });
  };

  public override render(): ReactNode {
    if (this.state.hasError) {
      return (
        <main className="mx-auto flex min-h-svh max-w-2xl flex-col justify-center px-6 py-12">
          <ErrorState
            title="Application error"
            message="The application hit an unexpected render error. You can try again without leaving this page."
            onRetry={this.handleRetry}
            retryLabel="Try again"
          />
        </main>
      );
    }

    return this.props.children;
  }
}
