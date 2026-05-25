import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Alert, Pressable, StyleSheet, View } from "react-native";
import { AppText } from "@/components/AppText";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { EmptyState, ErrorState, LoadingState } from "@/components/StateView";
import { Screen } from "@/components/Screen";
import { communityApi, messagesApi, socialApi } from "@/services/api/client";
import { getSocket } from "@/services/socket/socketClient";
import { useAuthStore } from "@/store/authStore";
import { useThemeColors } from "@/hooks/useThemeColors";

export default function SocialScreen() {
  const router = useRouter();
  const colors = useThemeColors();
  const queryClient = useQueryClient();
  const token = useAuthStore((state) => state.socketToken || state.accessToken);
  const [presence, setPresence] = useState<Record<string, "online" | "offline">>({});
  const messages = useQuery({
    queryKey: ["messages", "conversations"],
    queryFn: messagesApi.conversations,
    refetchInterval: 15000
  });
  const friends = useQuery({
    queryKey: ["friends"],
    queryFn: socialApi.friends
  });
  const community = useQuery({
    queryKey: ["community", "posts", "social-home"],
    queryFn: () => communityApi.posts({ limit: 3 })
  });

  useEffect(() => {
    if (!token) return;
    const socket = getSocket(token);
    if (!socket) return;
    const handler = (payload: { userId?: string; status?: "online" | "offline" }) => {
      if (!payload.userId || !payload.status) return;
      setPresence((current) => ({ ...current, [String(payload.userId)]: payload.status as "online" | "offline" }));
    };
    socket.on("socialUserStatus", handler);
    return () => {
      socket.off("socialUserStatus", handler);
    };
  }, [token]);

  const respondMutation = useMutation({
    mutationFn: ({ requestId, action }: { requestId: string; action: "accept" | "decline" }) =>
      socialApi.respondToFriendRequest(requestId, action),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["friends"] }),
    onError: (error) => Alert.alert("Friend request", error.message)
  });
  const openRoomMutation = useMutation({
    mutationFn: communityApi.openPublicRoom,
    onSuccess: (data) => router.push({ pathname: "/social/conversation/[id]", params: { id: data.conversation.id || data.conversation._id || "" } }),
    onError: (error) => Alert.alert("Room unavailable", error.message)
  });

  return (
    <Screen>
      <AppText variant="title">Social</AppText>
      <View style={styles.actions}>
        <View style={styles.action}>
          <Link href="/social/search" asChild>
            <Pressable>
              <Button label="Find players" />
            </Pressable>
          </Link>
        </View>
        <View style={styles.action}>
          <Link href="/social/conversations" asChild>
            <Pressable>
              <Button label="Messages" variant="secondary" />
            </Pressable>
          </Link>
        </View>
      </View>
      <View style={styles.actions}>
        <View style={styles.action}>
          <Link href={"/social/community" as never} asChild>
            <Pressable>
              <Button label="Community" variant="secondary" />
            </Pressable>
          </Link>
        </View>
        <View style={styles.action}>
          <Button label="General room" variant="secondary" loading={openRoomMutation.isPending} onPress={() => openRoomMutation.mutate("general")} />
        </View>
      </View>

      <Card>
        <AppText variant="subtitle">Friend requests</AppText>
        {friends.isLoading ? <LoadingState label="Loading friends" /> : null}
        {friends.isError ? <ErrorState message={friends.error.message} retry={() => friends.refetch()} /> : null}
        {friends.data?.requests?.length ? (
          friends.data.requests.map((request) => (
            <View key={request.id} style={styles.request}>
              <AppText>{request.from.username} sent a request</AppText>
              <View style={styles.actions}>
                <View style={styles.action}>
                  <Button label="Accept" loading={respondMutation.isPending} onPress={() => respondMutation.mutate({ requestId: request.id, action: "accept" })} />
                </View>
                <View style={styles.action}>
                  <Button label="Decline" variant="secondary" loading={respondMutation.isPending} onPress={() => respondMutation.mutate({ requestId: request.id, action: "decline" })} />
                </View>
              </View>
            </View>
          ))
        ) : friends.data ? (
          <AppText muted>No pending requests.</AppText>
        ) : null}
      </Card>

      <Card>
        <AppText variant="subtitle">Friends</AppText>
        {friends.data?.friends?.length ? (
          friends.data.friends.map((friend) => {
            const id = String(friend.id || friend._id);
            const status = presence[id];
            return (
              <Pressable key={id} onPress={() => router.push(`/profile/${encodeURIComponent(friend.username)}` as never)}>
                <View style={styles.friendRow}>
                  <View style={[styles.presence, { backgroundColor: status === "online" ? colors.success : colors.border }]} />
                  <View style={styles.friendCopy}>
                    <AppText>{friend.username}</AppText>
                    <AppText variant="caption" muted>Rating {friend.rating || 1200}{status ? ` · ${status}` : ""}</AppText>
                  </View>
                </View>
              </Pressable>
            );
          })
        ) : friends.data ? (
          <EmptyState title="No friends yet" body="Search for players to send a friend request or start a conversation." />
        ) : null}
      </Card>

      <Card>
        <AppText variant="subtitle">Messages</AppText>
        {messages.isLoading ? <LoadingState label="Loading conversations" /> : null}
        {messages.isError ? <ErrorState message={messages.error.message} retry={() => messages.refetch()} /> : null}
        {messages.data?.conversations?.slice(0, 4).map((conversation) => (
          <Link key={conversation.id || conversation._id} href={{ pathname: "/social/conversation/[id]", params: { id: conversation.id || conversation._id || "" } }} asChild>
            <Pressable>
              <AppText muted>
                {conversation.title} {conversation.unreadCount ? `(${conversation.unreadCount})` : ""}
              </AppText>
            </Pressable>
          </Link>
        ))}
        {messages.data?.conversations?.length === 0 ? <EmptyState title="No messages" body="Open a player profile or search result to start a conversation." /> : null}
      </Card>

      <Card>
        <AppText variant="subtitle">Community</AppText>
        {community.isLoading ? <LoadingState label="Loading posts" /> : null}
        {community.data?.posts.map((post) => (
          <View key={post.id || post._id} style={styles.postPreview}>
            <AppText>{post.title}</AppText>
            <AppText variant="caption" muted>{post.authorName || "ChessPlay"} · {post.likesCount || 0} likes</AppText>
          </View>
        ))}
        {community.isError ? <AppText muted>Community posts are unavailable right now.</AppText> : null}
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  actions: { flexDirection: "row", gap: 10 },
  action: { flex: 1 },
  request: { gap: 8 },
  friendRow: { flexDirection: "row", alignItems: "center", gap: 10, minHeight: 46 },
  presence: { width: 10, height: 10, borderRadius: 5 },
  friendCopy: { flex: 1 },
  postPreview: { gap: 3 }
});
