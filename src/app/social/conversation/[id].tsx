import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { Alert, StyleSheet, View } from "react-native";
import { AppText } from "@/components/AppText";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { Screen } from "@/components/Screen";
import { EmptyState, ErrorState, LoadingState } from "@/components/StateView";
import { TextField } from "@/components/TextField";
import { messagesApi } from "@/services/api/client";
import { getSocket } from "@/services/socket/socketClient";
import { useAuthStore } from "@/store/authStore";
import { useThemeColors } from "@/hooks/useThemeColors";

export default function ConversationDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const conversationId = String(id || "");
  const [text, setText] = useState("");
  const [typingName, setTypingName] = useState<string | null>(null);
  const token = useAuthStore((state) => state.socketToken || state.accessToken);
  const queryClient = useQueryClient();
  const colors = useThemeColors();
  const query = useQuery({
    queryKey: ["messages", conversationId],
    queryFn: () => messagesApi.messages(conversationId),
    enabled: Boolean(conversationId),
    refetchInterval: 8000
  });
  const mutation = useMutation({
    mutationFn: () => messagesApi.sendMessage(conversationId, text.trim()),
    onSuccess: () => {
      setText("");
      queryClient.invalidateQueries({ queryKey: ["messages"] });
    },
    onError: (error) => Alert.alert("Message not sent", error.message)
  });

  const title = useMemo(() => query.data?.conversation.title || "Conversation", [query.data?.conversation.title]);

  useEffect(() => {
    if (conversationId) messagesApi.markRead(conversationId).catch(() => {});
  }, [conversationId]);

  useEffect(() => {
    if (!conversationId || !token) return;
    const socket = getSocket(token);
    if (!socket) return;
    const onSocialMessage = (payload: { conversationId?: string }) => {
      if (payload.conversationId === conversationId) {
        queryClient.invalidateQueries({ queryKey: ["messages", conversationId] });
        queryClient.invalidateQueries({ queryKey: ["messages", "conversations"] });
      }
    };
    const onTyping = (payload: { conversationId?: string; username?: string; isTyping?: boolean }) => {
      if (payload.conversationId !== conversationId) return;
      setTypingName(payload.isTyping ? payload.username || "Someone" : null);
    };
    socket.emit("joinConversation", { conversationId });
    socket.on("socialMessage", onSocialMessage);
    socket.on("socialTyping", onTyping);
    return () => {
      socket.emit("leaveConversation", { conversationId });
      socket.off("socialMessage", onSocialMessage);
      socket.off("socialTyping", onTyping);
    };
  }, [conversationId, queryClient, token]);

  function updateText(value: string) {
    setText(value);
    if (!token || !conversationId) return;
    getSocket(token)?.emit("socialTyping", { conversationId, isTyping: value.trim().length > 0 });
  }

  return (
    <Screen>
      <AppText variant="title">{title}</AppText>
      {query.isLoading ? <LoadingState label="Loading messages" /> : null}
      {query.isError ? <ErrorState message={query.error.message} retry={() => query.refetch()} /> : null}
      {query.data?.messages.length === 0 ? <EmptyState title="No messages yet" /> : null}
      <View style={styles.messages}>
        {query.data?.messages.map((message) => (
          <View key={message.id || message._id} style={[styles.bubbleWrap, message.isOwn ? styles.ownWrap : styles.otherWrap]}>
            <View style={[styles.bubble, { backgroundColor: message.isOwn ? colors.primarySoft : colors.surface, borderColor: colors.border }]}>
              <AppText variant="caption" muted>{message.senderName || "ChessPlay User"}</AppText>
              <AppText>{message.text || message.body}</AppText>
              <AppText variant="caption" muted>{message.createdAt ? new Date(message.createdAt).toLocaleString() : ""}</AppText>
            </View>
          </View>
        ))}
      </View>
      {typingName ? <AppText variant="caption" muted>{typingName} is typing...</AppText> : null}
      <Card>
        <TextField
          placeholder="Write a message"
          value={text}
          onChangeText={updateText}
          multiline
          maxLength={1000}
          style={{ minHeight: 76, textAlignVertical: "top", paddingTop: 12 }}
        />
        <AppText variant="caption" muted>{text.length}/1000</AppText>
        <Button label="Send" disabled={!text.trim() || text.length > 1000} loading={mutation.isPending} onPress={() => mutation.mutate()} />
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  messages: { gap: 10 },
  bubbleWrap: { flexDirection: "row" },
  ownWrap: { justifyContent: "flex-end" },
  otherWrap: { justifyContent: "flex-start" },
  bubble: { maxWidth: "88%", borderWidth: 1, borderRadius: 8, padding: 12, gap: 4 }
});
