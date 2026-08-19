"use client";
import { Zap } from "lucide-react";
import { Component, type ErrorInfo, type ReactNode } from "react";

// F1 (UPGRADE.md §F): Error boundary per trasa gry — awaria jednej gry nie wywala całej aplikacji.
// Łapie render-time błędy w drzewie potomnym (nie w event handlerach ani asynchronicznych).

interface Props {
  children: ReactNode;
  /** Opcjonalny kontekst do logowania (np. kod pokoju). */
  context?: string;
}

interface State {
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // F2: logowanie błędów po stronie klienta (bez nicków i bez identyfikatorów graczy).
    console.error("[ErrorBoundary]", this.props.context ?? "", error.message, info.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="arcade-bg screen relative items-center justify-center gap-5 overflow-hidden text-center">
          <div className="halftone pointer-events-none absolute inset-0" aria-hidden />
          <Zap size={56} strokeWidth={2.5} className="relative" aria-hidden />
          <h2 className="font-display relative text-2xl font-bold uppercase tracking-wide text-ink">
            Coś się zepsuło
          </h2>
          <p className="relative max-w-sm text-base font-semibold leading-relaxed text-ink-muted">
            Odśwież stronę. Jeśli problem się powtarza, wróć do lobby.
          </p>
          <button type="button" className="btn relative" onClick={() => window.location.reload()}>
            Odśwież
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
