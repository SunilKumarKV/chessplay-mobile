import { useQuery } from "@tanstack/react-query";
import { AppText } from "@/components/AppText";
import { Card } from "@/components/Card";
import { EmptyState, ErrorState, LoadingState } from "@/components/StateView";
import { Screen } from "@/components/Screen";
import { apiClient } from "@/services/api/client";
import type { Conversation } from "@/types/api";

export default function SocialScreen() {
  const messages = useQuery({
    queryKey: ["messages", "conversations"],
    queryFn: () => apiClient<{ conversations: Conversation[] }>("/messages/conversations")
  });
  const friends = useQuery({
    queryKey: ["friends"],
    queryFn: () => apiClient<{ friends: unknown[] }>("/auth/friends")
  });

  return (
    <Screen>
      <AppText variant="title">Social</AppText>
      <Card>
        <AppText variant="subtitle">Friends</AppText>
        {friends.isLoading ? <LoadingState label="Loading friends" /> : null}
        {friends.isError ? <ErrorState message={friends.error.message} retry={() => friends.refetch()} /> : null}
        {friends.data && (!friends.data.friends || friends.data.friends.length === 0) ? <EmptyState title="No friends yet" body="Friend APIs exist; mobile invite UX is next." /> : null}
      </Card>
      <Card>
        <AppText variant="subtitle">Messages</AppText>
        {messages.isLoading ? <LoadingState label="Loading conversations" /> : null}
        {messages.isError ? <ErrorState message={messages.error.message} retry={() => messages.refetch()} /> : null}
        {messages.data?.conversations?.length ? (
          messages.data.conversations.map((conversation) => (
            <AppText key={conversation.id} muted>
              {conversation.title} {conversation.unreadCount ? `(${conversation.unreadCount})` : ""}
            </AppText>
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

