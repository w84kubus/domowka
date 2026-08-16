"use client";
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
        <div className="screen items-center justify-center gap-6 text-center">
          <span className="text-5xl">💥</span>
          <h2 className="text-xl font-semibold" style={{ fontFamily: "var(--font-display)" }}>
            Coś się zepsuło
          </h2>
          <p className="max-w-sm text-sm text-[var(--color-tekst-drugi)]">
            Odśwież stronę. Jeśli problem się powtarza, wróć do lobby.
          </p>
          <button
            type="button"
            className="btn btn-accent"
            onClick={() => window.location.reload()}
          >
            Odśwież
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
