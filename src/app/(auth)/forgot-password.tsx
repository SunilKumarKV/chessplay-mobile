import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { Alert } from "react-native";
import { AppText } from "@/components/AppText";
import { Button } from "@/components/Button";
import { Screen } from "@/components/Screen";
import { TextField } from "@/components/TextField";
import { api } from "@/services/api/client";

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState("");
  const mutation = useMutation({
    mutationFn: () => api.forgotPassword(email.trim()),
    onSuccess: (data) => Alert.alert("Check your email", data.message),
    onError: (error) => Alert.alert("Unable to send reset", error.message)
  });

  return (
    <Screen>
      <AppText variant="title">Reset password</AppText>
      <AppText muted>The backend supports password reset email requests. Mobile deep-link reset completion is listed in the roadmap.</AppText>
      <TextField placeholder="Email" value={email} onChangeText={setEmail} keyboardType="email-address" />
      <Button label="Send reset email" loading={mutation.isPending} disabled={!email} onPress={() => mutation.mutate()} />
    </Screen>
  );
}

