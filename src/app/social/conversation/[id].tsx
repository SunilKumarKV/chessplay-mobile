import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { Alert, View } from "react-native";
import { AppText } from "@/components/AppText";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { Screen } from "@/components/Screen";
import { EmptyState, ErrorState, LoadingState } from "@/components/StateView";
import { TextField } from "@/components/TextField";
import { messagesApi } from "@/services/api/client";

export default function ConversationDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const conversationId = String(id || "");
  const [text, setText] = useState("");
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: ["messages", conversationId],
    queryFn: () => messagesApi.messages(conversationId),
    enabled: Boolean(conversationId)
  });
  const mutation = useMutation({
    mutationFn: () => messagesApi.sendMessage(conversationId, text.trim()),
    onSuccess: () => {
      setText("");
      queryClient.invalidateQueries({ queryKey: ["messages"] });
    },
    onError: (error) => Alert.alert("Message not sent", error.message)
  });

  useEffect(() => {
    if (conversationId) messagesApi.markRead(conversationId).catch(() => {});
  }, [conversationId]);

  return (
    <Screen>
      <AppText variant="title">{query.data?.conversation.title || "Conversation"}</AppText>
      {query.isLoading ? <LoadingState label="Loading messages" /> : null}
      {query.isError ? <ErrorState message={query.error.message} retry={() => query.refetch()} /> : null}
      {query.data?.messages.length === 0 ? <EmptyState title="No messages yet" /> : null}
      <View style={{ gap: 10 }}>
        {query.data?.messages.map((message) => (
          <Card key={message.id || message._id}>
            <AppText variant="caption" muted>{message.senderName || "ChessPlay User"}</AppText>
            <AppText>{message.text || message.body}</AppText>
          </Card>
        ))}
      </View>
      <TextField placeholder="Write a message" value={text} onChangeText={setText} multiline maxLength={1000} />
      <Button label="Send" disabled={!text.trim()} loading={mutation.isPending} onPress={() => mutation.mutate()} />
    </Screen>
  );
}
