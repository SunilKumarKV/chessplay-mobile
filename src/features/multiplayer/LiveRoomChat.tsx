import { useState } from "react";
import { View } from "react-native";
import { AppText } from "@/components/AppText";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { TextField } from "@/components/TextField";
import { emitSocket } from "@/services/socket/socketClient";
import { useGameStore } from "@/store/gameStore";

export function LiveRoomChat() {
  const [text, setText] = useState("");
  const messages = useGameStore((state) => state.roomChat);

  function send() {
    const clean = text.trim();
    if (!clean) return;
    emitSocket("sendMessage", { text: clean });
    setText("");
  }

  return (
    <Card>
      <AppText variant="subtitle">Room chat</AppText>
      <View style={{ gap: 8, maxHeight: 180 }}>
        {messages.length ? (
          messages.slice(-6).map((message, index) => (
            <AppText key={`${message.timestamp}-${index}`} muted>
              {message.username}: {message.text}
            </AppText>
          ))
        ) : (
          <AppText muted>No messages yet.</AppText>
        )}
      </View>
      <TextField placeholder="Message" value={text} onChangeText={setText} maxLength={200} />
      <Button label="Send" variant="secondary" disabled={!text.trim()} onPress={send} />
    </Card>
  );
}

