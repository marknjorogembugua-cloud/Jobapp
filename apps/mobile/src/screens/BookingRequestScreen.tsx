import { useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { createBooking } from "../api/bookings";
import { colors, spacing } from "../theme";

type Props = {
  workerId: string;
  categoryId: string;
  onSubmitted: () => void;
  onBack: () => void;
};

export function BookingRequestScreen({ workerId, categoryId, onSubmitted, onBack }: Props) {
  const [date, setDate] = useState("");
  const [timeWindow, setTimeWindow] = useState("");
  const [description, setDescription] = useState("");
  const [address, setAddress] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    setError(null);
    setLoading(true);
    try {
      await createBooking({
        workerId,
        categoryId,
        date: new Date(date).toISOString(),
        timeWindow,
        description,
        address,
      });
      onSubmitted();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not submit booking");
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.back} onPress={onBack}>← Back</Text>
      <Text style={styles.title}>Request a booking</Text>

      <Text style={styles.label}>Date (YYYY-MM-DD)</Text>
      <TextInput style={styles.input} placeholder="2026-08-15" value={date} onChangeText={setDate} />

      <Text style={styles.label}>Time window</Text>
      <TextInput style={styles.input} placeholder="Morning (8am–12pm)" value={timeWindow} onChangeText={setTimeWindow} />

      <Text style={styles.label}>What do you need done?</Text>
      <TextInput
        style={[styles.input, styles.multiline]}
        placeholder="e.g. Kitchen tap is leaking, needs a new washer"
        multiline
        numberOfLines={4}
        value={description}
        onChangeText={setDescription}
      />

      <Text style={styles.label}>Address</Text>
      <TextInput style={styles.input} placeholder="Estate, street, landmark" value={address} onChangeText={setAddress} />

      {error && <Text style={styles.error}>{error}</Text>}

      <Pressable style={styles.button} onPress={handleSubmit} disabled={loading}>
        {loading ? <ActivityIndicator color={colors.paper} /> : <Text style={styles.buttonText}>Send request</Text>}
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.paper, paddingTop: 56, paddingHorizontal: spacing.md },
  back: { color: colors.copper, fontWeight: "600", marginBottom: spacing.md },
  title: { fontSize: 22, fontWeight: "700", color: colors.ink, marginBottom: spacing.lg },
  label: { color: colors.muted, fontSize: 12, marginTop: spacing.md, marginBottom: 4 },
  input: {
    backgroundColor: "#fff",
    borderRadius: 8,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    fontSize: 15,
    borderWidth: 1,
    borderColor: "#00000014",
  },
  multiline: { minHeight: 90, textAlignVertical: "top" },
  button: { backgroundColor: colors.copper, borderRadius: 10, paddingVertical: 14, alignItems: "center", marginTop: spacing.xl, marginBottom: spacing.xl },
  buttonText: { color: colors.paper, fontWeight: "700" },
  error: { color: "#E4756B", marginTop: spacing.sm },
});
