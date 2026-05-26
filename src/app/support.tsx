import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { Alert, Pressable, StyleSheet, View } from "react-native";
import { AppText } from "@/components/AppText";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { Screen } from "@/components/Screen";
import { TextField } from "@/components/TextField";
import { supportApi } from "@/services/api/client";

const FEEDBACK_CATEGORIES = ["general", "bug", "feature", "payment"] as const;
const TICKET_TYPES = ["general", "bug", "account", "premium", "payment", "refund", "faq"] as const;

export default function SupportScreen() {
  const [category, setCategory] = useState<(typeof FEEDBACK_CATEGORIES)[number]>("general");
  const [feedback, setFeedback] = useState("");
  const [email, setEmail] = useState("");
  const [ticketType, setTicketType] = useState<(typeof TICKET_TYPES)[number]>("general");
  const [subject, setSubject] = useState("");
  const [ticketMessage, setTicketMessage] = useState("");
  const [waitlistEmail, setWaitlistEmail] = useState("");

  const feedbackMutation = useMutation({
    mutationFn: () => supportApi.feedback({ category, message: feedback.trim(), email: email.trim(), page: "mobile-support" }),
    onSuccess: (data) => {
      Alert.alert("Feedback", data.message);
      setFeedback("");
    },
    onError: (error) => Alert.alert("Feedback not sent", error.message)
  });
  const ticketMutation = useMutation({
    mutationFn: () => supportApi.ticket({ type: ticketType, subject: subject.trim(), message: ticketMessage.trim() }),
    onSuccess: (data) => {
      Alert.alert("Support", data.message);
      setSubject("");
      setTicketMessage("");
    },
    onError: (error) => Alert.alert("Ticket not created", error.message)
  });
  const waitlistMutation = useMutation({
    mutationFn: () => supportApi.waitlist({ email: waitlistEmail.trim(), source: "mobile", interest: "advanced-product" }),
    onSuccess: (data) => Alert.alert("Waitlist", data.message),
    onError: (error) => Alert.alert("Waitlist", error.message)
  });

  return (
    <Screen>
      <AppText variant="title">Support</AppText>
      <Card>
        <AppText variant="subtitle">Feedback</AppText>
        <PickerRow options={FEEDBACK_CATEGORIES} value={category} onChange={setCategory} />
        <TextField placeholder="Email (optional)" value={email} onChangeText={setEmail} keyboardType="email-address" />
        <TextField placeholder="Tell us what happened" value={feedback} onChangeText={setFeedback} multiline maxLength={2000} style={{ minHeight: 110, textAlignVertical: "top", paddingTop: 12 }} />
        <Button label="Submit feedback" loading={feedbackMutation.isPending} disabled={feedback.trim().length < 8} onPress={() => feedbackMutation.mutate()} />
      </Card>

      <Card>
        <AppText variant="subtitle">Support ticket</AppText>
        <PickerRow options={TICKET_TYPES} value={ticketType} onChange={setTicketType} />
        <TextField placeholder="Subject" value={subject} onChangeText={setSubject} maxLength={120} />
        <TextField placeholder="Message" value={ticketMessage} onChangeText={setTicketMessage} multiline maxLength={2000} style={{ minHeight: 110, textAlignVertical: "top", paddingTop: 12 }} />
        <Button label="Create ticket" loading={ticketMutation.isPending} disabled={subject.trim().length < 3 || ticketMessage.trim().length < 8} onPress={() => ticketMutation.mutate()} />
      </Card>

      <Card>
        <AppText variant="subtitle">Roadmap waitlist</AppText>
        <AppText muted>Join the waitlist for advanced analysis, coaching, notifications, and tournament upgrades.</AppText>
        <TextField placeholder="Email" value={waitlistEmail} onChangeText={setWaitlistEmail} keyboardType="email-address" />
        <Button label="Join waitlist" variant="secondary" loading={waitlistMutation.isPending} disabled={!waitlistEmail.includes("@")} onPress={() => waitlistMutation.mutate()} />
      </Card>
    </Screen>
  );
}

function PickerRow<T extends string>({ options, value, onChange }: { options: readonly T[]; value: T; onChange: (value: T) => void }) {
  return (
    <View style={styles.row}>
      {options.map((option) => (
        <Pressable key={option} onPress={() => onChange(option)} style={[styles.option, value === option ? styles.active : null]}>
          <AppText variant="caption">{option}</AppText>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  option: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8 },
  active: { borderWidth: 2 }
});
