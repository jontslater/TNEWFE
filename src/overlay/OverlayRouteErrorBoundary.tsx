import React, { Component, type ReactNode } from 'react';

type Props = { children: ReactNode };
type State = { error: Error | null; recoveryKey: number };

const RECOVER_MS = 2500;

/**
 * App-level boundary for overlay routes: shows a small reconnect strip and retries
 * instead of leaving a blank OBS source.
 */
export class OverlayRouteErrorBoundary extends Component<Props, State> {
  state: State = { error: null, recoveryKey: 0 };
  private recoverTimer: ReturnType<typeof setTimeout> | null = null;

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[OverlayRoute] recoverable error:', error, info.componentStack);
    if (!this.recoverTimer) {
      this.recoverTimer = setTimeout(() => {
        this.recoverTimer = null;
        this.setState((s) => ({
          error: null,
          recoveryKey: s.recoveryKey + 1,
        }));
      }, RECOVER_MS);
    }
  }

  componentWillUnmount() {
    if (this.recoverTimer) clearTimeout(this.recoverTimer);
  }

  render() {
    const showStrip = this.state.error !== null;
    return (
      <React.Fragment key={this.state.recoveryKey}>
        {showStrip && (
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              zIndex: 99999,
              padding: '6px 12px',
              fontSize: 13,
              fontWeight: 600,
              color: '#fef3c7',
              background: 'rgba(120, 53, 15, 0.92)',
              textAlign: 'center',
              pointerEvents: 'none',
            }}
          >
            Overlay reconnecting…
          </div>
        )}
        {this.state.error ? null : this.props.children}
      </React.Fragment>
    );
  }
}
