import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Alert, Pressable, StyleSheet, View } from "react-native";
import { AppText } from "@/components/AppText";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { Screen } from "@/components/Screen";
import { EmptyState, ErrorState, LoadingState } from "@/components/StateView";
import { TextField } from "@/components/TextField";
import { messagesApi, socialApi } from "@/services/api/client";

export default function SocialSearchScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [query, setQuery] = useState("");
  const users = useQuery({
    queryKey: ["social", "search", query],
    queryFn: () => socialApi.searchUsers(query),
    enabled: query.trim().length >= 2
  });
  const friendMutation = useMutation({
    mutationFn: socialApi.sendFriendRequest,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["friends"] });
      Alert.alert("Friend request", data.message);
    },
    onError: (error) => Alert.alert("Unable to send request", error.message)
  });
  const messageMutation = useMutation({
    mutationFn: messagesApi.openConversation,
    onSuccess: (data) => router.push({ pathname: "/social/conversation/[id]", params: { id: data.conversation.id } }),
    onError: (error) => Alert.alert("Unable to open conversation", error.message)
  });

  return (
    <Screen>
      <AppText variant="title">Find players</AppText>
      <TextField placeholder="Search username or email" value={query} onChangeText={setQuery} autoCapitalize="none" />
      {users.isLoading ? <LoadingState label="Searching" /> : null}
      {users.isError ? <ErrorState message={users.error.message} retry={() => users.refetch()} /> : null}
      {query.trim().length < 2 ? <EmptyState title="Search ChessPlay" body="Type at least two characters." /> : null}
      {users.data?.users.length === 0 ? <EmptyState title="No players found" /> : null}
      {users.data?.users.map((user) => (
        <Card key={user.id || user._id}>
          <AppText variant="subtitle">{user.username}</AppText>
          <AppText muted>Rating {user.rating || 1200} · {user.relationship || "none"}</AppText>
          <View style={{ flexDirection: "row", gap: 10 }}>
            <View style={{ flex: 1 }}>
              <Button
                label={user.relationship === "friend" ? "Friends" : user.relationship === "pending" ? "Pending" : "Add friend"}
                disabled={user.relationship === "friend" || user.relationship === "pending" || friendMutation.isPending}
                onPress={() => friendMutation.mutate(String(user.id || user._id))}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Button label="Message" variant="secondary" loading={messageMutation.isPending} onPress={() => messageMutation.mutate(String(user.id || user._id))} />
            </View>
          </View>
          <Pressable onPress={() => router.push(`/profile/${encodeURIComponent(user.username)}` as never)} style={styles.profileLink}>
            <AppText variant="caption" muted>Open public profile</AppText>
          </Pressable>
        </Card>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  profileLink: { minHeight: 36, justifyContent: "center" }
});
