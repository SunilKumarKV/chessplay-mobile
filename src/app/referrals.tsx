import { useMutation, useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Alert, StyleSheet, View } from "react-native";
import { AppText } from "@/components/AppText";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { Screen } from "@/components/Screen";
import { EmptyState, ErrorState, LoadingState } from "@/components/StateView";
import { TextField } from "@/components/TextField";
import { billingApi } from "@/services/api/client";
import { shareReferralInvite } from "@/services/native/share";

const WEB_ORIGIN = "https://getchessplay.com";

export default function ReferralsScreen() {
  const [claimCode, setClaimCode] = useState("");
  const query = useQuery({ queryKey: ["billing", "referrals"], queryFn: billingApi.referrals });
  const claim = useMutation({
    mutationFn: () => billingApi.claimReferral(claimCode.trim()),
    onSuccess: (data) => {
      Alert.alert("Referral", data.message);
      setClaimCode("");
      query.refetch();
    },
    onError: (error) => Alert.alert("Referral not connected", error.message)
  });

  async function shareReferral() {
    if (!query.data?.code) return;
    await shareReferralInvite({ code: query.data.code, linkPath: query.data.linkPath });
  }

  return (
    <Screen>
      <AppText variant="title">Referrals</AppText>
      {query.isLoading ? <LoadingState label="Loading referrals" /> : null}
      {query.isError ? <ErrorState message={query.error.message} retry={() => query.refetch()} /> : null}
      {query.data ? (
        <>
          <Card>
            <AppText variant="subtitle">Your invite</AppText>
            <AppText variant="title">{query.data.code}</AppText>
            <AppText muted>{WEB_ORIGIN}{query.data.linkPath}</AppText>
            <Button label="Share invite" onPress={shareReferral} />
          </Card>
          <Card>
            <AppText variant="subtitle">Referral stats</AppText>
            <View style={styles.stats}>
              <Stat label="Invites" value={String(query.data.stats.invitesSent)} />
              <Stat label="Joined" value={String(query.data.stats.joinedUsers)} />
              <Stat label="Verified" value={String(query.data.stats.verifiedReferrals)} />
              <Stat label="Reward" value={query.data.stats.rewardStatus} />
            </View>
          </Card>
          <Card>
            <AppText variant="subtitle">Claim an invite</AppText>
            <AppText muted>Connect an existing referral code to this account if the backend allows it.</AppText>
            <TextField placeholder="Referral code" value={claimCode} onChangeText={setClaimCode} autoCapitalize="characters" />
            <Button label="Claim referral" loading={claim.isPending} disabled={claimCode.trim().length < 6} onPress={() => claim.mutate()} />
          </Card>
          <Card>
            <AppText variant="subtitle">Rewards</AppText>
            {query.data.rewards.map((reward) => (
              <AppText key={reward.threshold} muted>
                {reward.threshold} joined - {reward.label} - {reward.status}
              </AppText>
            ))}
          </Card>
          <Card>
            <AppText variant="subtitle">Referral history</AppText>
            {query.data.referrals.length ? (
              query.data.referrals.map((item) => (
                <View key={item.id} style={styles.historyRow}>
                  <AppText>{item.username}</AppText>
                  <AppText muted>{item.status} - {item.rewardStatus}</AppText>
                  <AppText variant="caption" muted>{item.rewardNote}</AppText>
                </View>
              ))
            ) : (
              <EmptyState title="No referred players yet" body="Share your invite link to start building referral rewards." />
            )}
          </Card>
        </>
      ) : null}
    </Screen>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.stat}>
      <AppText variant="subtitle">{value}</AppText>
      <AppText variant="caption" muted>{label}</AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  stats: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  stat: { width: "45%" },
  historyRow: { gap: 3 }
});
