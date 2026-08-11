import { useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { submitReview } from "../api/reviews";
import { colors, spacing } from "../theme";

type Props = {
  bookingId: string;
  onBack: () => void;
  onSubmitted: () => void;
};

export function ReviewScreen({ bookingId, onBack, onSubmitted }: Props) {
  const [rating, setRating] = useState(5);
  const [text, setText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    setError(null);
    setSubmitting(true);
    try {
      await submitReview(bookingId, rating, text);
      onSubmitted();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not submit your review");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.back} onPress={onBack}>← Back</Text>
      <Text style={styles.title}>How was it?</Text>

      <View style={styles.stars}>
        {[1, 2, 3, 4, 5].map((n) => (
          <Pressable key={n} onPress={() => setRating(n)}>
            <Text style={[styles.star, n <= rating && styles.starActive]}>★</Text>
          </Pressable>
        ))}
      </View>

      <TextInput
        style={styles.input}
        placeholder="Tell others about your experience (optional)"
        placeholderTextColor={colors.muted}
        value={text}
        onChangeText={setText}
        multiline
        numberOfLines={5}
      />

      {error && <Text style={styles.error}>{error}</Text>}

      <Pressable style={styles.button} onPress={handleSubmit} disabled={submitting}>
        {submitting ? <ActivityIndicator color={colors.paper} /> : <Text style={styles.buttonText}>Submit review</Text>}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.paper, paddingTop: 56, paddingHorizontal: spacing.md },
  back: { color: colors.copper, fontWeight: "600", marginBottom: spacing.md },
  title: { fontSize: 22, fontWeight: "700", color: colors.ink, marginBottom: spacing.lg },
  stars: { flexDirection: "row", gap: spacing.sm, marginBottom: spacing.lg },
  star: { fontSize: 36, color: "#00000020" },
  starActive: { color: colors.brass },
  input: {
    backgroundColor: "#fff",
    borderRadius: 8,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    fontSize: 15,
    borderWidth: 1,
    borderColor: "#00000014",
    minHeight: 110,
    textAlignVertical: "top",
  },
  button: { backgroundColor: colors.copper, borderRadius: 10, paddingVertical: 14, alignItems: "center", marginTop: spacing.xl },
  buttonText: { color: colors.paper, fontWeight: "700" },
  error: { color: "#E4756B", marginTop: spacing.sm },
});
