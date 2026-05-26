import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { Alert, Linking, Pressable, StyleSheet, View } from "react-native";
import { AppText } from "@/components/AppText";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { PremiumGate } from "@/components/PremiumGate";
import { Screen } from "@/components/Screen";
import { EmptyState, ErrorState, LoadingState } from "@/components/StateView";
import { TextField } from "@/components/TextField";
import { billingApi } from "@/services/api/client";
import type { BillingPlan, SupporterRequest } from "@/types/api";

const PLAN_ORDER = ["supporter_monthly", "supporter_yearly", "pro", "premium", "lifetime"];
const METHOD_ORDER: ("upi" | "bank" | "paypal")[] = ["upi", "bank", "paypal"];

function money(amount = 0, currency = "INR") {
  return `${currency} ${Number(amount || 0).toLocaleString()}`;
}

function requestReference(request?: SupporterRequest) {
  return request?.utr || request?.bankReference || request?.providerReference || "No reference";
}

export default function BillingScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [selectedPlan, setSelectedPlan] = useState("supporter_monthly");
  const [paymentMethod, setPaymentMethod] = useState<"upi" | "bank" | "paypal">("upi");
  const [amount, setAmount] = useState("");
  const [reference, setReference] = useState("");
  const [proofUrl, setProofUrl] = useState("");
  const [payerEmail, setPayerEmail] = useState("");
  const [note, setNote] = useState("");
  const plans = useQuery({ queryKey: ["billing", "plans"], queryFn: billingApi.plans });
  const billing = useQuery({ queryKey: ["billing", "me"], queryFn: billingApi.me });
  const monetization = useQuery({ queryKey: ["billing", "monetization"], queryFn: billingApi.monetization });
  const methods = useQuery({
    queryKey: ["billing", "payment-methods", selectedPlan],
    queryFn: () => billingApi.paymentMethods(selectedPlan)
  });

  const planEntries = useMemo(() => {
    const remote = plans.data?.plans || {};
    return PLAN_ORDER.map((id) => [id, remote[id]] as const).filter((entry): entry is readonly [string, BillingPlan] => Boolean(entry[1]));
  }, [plans.data?.plans]);

  const selected = plans.data?.plans?.[selectedPlan];
  const allMethods = useMemo(() => {
    const remote = methods.data?.methods || plans.data?.paymentMethods;
    return [...(remote?.india || []), ...(remote?.global || [])];
  }, [methods.data?.methods, plans.data?.paymentMethods]);
  const selectedMethod = allMethods.find((item) => item.id === paymentMethod);
  const current = billing.data?.billing;
  const latestRequest = billing.data?.requests?.[0];

  useEffect(() => {
    if (!selected) return;
    setAmount(String(paymentMethod === "paypal" ? selected.usdAmount : selected.amount));
  }, [paymentMethod, selected]);

  const submit = useMutation({
    mutationFn: () =>
      billingApi.submitSupporterRequest({
        plan: selectedPlan,
        paymentMethod,
        amount: Number(amount),
        upiId: paymentMethod === "upi" ? selectedMethod?.upiId : undefined,
        utr: reference.trim(),
        bankReference: paymentMethod === "bank" ? reference.trim() : undefined,
        providerReference: paymentMethod === "paypal" ? reference.trim() : undefined,
        payerEmail: payerEmail.trim(),
        paymentProofUrl: proofUrl.trim(),
        paymentDate: new Date().toISOString(),
        note: note.trim()
      }),
    onSuccess: (data) => {
      Alert.alert("Submitted", data.message);
      setReference("");
      setProofUrl("");
      setPayerEmail("");
      setNote("");
      queryClient.invalidateQueries({ queryKey: ["billing"] });
    },
    onError: (error) => Alert.alert("Request not submitted", error.message)
  });

  async function openCheckout() {
    const url = selectedMethod?.checkoutUrl;
    if (!url) return;
    const supported = await Linking.canOpenURL(url);
    if (supported) await Linking.openURL(url);
  }

  return (
    <Screen>
      <View style={styles.header}>
        <AppText variant="title">Billing</AppText>
        <Link href={"/referrals" as never} asChild>
          <Pressable>
            <Button label="Referrals" variant="secondary" />
          </Pressable>
        </Link>
      </View>
      {billing.isLoading ? <LoadingState label="Loading billing status" /> : null}
      {billing.isError ? <ErrorState message={billing.error.message} retry={() => billing.refetch()} /> : null}

      {current ? (
        <Card>
          <AppText variant="subtitle">{current.isPremium || current.isSupporter ? "Supporter active" : current.planStatus === "pending" ? "Pending verification" : "Free plan"}</AppText>
          <View style={styles.stats}>
            <Stat label="Plan" value={current.supporterPlan || current.plan || "free"} />
            <Stat label="Status" value={current.planStatus || "active"} />
            <Stat label="Ads" value={current.adsDisabled ? "No ads" : "Standard"} />
            <Stat label="Coins" value={String(current.coins || 0)} />
          </View>
          {current.planExpiresAt ? <AppText muted>Expires {new Date(current.planExpiresAt).toLocaleDateString()}</AppText> : null}
          {latestRequest ? <AppText muted>Latest request: {latestRequest.status} · {requestReference(latestRequest)}</AppText> : null}
        </Card>
      ) : null}

      <Card>
        <AppText variant="subtitle">Backend entitlements</AppText>
        {monetization.data ? (
          <View style={styles.chips}>
            {monetization.data.premiumUnlocks.map((item) => (
              <View key={item} style={styles.chip}>
                <AppText variant="caption">{item}</AppText>
              </View>
            ))}
          </View>
        ) : monetization.isLoading ? (
          <LoadingState label="Loading entitlements" />
        ) : (
          <AppText muted>Entitlements unavailable.</AppText>
        )}
      </Card>

      <PremiumGate unlocked={Boolean(current?.entitlements?.premiumThemes || current?.isPremium)} feature="Premium cosmetic themes" onUpgrade={() => router.push("/billing" as never)}>
        <Card>
          <AppText variant="subtitle">Premium cosmetic themes unlocked</AppText>
          <AppText muted>Your backend entitlements include premium themes.</AppText>
        </Card>
      </PremiumGate>

      <Card>
        <AppText variant="subtitle">Plans</AppText>
        {plans.isLoading ? <LoadingState label="Loading plans" /> : null}
        {plans.isError ? <ErrorState message={plans.error.message} retry={() => plans.refetch()} /> : null}
        {planEntries.map(([id, plan]) => (
          <Pressable key={id} onPress={() => setSelectedPlan(id)} style={[styles.plan, selectedPlan === id ? styles.selected : null]}>
            <View style={styles.planHeader}>
              <AppText>{plan.label}</AppText>
              <AppText>{money(plan.amount, "INR")} / {money(plan.usdAmount, "USD")}</AppText>
            </View>
            <AppText variant="caption" muted>{plan.days >= 36500 ? "Lifetime style supporter access" : `${plan.days} days`}</AppText>
            {(plan.benefits || []).map((benefit) => <AppText key={benefit} variant="caption" muted>- {benefit}</AppText>)}
          </Pressable>
        ))}
      </Card>

      <Card>
        <AppText variant="subtitle">Manual supporter request</AppText>
        <AppText muted>Mobile does not activate premium directly. Complete payment through a backend-supported method, then submit proof for admin verification.</AppText>
        <View style={styles.methodRow}>
          {METHOD_ORDER.map((method) => {
            const config = allMethods.find((item) => item.id === method);
            return (
              <Pressable key={method} onPress={() => setPaymentMethod(method)} style={[styles.method, paymentMethod === method ? styles.selected : null, config?.configured === false ? styles.disabled : null]}>
                <AppText variant="caption">{method.toUpperCase()}</AppText>
              </Pressable>
            );
          })}
        </View>
        {selectedMethod?.configured === false ? <AppText muted>This payment method is not active on the backend yet.</AppText> : null}
        {paymentMethod === "upi" && selectedMethod?.upiId ? <AppText muted>Pay UPI: {selectedMethod.upiId}</AppText> : null}
        {paymentMethod === "bank" && selectedMethod?.bank?.accountNumber ? (
          <AppText muted>{selectedMethod.bank.accountName} · {selectedMethod.bank.bankName} · {selectedMethod.bank.accountNumber} · {selectedMethod.bank.ifsc}</AppText>
        ) : null}
        {paymentMethod === "paypal" && selectedMethod?.checkoutUrl ? <Button label="Open PayPal checkout" variant="secondary" onPress={openCheckout} /> : null}
        <TextField placeholder="Amount" keyboardType="numeric" value={amount} onChangeText={setAmount} />
        <TextField placeholder="Transaction/reference ID" value={reference} onChangeText={setReference} autoCapitalize="characters" />
        {paymentMethod === "paypal" ? <TextField placeholder="PayPal payer email" value={payerEmail} onChangeText={setPayerEmail} keyboardType="email-address" /> : null}
        <TextField placeholder="Proof URL (optional HTTPS)" value={proofUrl} onChangeText={setProofUrl} autoCapitalize="none" />
        <TextField placeholder="Note for admin" value={note} onChangeText={setNote} multiline maxLength={500} style={{ minHeight: 80, textAlignVertical: "top", paddingTop: 12 }} />
        <Button
          label="Submit proof"
          loading={submit.isPending}
          disabled={!selected || !reference.trim() || Number(amount) <= 0 || selectedMethod?.configured === false}
          onPress={() => submit.mutate()}
        />
      </Card>

      <Card>
        <AppText variant="subtitle">Request history</AppText>
        {billing.data?.requests?.length ? (
          billing.data.requests.map((request) => (
            <View key={request.id || request._id} style={styles.historyRow}>
              <AppText>{request.plan.replaceAll("_", " ")}</AppText>
              <AppText muted>{request.status} · {money(request.amount, request.currency)} · {requestReference(request)}</AppText>
            </View>
          ))
        ) : billing.data ? (
          <EmptyState title="No billing requests" body="Submit payment proof only after completing payment through a backend-supported method." />
        ) : null}
      </Card>
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
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 },
  stats: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  stat: { width: "45%" },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 7 },
  plan: { borderWidth: 1, borderRadius: 8, padding: 12, gap: 5 },
  selected: { borderWidth: 2 },
  planHeader: { flexDirection: "row", justifyContent: "space-between", gap: 10 },
  methodRow: { flexDirection: "row", gap: 8 },
  method: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10 },
  disabled: { opacity: 0.45 },
  historyRow: { gap: 3 }
});
