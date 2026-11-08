import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  /** Rendered instead of the children after a render error. Receives a reset callback. */
  fallback: (reset: () => void, error: Error) => ReactNode;
  children: ReactNode;
  /** Changing this value clears a previous error (for example when the route changes). */
  resetKey?: string;
}

interface State {
  error: Error | null;
}

/** Contains a failing 3D module so the rest of the page, including the lesson text, keeps working. */
export class ErrorBoundary extends Component<Props, State> {
  override state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  override componentDidCatch(error: Error, info: ErrorInfo): void {
    console.warn('[module] render error contained by boundary', error, info.componentStack);
  }

  override componentDidUpdate(prev: Props): void {
    if (prev.resetKey !== this.props.resetKey && this.state.error) this.setState({ error: null });
  }

  readonly reset = (): void => this.setState({ error: null });

  override render(): ReactNode {
    return this.state.error ? this.props.fallback(this.reset, this.state.error) : this.props.children;
  }
}
