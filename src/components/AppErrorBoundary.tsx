import { Component, type ErrorInfo, type ReactNode } from "react";
import { AppText } from "@/components/AppText";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { Screen } from "@/components/Screen";

type Props = { children: ReactNode };
type State = { error: Error | null };

export class AppErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(_error: Error, _errorInfo: ErrorInfo) {
    // Hook Sentry.captureException here when EXPO_PUBLIC_SENTRY_DSN is configured.
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <Screen>
        <Card>
          <AppText variant="title">Something went wrong</AppText>
          <AppText muted>The app hit an unexpected error. No crash reporting DSN is configured in this build.</AppText>
          <Button label="Try again" onPress={() => this.setState({ error: null })} />
        </Card>
      </Screen>
    );
  }
}
