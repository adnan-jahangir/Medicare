import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw, AlertTriangle } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[Uncaught App Error]:', error, errorInfo);
  }

  private handleReload = () => {
    // Clear potentially corrupted local state if needed
    try {
      window.location.href = '/';
    } catch {
      window.location.reload();
    }
  };

  private handleClearStorage = () => {
    localStorage.clear();
    sessionStorage.clear();
    window.location.href = '/login';
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background p-6 text-foreground">
          <div className="max-w-md w-full text-center space-y-5 p-8 rounded-3xl bg-card border border-border/80 shadow-2xl">
            <div className="h-16 w-16 bg-destructive/10 text-destructive rounded-full flex items-center justify-center mx-auto">
              <AlertTriangle className="h-8 w-8" />
            </div>
            
            <div className="space-y-2">
              <h2 className="text-2xl font-display font-bold">Something went wrong</h2>
              <p className="text-sm text-muted-foreground">
                The application encountered an unexpected error. Please try reloading or clearing cache.
              </p>
              {this.state.error && (
                <details className="mt-2 text-left">
                  <summary className="text-xs text-destructive cursor-pointer font-medium">Error details</summary>
                  <pre className="mt-1 p-2 rounded-lg bg-muted text-[10px] text-destructive overflow-auto max-h-32 whitespace-pre-wrap break-all">
                    {this.state.error.message}
                    {'\n'}
                    {this.state.error.stack?.split('\n').slice(0, 5).join('\n')}
                  </pre>
                </details>
              )}
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <Button onClick={this.handleReload} className="flex-1 rounded-xl font-bold">
                <RefreshCw className="mr-2 h-4 w-4" /> Reload App
              </Button>
              <Button variant="outline" onClick={this.handleClearStorage} className="flex-1 rounded-xl font-bold">
                Reset App Cache
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
