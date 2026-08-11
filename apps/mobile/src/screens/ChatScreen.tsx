import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { fetchMessages, sendImageMessage, sendTextMessage, type ChatMessage } from "../api/chat";
import { colors, spacing } from "../theme";

const POLL_INTERVAL_MS = 4000;

type Props = {
  bookingId: string;
  currentUserId: string;
  onBack: () => void;
};

export function ChatScreen({ bookingId, currentUserId, onBack }: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const listRef = useRef<FlatList<ChatMessage>>(null);

  const poll = useCallback(() => {
    fetchMessages(bookingId)
      .then(setMessages)
      .catch(() => undefined);
  }, [bookingId]);

  useEffect(() => {
    poll();
    setLoading(false);
    const interval = setInterval(poll, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [poll]);

  async function handleSendText() {
    const body = draft.trim();
    if (!body) return;
    setDraft("");
    setSending(true);
    try {
      const message = await sendTextMessage(bookingId, body);
      setMessages((prev) => [...prev, message]);
    } catch {
      setDraft(body);
    } finally {
      setSending(false);
    }
  }

  async function handleSendImage() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) return;
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], quality: 0.6 });
    if (result.canceled) return;

    setSending(true);
    try {
      const message = await sendImageMessage(bookingId, result.assets[0].uri);
      setMessages((prev) => [...prev, message]);
    } finally {
      setSending(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={56}
    >
      <Text style={styles.back} onPress={onBack}>← Back</Text>

      {loading ? (
        <ActivityIndicator color={colors.copper} style={{ marginTop: spacing.xl }} />
      ) : (
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(m) => m.id}
          contentContainerStyle={{ gap: spacing.sm, paddingBottom: spacing.md }}
          onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
          ListEmptyComponent={<Text style={styles.empty}>No messages yet — say hello.</Text>}
          renderItem={({ item }) => {
            const mine = item.senderId === currentUserId;
            return (
              <View style={[styles.bubbleRow, mine && styles.bubbleRowMine]}>
                <View style={[styles.bubble, mine ? styles.bubbleMine : styles.bubbleTheirs]}>
                  {item.type === "image" ? (
                    <Image source={{ uri: item.body }} style={styles.bubbleImage} />
                  ) : (
                    <Text style={[styles.bubbleText, mine && styles.bubbleTextMine]}>{item.body}</Text>
                  )}
                </View>
              </View>
            );
          }}
        />
      )}

      <View style={styles.inputRow}>
        <Pressable style={styles.attachButton} onPress={handleSendImage} disabled={sending}>
          <Text style={styles.attachButtonText}>📷</Text>
        </Pressable>
        <TextInput
          style={styles.input}
          value={draft}
          onChangeText={setDraft}
          placeholder="Message…"
          placeholderTextColor={colors.muted}
          multiline
        />
        <Pressable style={styles.sendButton} onPress={handleSendText} disabled={sending || !draft.trim()}>
          <Text style={styles.sendButtonText}>Send</Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.paper, paddingTop: 56, paddingHorizontal: spacing.md },
  back: { color: colors.copper, fontWeight: "600", marginBottom: spacing.md },
  empty: { textAlign: "center", color: colors.muted, marginTop: spacing.xl },
  bubbleRow: { flexDirection: "row" },
  bubbleRowMine: { justifyContent: "flex-end" },
  bubble: { maxWidth: "78%", borderRadius: 14, padding: spacing.sm },
  bubbleTheirs: { backgroundColor: "#fff" },
  bubbleMine: { backgroundColor: colors.copper },
  bubbleText: { color: colors.ink, fontSize: 14 },
  bubbleTextMine: { color: colors.paper },
  bubbleImage: { width: 180, height: 180, borderRadius: 10 },
  inputRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: spacing.sm,
    paddingVertical: spacing.sm,
  },
  attachButton: { paddingVertical: 10, paddingHorizontal: 10 },
  attachButtonText: { fontSize: 20 },
  input: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 20,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    fontSize: 14,
    maxHeight: 100,
  },
  sendButton: { backgroundColor: colors.copper, borderRadius: 20, paddingHorizontal: spacing.md, paddingVertical: 12 },
  sendButtonText: { color: colors.paper, fontWeight: "700" },
});
