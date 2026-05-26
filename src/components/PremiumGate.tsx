import { ReactNode } from "react";
import { StyleSheet, View } from "react-native";
import { AppText } from "@/components/AppText";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";

type Props = {
  unlocked?: boolean;
  feature: string;
  children: ReactNode;
  onUpgrade?: () => void;
};

export function PremiumGate({ unlocked, feature, children, onUpgrade }: Props) {
  if (unlocked) return <>{children}</>;
  return (
    <Card>
      <View style={styles.content}>
        <AppText variant="subtitle">{feature}</AppText>
        <AppText muted>This is a backend entitlement-gated ChessPlay supporter feature. Core chess remains free.</AppText>
        {onUpgrade ? <Button label="View billing" variant="secondary" onPress={onUpgrade} /> : null}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  content: { gap: 8 }
});
