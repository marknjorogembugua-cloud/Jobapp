import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { fetchPayment, initiatePayment } from "../api/payments";
import type { PaymentSummary } from "../api/bookings";
import { colors, spacing } from "../theme";

const POLL_INTERVAL_MS = 3000;

type Props = {
  bookingId: string;
  suggestedAmount: number;
  onBack: () => void;
  onDone: () => void;
};

export function PaymentScreen({ bookingId, suggestedAmount, onBack, onDone }: Props) {
  const [phone, setPhone] = useState("");
  const [amount, setAmount] = useState(String(suggestedAmount));
  const [submitting, setSubmitting] = useState(false);
  const [payment, setPayment] = useState<PaymentSummary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  async function handlePay() {
    setError(null);
    setSubmitting(true);
    try {
      const created = await initiatePayment(bookingId, phone, Number(amount));
      setPayment(created);
      pollRef.current = setInterval(async () => {
        const latest = await fetchPayment(bookingId).catch(() => null);
        if (latest) {
          setPayment(latest);
          if (latest.status !== "pending" && pollRef.current) {
            clearInterval(pollRef.current);
          }
        }
      }, POLL_INTERVAL_MS);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not start the M-Pesa payment");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.back} onPress={onBack}>← Back</Text>
      <Text style={styles.title}>Pay with M-Pesa</Text>

      {!payment ? (
        <>
          <Text style={styles.label}>M-Pesa phone number</Text>
          <TextInput
            style={styles.input}
            value={phone}
            onChangeText={setPhone}
            placeholder="2547XXXXXXXX"
            placeholderTextColor={colors.muted}
            keyboardType="phone-pad"
          />

          <Text style={styles.label}>Amount (KES)</Text>
          <TextInput style={styles.input} value={amount} onChangeText={setAmount} keyboardType="numeric" />

          {error && <Text style={styles.error}>{error}</Text>}

          <Pressable style={styles.button} onPress={handlePay} disabled={submitting || !phone || !amount}>
            {submitting ? <ActivityIndicator color={colors.paper} /> : <Text style={styles.buttonText}>Send STK push</Text>}
          </Pressable>
        </>
      ) : (
        <View style={styles.statusBox}>
          {payment.status === "pending" && (
            <>
              <ActivityIndicator color={colors.copper} />
              <Text style={styles.statusText}>Check your phone and enter your M-Pesa PIN…</Text>
            </>
          )}
          {payment.status === "success" && (
            <>
              <Text style={[styles.statusText, styles.success]}>Payment received ✓</Text>
              {payment.mpesaReceiptNumber && <Text style={styles.label}>Receipt: {payment.mpesaReceiptNumber}</Text>}
              <Pressable style={styles.button} onPress={onDone}>
                <Text style={styles.buttonText}>Done</Text>
              </Pressable>
            </>
          )}
          {payment.status === "failed" && (
            <>
              <Text style={[styles.statusText, styles.failed]}>Payment failed or was cancelled</Text>
              <Pressable style={styles.button} onPress={() => setPayment(null)}>
                <Text style={styles.buttonText}>Try again</Text>
              </Pressable>
            </>
          )}
        </View>
      )}
    </View>
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
  button: { backgroundColor: colors.copper, borderRadius: 10, paddingVertical: 14, alignItems: "center", marginTop: spacing.xl },
  buttonText: { color: colors.paper, fontWeight: "700" },
  error: { color: "#E4756B", marginTop: spacing.sm },
  statusBox: { alignItems: "center", marginTop: spacing.xl, gap: spacing.sm },
  statusText: { color: colors.ink, fontSize: 16, textAlign: "center" },
  success: { color: colors.success, fontWeight: "700" },
  failed: { color: colors.danger, fontWeight: "700" },
});
