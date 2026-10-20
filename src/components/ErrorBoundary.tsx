
import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import {
  AlertTriangle,
  RefreshCw,
  Home,
  ChevronDown,
  ChevronUp,
  Copy,
  Check,
  ShieldAlert,
  ArrowUpRight,
  Layers,
} from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  showDetails: boolean;
  copied: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    showDetails: false,
    copied: false,
  };

  public static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error,
    };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error in Synapse:', error, errorInfo);
  }

  private handleReset = () => {
    window.location.reload();
  };

  private handleGoHome = () => {
    window.location.href = '/';
  };

  private handleCopyError = async () => {
    const details = [
      this.state.error?.name ?? 'Error',
      this.state.error?.message ?? 'Unknown error',
      this.state.error?.stack ?? '',
    ]
      .filter(Boolean)
      .join('\n\n');

    try {
      await navigator.clipboard.writeText(details);
      this.setState({ copied: true });

      window.setTimeout(() => {
        this.setState({ copied: false });
      }, 2000);
    } catch {
      console.error('Unable to copy error details.');
    }
  };

  public render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    const { error, showDetails, copied } = this.state;

    return (
      <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#0b0b0d] px-4 py-10 text-zinc-100 selection:bg-rose-500/30">
        {/* Ambient background */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute left-1/2 top-[25%] h-[320px] w-[320px] -translate-x-1/2 rounded-full bg-rose-600/[0.07] blur-[110px]" />

          <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.018)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.018)_1px,transparent_1px)] bg-[size:48px_48px] [mask-image:radial-gradient(ellipse_at_center,black_15%,transparent_75%)]" />

          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-rose-500/40 to-transparent" />
        </div>

        <main className="relative z-10 w-full max-w-lg">
          {/* Brand */}
          <div className="mb-8 flex items-center justify-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-rose-500/25 bg-rose-500/[0.09]">
              <Layers className="h-4.5 w-4.5 text-rose-400" />
            </div>

            <span className="text-base font-semibold tracking-tight text-white">
              Synapse
            </span>

            <span className="ml-1 rounded-md border border-white/[0.08] bg-white/[0.035] px-2 py-1 text-[9px] font-semibold uppercase tracking-[0.15em] text-zinc-500">
              Recovery
            </span>
          </div>

          {/* Error card */}
          <section className="overflow-hidden rounded-3xl border border-white/[0.09] bg-[#131315]/95 shadow-[0_24px_100px_rgba(0,0,0,0.45)] backdrop-blur-xl">
            <div className="p-6 sm:p-9">
              {/* Status icon */}
              <div className="relative mx-auto mb-6 flex h-[76px] w-[76px] items-center justify-center">
                <div className="absolute inset-0 rounded-[25px] bg-rose-500/[0.10] blur-xl" />

                <div className="relative flex h-[68px] w-[68px] items-center justify-center rounded-[22px] border border-rose-500/25 bg-gradient-to-br from-rose-500/[0.14] to-rose-950/20 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
                  <AlertTriangle className="h-8 w-8 text-rose-400" strokeWidth={1.6} />

                  <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full border-2 border-[#131315] bg-rose-500">
                    <span className="h-1.5 w-1.5 rounded-full bg-white" />
                  </span>
                </div>
              </div>

              {/* Heading */}
              <div className="text-center">
                <div className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-rose-500/20 bg-rose-500/[0.06] px-3 py-1.5">
                  <ShieldAlert className="h-3 w-3 text-rose-400" />

                  <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-rose-300">
                    Unexpected exception
                  </span>
                </div>

                <h1 className="text-2xl font-semibold tracking-tight text-white sm:text-[30px]">
                  Something went wrong<span className="text-rose-500">.</span>
                </h1>

                <p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-zinc-400">
                  Synapse encountered an unexpected problem. Your current
                  session may need to be reloaded to get things working again.
                </p>
              </div>

              {/* Error message */}
              {error?.message && (
                <div className="mt-7 overflow-hidden rounded-2xl border border-white/[0.08] bg-[#0c0c0e]">
                  <div className="flex items-center justify-between gap-3 border-b border-white/[0.06] px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />

                      <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-500">
                        Error details
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        this.setState((prev) => ({
                          showDetails: !prev.showDetails,
                        }))
                      }
                      className="inline-flex items-center gap-1.5 text-[11px] text-zinc-500 transition hover:text-zinc-200"
                    >
                      {showDetails ? 'Show less' : 'Inspect'}

                      {showDetails ? (
                        <ChevronUp className="h-3.5 w-3.5" />
                      ) : (
                        <ChevronDown className="h-3.5 w-3.5" />
                      )}
                    </button>
                  </div>

                  <div className="p-4">
                    <p className="line-clamp-3 break-words font-mono text-xs leading-6 text-rose-300/90">
                      {error.message}
                    </p>

                    {showDetails && (
                      <div className="mt-4 border-t border-white/[0.07] pt-4">
                        <div className="mb-2 flex items-center justify-between gap-2">
                          <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
                            Stack trace
                          </span>

                          <button
                            type="button"
                            onClick={this.handleCopyError}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-white/[0.08] px-2 py-1.5 text-[10px] text-zinc-400 transition hover:bg-white/[0.05] hover:text-white"
                          >
                            {copied ? (
                              <Check className="h-3 w-3 text-emerald-400" />
                            ) : (
                              <Copy className="h-3 w-3" />
                            )}

                            {copied ? 'Copied' : 'Copy details'}
                          </button>
                        </div>

                        <pre className="max-h-48 overflow-auto whitespace-pre-wrap break-words rounded-xl border border-white/[0.06] bg-black/30 p-3 font-mono text-[10px] leading-5 text-zinc-500">
                          {error.stack || error.message}
                        </pre>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={this.handleReset}
                  className="group inline-flex flex-1 items-center justify-center gap-2.5 rounded-xl bg-rose-600 px-4 py-3 text-sm font-semibold text-white shadow-[0_5px_24px_rgba(225,29,72,0.17)] transition duration-200 hover:bg-rose-500 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:ring-offset-2 focus-visible:ring-offset-[#131315]"
                >
                  <RefreshCw className="h-4 w-4 transition-transform duration-500 group-hover:rotate-[-45deg]" />
                  Reload application
                </button>

                <button
                  type="button"
                  onClick={this.handleGoHome}
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-white/[0.09] bg-white/[0.035] px-4 py-3 text-sm font-medium text-zinc-300 transition hover:border-white/[0.16] hover:bg-white/[0.07] hover:text-white active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 focus-visible:ring-offset-2 focus-visible:ring-offset-[#131315]"
                >
                  <Home className="h-4 w-4" />
                  Back to home
                  <ArrowUpRight className="h-3.5 w-3.5 text-zinc-500" />
                </button>
              </div>

              <div className="mt-5 flex items-start gap-2 rounded-xl border border-white/[0.05] bg-white/[0.02] px-3.5 py-3">
                <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-zinc-500" />

                <p className="text-[11px] leading-5 text-zinc-500">
                  If this keeps happening, inspect the browser console for
                  additional details or check the application logs.
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between gap-3 border-t border-white/[0.07] bg-white/[0.015] px-6 py-4 sm:px-9">
              <p className="text-[10px] text-zinc-600">
                Synapse · Error recovery
              </p>

              <div className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-rose-500/80" />
                <span className="text-[10px] text-zinc-500">
                  Application interrupted
                </span>
              </div>
            </div>
          </section>

          <p className="mt-6 text-center text-[10px] leading-5 text-zinc-600">
            Refreshing reloads the current page. Returning home navigates to
            the application root.
          </p>
        </main>
      </div>
    );
  }
}
