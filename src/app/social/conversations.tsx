import { useMutation, useQuery } from "@tanstack/react-query";
import { Link, useRouter } from "expo-router";
import { Alert, Pressable, StyleSheet, View } from "react-native";
import { AppText } from "@/components/AppText";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { Screen } from "@/components/Screen";
import { EmptyState, ErrorState, LoadingState } from "@/components/StateView";
import { communityApi, messagesApi } from "@/services/api/client";

export default function ConversationsScreen() {
  const router = useRouter();
  const query = useQuery({
    queryKey: ["messages", "conversations"],
    queryFn: messagesApi.conversations,
    refetchInterval: 10000
  });
  const bootstrap = useQuery({
    queryKey: ["social", "messaging", "bootstrap"],
    queryFn: communityApi.bootstrap
  });
  const openRoom = useMutation({
    mutationFn: communityApi.openPublicRoom,
    onSuccess: (data) => router.push({ pathname: "/social/conversation/[id]", params: { id: data.conversation.id || data.conversation._id || "" } }),
    onError: (error) => Alert.alert("Room unavailable", error.message)
  });

  return (
    <Screen>
      <AppText variant="title">Messages</AppText>
      {query.isLoading ? <LoadingState label="Loading conversations" /> : null}
      {query.isError ? <ErrorState message={query.error.message} retry={() => query.refetch()} /> : null}

      <Card>
        <AppText variant="subtitle">Public rooms</AppText>
        {bootstrap.isLoading ? <LoadingState label="Loading rooms" /> : null}
        {bootstrap.data?.publicRooms.map((room) => (
          <View key={room.key} style={styles.roomRow}>
            <View style={styles.roomCopy}>
              <AppText>{room.title}</AppText>
              <AppText variant="caption" muted>{room.description}</AppText>
            </View>
            <Button label="Open" variant="secondary" loading={openRoom.isPending} onPress={() => openRoom.mutate(room.key)} />
          </View>
        ))}
        {bootstrap.isError ? <AppText muted>Public rooms are unavailable right now.</AppText> : null}
      </Card>

      {query.data?.conversations.length === 0 ? <EmptyState title="No conversations" body="Search for a player to start one." /> : null}
      {query.data?.conversations.map((conversation) => (
        <Link key={conversation.id || conversation._id} href={{ pathname: "/social/conversation/[id]", params: { id: conversation.id || conversation._id || "" } }} asChild>
          <Pressable>
            <Card>
              <View style={styles.conversationRow}>
                <View style={styles.roomCopy}>
                  <AppText variant="subtitle">{conversation.title}</AppText>
                  <AppText muted>{conversation.lastMessage?.text || conversation.lastMessage?.body || "No messages yet."}</AppText>
                </View>
                {conversation.unreadCount ? <AppText>{conversation.unreadCount}</AppText> : null}
              </View>
            </Card>
          </Pressable>
        </Link>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  roomRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  roomCopy: { flex: 1, gap: 3 },
  conversationRow: { flexDirection: "row", alignItems: "center", gap: 12 }
});
