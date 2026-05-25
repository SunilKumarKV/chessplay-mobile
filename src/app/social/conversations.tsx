import { useQuery } from "@tanstack/react-query";
import { Link } from "expo-router";
import { Pressable } from "react-native";
import { AppText } from "@/components/AppText";
import { Card } from "@/components/Card";
import { Screen } from "@/components/Screen";
import { EmptyState, ErrorState, LoadingState } from "@/components/StateView";
import { messagesApi } from "@/services/api/client";

export default function ConversationsScreen() {
  const query = useQuery({ queryKey: ["messages", "conversations"], queryFn: messagesApi.conversations });

  return (
    <Screen>
      <AppText variant="title">Messages</AppText>
      {query.isLoading ? <LoadingState label="Loading conversations" /> : null}
      {query.isError ? <ErrorState message={query.error.message} retry={() => query.refetch()} /> : null}
      {query.data?.conversations.length === 0 ? <EmptyState title="No conversations" body="Search for a player to start one." /> : null}
      {query.data?.conversations.map((conversation) => (
        <Link key={conversation.id} href={{ pathname: "/social/conversation/[id]", params: { id: conversation.id } }} asChild>
          <Pressable>
            <Card>
              <AppText variant="subtitle">{conversation.title}</AppText>
              <AppText muted>{conversation.lastMessage?.text || conversation.lastMessage?.body || "No messages yet."}</AppText>
            </Card>
          </Pressable>
        </Link>
      ))}
    </Screen>
  );
}

