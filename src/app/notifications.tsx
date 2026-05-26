import { Link } from "expo-router";
import { Pressable, StyleSheet, View } from "react-native";
import { AppText } from "@/components/AppText";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { Screen } from "@/components/Screen";
import { EmptyState } from "@/components/StateView";

export default function NotificationsScreen() {
  return (
    <Screen>
      <AppText variant="title">Notifications</AppText>
      <Card>
        <EmptyState
          title="No notification inbox yet"
          body="The backend currently supports notification preferences and admin automation events, but not a user-facing notifications list or mark-read endpoint."
        />
        <View style={styles.actions}>
          <View style={styles.action}>
            <Link href={"/(tabs)/settings" as never} asChild>
              <Pressable>
                <Button label="Notification settings" variant="secondary" />
              </Pressable>
            </Link>
          </View>
          <View style={styles.action}>
            <Link href={"/support" as never} asChild>
              <Pressable>
                <Button label="Support" variant="secondary" />
              </Pressable>
            </Link>
          </View>
        </View>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  actions: { flexDirection: "row", gap: 10 },
  action: { flex: 1 }
});
