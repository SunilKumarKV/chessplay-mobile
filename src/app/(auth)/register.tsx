import { useMutation } from "@tanstack/react-query";
import { Link } from "expo-router";
import { useState } from "react";
import { Alert } from "react-native";
import { AppText } from "@/components/AppText";
import { Button } from "@/components/Button";
import { Screen } from "@/components/Screen";
import { TextField } from "@/components/TextField";
import { api, authApi } from "@/services/api/client";
import { saveAuthSession } from "@/services/storage/authStorage";
import { useAuthStore } from "@/store/authStore";

export default function RegisterScreen() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const setSession = useAuthStore((state) => state.setSession);
  const mutation = useMutation({
    mutationFn: () => api.register(username.trim(), email.trim(), password),
    onSuccess: async (data) => {
      const session = authApi.responseSession(data);
      await saveAuthSession(session);
      setSession(session);
    },
    onError: (error) => Alert.alert("Registration failed", error.message)
  });

  return (
    <Screen>
      <AppText variant="title">Create account</AppText>
      <TextField placeholder="Username" value={username} onChangeText={setUsername} />
      <TextField placeholder="Email" value={email} onChangeText={setEmail} keyboardType="email-address" />
      <TextField placeholder="Strong password" value={password} onChangeText={setPassword} secureTextEntry />
      <Button
        label="Register"
        loading={mutation.isPending}
        onPress={() => mutation.mutate()}
        disabled={!username || !email || password.length < 8}
      />
      <Link href="/(auth)/login" asChild>
        <AppText muted>Already have an account?</AppText>
      </Link>
    </Screen>
  );
}
