import { ActivityIndicator, View } from "react-native";
import { AppText } from "@/components/AppText";
import { Button } from "@/components/Button";

export function LoadingState({ label = "Loading" }: { label?: string }) {
  return (
    <View style={{ gap: 12, alignItems: "center", justifyContent: "center", padding: 24 }}>
      <ActivityIndicator />
      <AppText muted>{label}</AppText>
    </View>
  );
}

export function EmptyState({ title, body }: { title: string; body?: string }) {
  return (
    <View style={{ gap: 6, paddingVertical: 16 }}>
      <AppText variant="subtitle">{title}</AppText>
      {body ? <AppText muted>{body}</AppText> : null}
    </View>
  );
}

export function ErrorState({ message, retry }: { message: string; retry?: () => void }) {
  return (
    <View style={{ gap: 12, paddingVertical: 16 }}>
      <AppText variant="subtitle">Something went wrong</AppText>
      <AppText muted>{message}</AppText>
      {retry ? <Button label="Retry" variant="secondary" onPress={retry} /> : null}
    </View>
  );
}

