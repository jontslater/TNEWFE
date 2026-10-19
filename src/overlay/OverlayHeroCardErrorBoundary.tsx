import React, { Component, type ReactNode } from 'react';

type Props = { children: ReactNode; heroId?: string };
type State = { error: Error | null };

/** Prevents one broken hero HUD card from crashing the entire browser source. */
export class OverlayHeroCardErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error) {
    console.error('[OverlayHeroCard]', this.props.heroId ?? 'unknown', error);
  }

  render() {
    if (this.state.error) {
      return (
        <div
          style={{
            color: '#f87171',
            fontSize: 12,
            padding: 4,
            maxWidth: 140,
            textAlign: 'center',
          }}
        >
          Hero card error
        </div>
      );
    }
    return this.props.children;
  }
}
