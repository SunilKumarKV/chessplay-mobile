import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Alert } from "react-native";
import { AppText } from "@/components/AppText";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { Screen } from "@/components/Screen";
import { ErrorState, LoadingState } from "@/components/StateView";
import { TextField } from "@/components/TextField";
import { profileApi } from "@/services/api/client";
import { saveAuthSession } from "@/services/storage/authStorage";
import { useAuthStore } from "@/store/authStore";

export default function ProfileEditScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const auth = useAuthStore();
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [country, setCountry] = useState("");
  const profile = useQuery({ queryKey: ["profile", "me"], queryFn: profileApi.me });

  useEffect(() => {
    if (!profile.data?.profile) return;
    setUsername(profile.data.profile.username || "");
    setBio(profile.data.profile.bio || "");
    setCountry(profile.data.profile.country || "");
  }, [profile.data]);

  const mutation = useMutation({
    mutationFn: () => profileApi.update({ username: username.trim(), bio: bio.trim(), country: country.trim() }),
    onSuccess: async (data) => {
      queryClient.setQueryData(["profile", "me"], data);
      const nextUser = { ...(auth.user || data.profile), ...data.profile };
      auth.setSession({ user: nextUser, accessToken: auth.accessToken, socketToken: auth.socketToken });
      await saveAuthSession({ user: nextUser, accessToken: auth.accessToken, socketToken: auth.socketToken });
      router.back();
    },
    onError: (error) => Alert.alert("Unable to update profile", error.message)
  });

  return (
    <Screen>
      <AppText variant="title">Edit profile</AppText>
      {profile.isLoading ? <LoadingState label="Loading profile" /> : null}
      {profile.isError ? <ErrorState message={profile.error.message} retry={() => profile.refetch()} /> : null}
      {profile.data ? (
        <Card>
          <TextField placeholder="Username" value={username} onChangeText={setUsername} autoCapitalize="none" />
          <TextField placeholder="Country" value={country} onChangeText={setCountry} />
          <TextField
            placeholder="Bio"
            value={bio}
            onChangeText={setBio}
            multiline
            maxLength={500}
            style={{ minHeight: 100, textAlignVertical: "top", paddingTop: 12 }}
          />
          <Button label="Save profile" loading={mutation.isPending} disabled={username.trim().length < 3} onPress={() => mutation.mutate()} />
          <Button label="Cancel" variant="secondary" onPress={() => router.back()} />
        </Card>
      ) : null}
    </Screen>
  );
}
