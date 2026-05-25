import { useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { AppText } from "@/components/AppText";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { TextField } from "@/components/TextField";
import { emitSocket } from "@/services/socket/socketClient";
import { useAuthStore } from "@/store/authStore";
import { useGameStore } from "@/store/gameStore";

const MAX_MESSAGE_LENGTH = 200;

export function LiveRoomChat() {
  const [text, setText] = useState("");
  const messages = useGameStore((state) => state.roomChat);
  const lastServerError = useGameStore((state) => state.lastServerError);
  const currentUser = useAuthStore((state) => state.user?.username);
  const isTooLong = text.length > MAX_MESSAGE_LENGTH;
  const clean = text.trim();
  const canSend = Boolean(clean) && !isTooLong;

  function send() {
    if (!canSend) return;
    emitSocket("sendMessage", { text: clean });
    setText("");
  }

  return (
    <Card>
      <AppText variant="subtitle">Room chat</AppText>
      {lastServerError && /message|chat|rate|word/i.test(lastServerError) ? <AppText muted>{lastServerError}</AppText> : null}
      <ScrollView style={styles.messages} nestedScrollEnabled>
        {messages.length ? (
          messages.map((message, index) => {
            const mine = currentUser && message.username === currentUser;
            return (
              <View key={`${message.timestamp}-${index}`} style={[styles.messageBubble, mine ? styles.ownBubble : styles.otherBubble]}>
                <AppText muted>{message.username || "Player"}</AppText>
                <AppText>{message.text}</AppText>
              </View>
            );
          })
        ) : (
          <AppText muted>No messages yet.</AppText>
        )}
      </ScrollView>
      <TextField placeholder="Message" value={text} onChangeText={setText} maxLength={MAX_MESSAGE_LENGTH + 20} />
      <AppText muted style={isTooLong ? styles.tooLong : undefined}>
        {text.length}/{MAX_MESSAGE_LENGTH}{isTooLong ? " · Message is too long." : ""}
      </AppText>
      <Button label="Send" variant="secondary" disabled={!canSend} onPress={send} />
    </Card>
  );
}

const styles = StyleSheet.create({
  messages: { maxHeight: 240 },
  messageBubble: { borderRadius: 8, padding: 10, marginBottom: 8, gap: 2 },
  ownBubble: { backgroundColor: "rgba(37, 99, 235, 0.16)" },
  otherBubble: { backgroundColor: "rgba(148, 163, 184, 0.14)" },
  tooLong: { color: "#DC2626" }
});
