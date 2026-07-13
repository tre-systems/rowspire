import { Component, type ErrorInfo, type ReactNode } from 'react';
import { captureException } from '@/lib/observability';

type Props = { children: ReactNode };
type State = { failed: boolean };

export default class AppErrorBoundary extends Component<Props, State> {
  override state: State = { failed: false };

  static getDerivedStateFromError(): State {
    return { failed: true };
  }

  override componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    captureException(error, { componentStack: errorInfo.componentStack });
  }

  override render() {
    if (!this.state.failed) return this.props.children;

    return (
      <main
        className="min-h-screen bg-slate-950 px-6 py-16 text-slate-100"
        data-testid="global-error"
      >
        <div className="mx-auto flex max-w-md flex-col gap-5">
          <p className="text-sm font-semibold uppercase tracking-widest text-cyan-300">Rowspire</p>
          <h1 className="text-3xl font-bold">The game hit a problem.</h1>
          <p className="text-base leading-7 text-slate-300">
            Reset the board view and try again. The error has been reported without personal data.
          </p>
          <button
            type="button"
            onClick={() => this.setState({ failed: false })}
            className="w-fit rounded-md bg-cyan-300 px-4 py-2 font-semibold text-slate-950 transition hover:bg-cyan-200"
            data-testid="global-error-reset"
          >
            Reset view
          </button>
        </div>
      </main>
    );
  }
}
