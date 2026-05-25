import { useQuery } from "@tanstack/react-query";
import { Link } from "expo-router";
import { Pressable, View } from "react-native";
import { AppText } from "@/components/AppText";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { EmptyState, ErrorState, LoadingState } from "@/components/StateView";
import { Screen } from "@/components/Screen";
import { messagesApi, socialApi } from "@/services/api/client";

export default function SocialScreen() {
  const messages = useQuery({
    queryKey: ["messages", "conversations"],
    queryFn: messagesApi.conversations
  });
  const friends = useQuery({
    queryKey: ["friends"],
    queryFn: socialApi.friends
  });

  return (
    <Screen>
      <AppText variant="title">Social</AppText>
      <View style={{ flexDirection: "row", gap: 10 }}>
        <View style={{ flex: 1 }}>
          <Link href="/social/search" asChild>
            <Pressable>
              <Button label="Find players" />
            </Pressable>
          </Link>
        </View>
        <View style={{ flex: 1 }}>
          <Link href="/social/conversations" asChild>
            <Pressable>
              <Button label="Messages" variant="secondary" />
            </Pressable>
          </Link>
        </View>
      </View>
      <Card>
        <AppText variant="subtitle">Friends</AppText>
        {friends.isLoading ? <LoadingState label="Loading friends" /> : null}
        {friends.isError ? <ErrorState message={friends.error.message} retry={() => friends.refetch()} /> : null}
        {friends.data?.requests?.length ? (
          friends.data.requests.map((request) => (
            <View key={request.id} style={{ gap: 8 }}>
              <AppText>{request.from.username} sent a request</AppText>
              <View style={{ flexDirection: "row", gap: 8 }}>
                <Button label="Accept" onPress={() => socialApi.respondToFriendRequest(request.id, "accept").then(() => friends.refetch())} />
                <Button label="Decline" variant="secondary" onPress={() => socialApi.respondToFriendRequest(request.id, "decline").then(() => friends.refetch())} />
              </View>
            </View>
          ))
        ) : null}
        {friends.data?.friends?.length ? (
          friends.data.friends.map((friend) => <AppText key={friend.id || friend._id} muted>{friend.username} · {friend.rating || 1200}</AppText>)
        ) : friends.data ? (
          <EmptyState title="No friends yet" body="Search for players to send a friend request or start a conversation." />
        ) : null}
      </Card>
      <Card>
        <AppText variant="subtitle">Messages</AppText>
        {messages.isLoading ? <LoadingState label="Loading conversations" /> : null}
        {messages.isError ? <ErrorState message={messages.error.message} retry={() => messages.refetch()} /> : null}
        {messages.data?.conversations?.length ? (
          messages.data.conversations.map((conversation) => (
            <Link key={conversation.id} href={{ pathname: "/social/conversation/[id]", params: { id: conversation.id } }} asChild>
              <Pressable>
                <AppText muted>
                  {conversation.title} {conversation.unreadCount ? `(${conversation.unreadCount})` : ""}
                </AppText>
              </Pressable>
            </Link>
          ))
        ) : messages.data ? (
          <EmptyState title="No messages" body="Start conversations from the full user search flow in a later build." />
        ) : null}
      </Card>
      <Card>
        <AppText variant="subtitle">Notifications</AppText>
        <EmptyState title="No mobile notifications API yet" body="Push tokens and notification feed endpoints are documented as backend gaps." />
      </Card>
    </Screen>
  );
}
