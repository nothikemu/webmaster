import { Component, type ReactNode } from 'react';

const HOME = import.meta.env.BASE_URL;

interface Props {
  /** Changes when the route changes, so moving to another page clears the error. */
  resetKey: string;
  children: ReactNode;
  /** What to show in place of the children if they throw. Without it, the whole page is replaced by a way out. */
  fallback?: ReactNode;
}
interface State {
  failed: boolean;
  key: string;
}

/**
 * If something throws while it is drawing (or a piece of the page fails to download), show a deliberate fallback instead of a blank
 * screen or a message that never goes away. What a learner has finished is saved separately in the browser, so a broken page cannot lose it.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { failed: false, key: this.props.resetKey };

  static getDerivedStateFromError(): Partial<State> {
    return { failed: true };
  }

  static getDerivedStateFromProps(props: Props, state: State): Partial<State> | null {
    return props.resetKey !== state.key ? { failed: false, key: props.resetKey } : null;
  }

  render(): ReactNode {
    if (!this.state.failed) return this.props.children;
    if (this.props.fallback) return this.props.fallback;
    return (
      <div className="wrap page" role="alert">
        <div className="empty">
          <h1>This page hit a snag</h1>
          <p>Something on this page failed to load. What you have finished is saved in this browser and was not touched.</p>
          <div className="row">
            <button type="button" className="btn btn--primary" onClick={() => window.location.reload()}>
              Reload the page
            </button>
            <a className="btn" href={HOME}>
              Go to the home page
            </a>
          </div>
        </div>
      </div>
    );
  }
}
