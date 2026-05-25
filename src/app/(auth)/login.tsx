import { useMutation } from "@tanstack/react-query";
import { Link } from "expo-router";
import { useState } from "react";
import { Alert, View } from "react-native";
import { AppText } from "@/components/AppText";
import { Button } from "@/components/Button";
import { Screen } from "@/components/Screen";
import { TextField } from "@/components/TextField";
import { api } from "@/services/api/client";
import { saveAuthSession } from "@/services/storage/authStorage";
import { useAuthStore } from "@/store/authStore";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const setSession = useAuthStore((state) => state.setSession);
  const mutation = useMutation({
    mutationFn: () => api.login(email.trim(), password),
    onSuccess: async (data) => {
      await saveAuthSession({ accessToken: data.socketToken, socketToken: data.socketToken, user: data.user });
      setSession({ user: data.user, accessToken: data.socketToken, socketToken: data.socketToken });
    },
    onError: (error) => Alert.alert("Sign in failed", error.message)
  });

  return (
    <Screen>
      <AppText variant="title">Welcome back</AppText>
      <TextField placeholder="Email" value={email} onChangeText={setEmail} keyboardType="email-address" />
      <TextField placeholder="Password" value={password} onChangeText={setPassword} secureTextEntry />
      <Button label="Log in" loading={mutation.isPending} onPress={() => mutation.mutate()} disabled={!email || !password} />
      <View style={{ gap: 8 }}>
        <Link href="/(auth)/register" asChild>
          <AppText muted>Create an account</AppText>
        </Link>
        <Link href="/(auth)/forgot-password" asChild>
          <AppText muted>Forgot password?</AppText>
        </Link>
      </View>
    </Screen>
  );
}

