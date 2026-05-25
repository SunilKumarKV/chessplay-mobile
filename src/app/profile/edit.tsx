import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Alert, Image, StyleSheet, View } from "react-native";
import { AppText } from "@/components/AppText";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { Screen } from "@/components/Screen";
import { ErrorState, LoadingState } from "@/components/StateView";
import { TextField } from "@/components/TextField";
import { profileApi } from "@/services/api/client";
import { saveAuthSession } from "@/services/storage/authStorage";
import { useAuthStore } from "@/store/authStore";
import { useThemeColors } from "@/hooks/useThemeColors";

export default function ProfileEditScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const colors = useThemeColors();
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
      auth.setSession({ user: nextUser, accessToken: auth.accessToken, refreshToken: auth.refreshToken, socketToken: auth.socketToken });
      await saveAuthSession({ user: nextUser, accessToken: auth.accessToken, refreshToken: auth.refreshToken, socketToken: auth.socketToken });
      router.back();
    },
    onError: (error) => Alert.alert("Unable to update profile", error.message)
  });

  const avatarMutation = useMutation({
    mutationFn: profileApi.uploadAvatar,
    onSuccess: async (data) => {
      await profile.refetch();
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      if (auth.user) {
        const nextUser = { ...auth.user, avatar: data.avatar };
        auth.setSession({ user: nextUser, accessToken: auth.accessToken, refreshToken: auth.refreshToken, socketToken: auth.socketToken });
        await saveAuthSession({ user: nextUser, accessToken: auth.accessToken, refreshToken: auth.refreshToken, socketToken: auth.socketToken });
      }
    },
    onError: (error) => Alert.alert("Avatar not updated", error.message)
  });

  const deleteAvatarMutation = useMutation({
    mutationFn: profileApi.deleteAvatar,
    onSuccess: async () => {
      await profile.refetch();
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      if (auth.user) {
        const nextUser = { ...auth.user, avatar: null };
        auth.setSession({ user: nextUser, accessToken: auth.accessToken, refreshToken: auth.refreshToken, socketToken: auth.socketToken });
        await saveAuthSession({ user: nextUser, accessToken: auth.accessToken, refreshToken: auth.refreshToken, socketToken: auth.socketToken });
      }
    },
    onError: (error) => Alert.alert("Avatar not removed", error.message)
  });

  async function pickAvatar() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Photos permission needed", "Allow photo access to choose a ChessPlay avatar.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.72,
      base64: true
    });
    if (result.canceled) return;
    const asset = result.assets[0];
    if (!asset?.base64) {
      Alert.alert("Avatar not selected", "The selected image could not be read.");
      return;
    }
    const mime = asset.mimeType || "image/jpeg";
    avatarMutation.mutate(`data:${mime};base64,${asset.base64}`);
  }

  const avatar = profile.data?.profile.avatar;

  return (
    <Screen>
      <AppText variant="title">Edit profile</AppText>
      {profile.isLoading ? <LoadingState label="Loading profile" /> : null}
      {profile.isError ? <ErrorState message={profile.error.message} retry={() => profile.refetch()} /> : null}
      {profile.data ? (
        <>
          <Card>
            <View style={styles.avatarRow}>
              <View style={[styles.avatar, { backgroundColor: colors.surfaceMuted }]}>
                {avatar ? <Image source={{ uri: avatar }} style={styles.avatarImage} /> : <AppText variant="title">{username.slice(0, 1).toUpperCase()}</AppText>}
              </View>
              <View style={styles.avatarActions}>
                <Button label="Choose avatar" loading={avatarMutation.isPending} onPress={pickAvatar} />
                <Button
                  label="Remove avatar"
                  variant="secondary"
                  disabled={!avatar || deleteAvatarMutation.isPending}
                  onPress={() => deleteAvatarMutation.mutate()}
                />
              </View>
            </View>
            <AppText variant="caption" muted>Uses the device photo library permission. Images are sent to the existing ChessPlay avatar endpoint.</AppText>
          </Card>

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
        </>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  avatarRow: { flexDirection: "row", alignItems: "center", gap: 14 },
  avatar: { width: 76, height: 76, borderRadius: 38, alignItems: "center", justifyContent: "center", overflow: "hidden" },
  avatarImage: { width: 76, height: 76 },
  avatarActions: { flex: 1, gap: 8 }
});
