import { View } from "react-native";
import { AppText } from "@/components/AppText";
import { Card } from "@/components/Card";

export function TimerBar({ white = "10:00", black = "10:00" }: { white?: string; black?: string }) {
  return (
    <View style={{ flexDirection: "row", gap: 12 }}>
      <View style={{ flex: 1 }}>
        <Card>
          <AppText muted>White</AppText>
          <AppText variant="subtitle">{white}</AppText>
        </Card>
      </View>
      <View style={{ flex: 1 }}>
        <Card>
          <AppText muted>Black</AppText>
          <AppText variant="subtitle">{black}</AppText>
        </Card>
      </View>
    </View>
  );
}

