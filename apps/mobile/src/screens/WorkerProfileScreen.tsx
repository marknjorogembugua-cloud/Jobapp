import { useEffect, useState } from "react";
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { apiClient } from "../api/client";
import { fetchWorkerReviews, type ReviewDto } from "../api/reviews";
import type { CategoryDto, WorkerProfileDto } from "@amon/shared";
import { colors, spacing } from "../theme";

type WorkerDetail = WorkerProfileDto & {
  category: CategoryDto;
  user: { name: string; phone: string | null };
};

type Props = {
  workerId: string;
  onBook: () => void;
  onBack: () => void;
};

export function WorkerProfileScreen({ workerId, onBook, onBack }: Props) {
  const [worker, setWorker] = useState<WorkerDetail | null>(null);
  const [reviews, setReviews] = useState<ReviewDto[]>([]);

  useEffect(() => {
    apiClient.get<WorkerDetail>(`/workers/${workerId}`).then(setWorker).catch(() => setWorker(null));
    fetchWorkerReviews(workerId).then(setReviews).catch(() => setReviews([]));
  }, [workerId]);

  if (!worker) {
    return (
      <View style={styles.container}>
        <Text style={styles.back} onPress={onBack}>← Back</Text>
        <Text style={styles.meta}>Loading…</Text>
      </View>
    );
  }

  const phone = worker.user.phone;

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.back} onPress={onBack}>← Back</Text>
      <View style={styles.avatar} />
      <Text style={styles.name}>{worker.user.name}</Text>
      <Text style={styles.meta}>
        {worker.category.name} · {worker.town}, {worker.county}
      </Text>
      <Text style={styles.meta}>
        ★ {worker.ratingAverage.toFixed(1)} ({worker.ratingCount} reviews) · {worker.yearsExperience} yrs experience
      </Text>
      <Text style={styles.price}>From KES {worker.startingPrice}</Text>

      <Text style={styles.sectionTitle}>About</Text>
      <Text style={styles.bio}>{worker.bio || "No bio provided yet."}</Text>

      {worker.skills.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>Skills</Text>
          <View style={styles.skillsRow}>
            {worker.skills.map((skill) => (
              <View key={skill} style={styles.skillChip}>
                <Text style={styles.skillText}>{skill}</Text>
              </View>
            ))}
          </View>
        </>
      )}

      <View style={styles.actionsRow}>
        <Pressable style={styles.bookButton} onPress={onBook}>
          <Text style={styles.bookButtonText}>Request booking</Text>
        </Pressable>
        {phone && (
          <>
            <Pressable style={styles.iconButton} onPress={() => Linking.openURL(`tel:${phone}`)}>
              <Text style={styles.iconButtonText}>Call</Text>
            </Pressable>
            <Pressable
              style={styles.iconButton}
              onPress={() => Linking.openURL(`https://wa.me/${phone.replace(/\D/g, "")}`)}
            >
              <Text style={styles.iconButtonText}>WhatsApp</Text>
            </Pressable>
          </>
        )}
        {worker.lat != null && worker.lng != null && (
          <Pressable
            style={styles.iconButton}
            onPress={() =>
              Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${worker.lat},${worker.lng}`)
            }
          >
            <Text style={styles.iconButtonText}>Map</Text>
          </Pressable>
        )}
      </View>

      {reviews.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>Reviews</Text>
          <View style={{ gap: spacing.sm, marginBottom: spacing.xl }}>
            {reviews.map((review) => (
              <View key={review.id} style={styles.reviewCard}>
                <Text style={styles.reviewMeta}>
                  {"★".repeat(review.rating)}{"☆".repeat(5 - review.rating)} · {review.author.name}
                </Text>
                {review.text ? <Text style={styles.bio}>{review.text}</Text> : null}
              </View>
            ))}
          </View>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.paper, paddingTop: 56, paddingHorizontal: spacing.md },
  back: { color: colors.copper, fontWeight: "600", marginBottom: spacing.md },
  avatar: { width: 88, height: 88, borderRadius: 44, backgroundColor: colors.brass, marginBottom: spacing.sm },
  name: { fontSize: 22, fontWeight: "700", color: colors.ink },
  meta: { color: colors.muted, marginTop: 4 },
  price: { color: colors.copper, fontWeight: "700", fontSize: 16, marginTop: spacing.sm },
  sectionTitle: { fontWeight: "700", color: colors.ink, marginTop: spacing.lg, marginBottom: spacing.xs },
  bio: { color: colors.ink, lineHeight: 20 },
  skillsRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing.xs },
  skillChip: { backgroundColor: "#00000010", paddingHorizontal: 10, paddingVertical: 6, borderRadius: 14 },
  skillText: { fontSize: 12, color: colors.ink },
  actionsRow: { flexDirection: "row", gap: spacing.sm, marginTop: spacing.xl, marginBottom: spacing.xl },
  reviewCard: { backgroundColor: "#fff", borderRadius: 10, padding: spacing.sm },
  reviewMeta: { color: colors.brass, fontWeight: "700", marginBottom: 2 },
  bookButton: { flex: 1, backgroundColor: colors.copper, borderRadius: 10, paddingVertical: 14, alignItems: "center" },
  bookButtonText: { color: colors.paper, fontWeight: "700" },
  iconButton: { paddingHorizontal: spacing.md, borderRadius: 10, justifyContent: "center", backgroundColor: "#00000010" },
  iconButtonText: { color: colors.ink, fontWeight: "600" },
});
