import { useEffect, useState } from "react";
import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { fetchCategories, searchWorkers } from "../api/workers";
import type { CategoryDto, WorkerProfileDto } from "@amon/shared";
import { colors, spacing } from "../theme";

type WorkerResult = WorkerProfileDto & { user: { name: string }; category: CategoryDto };

type Props = {
  onSelectWorker: (userId: string) => void;
  onManageWorkerProfile?: () => void;
  onOpenBookings: () => void;
};

export function HomeScreen({ onSelectWorker, onManageWorkerProfile, onOpenBookings }: Props) {
  const [categories, setCategories] = useState<CategoryDto[]>([]);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [workers, setWorkers] = useState<WorkerResult[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCategories().then(setCategories).catch(() => setCategories([]));
  }, []);

  useEffect(() => {
    setLoading(true);
    searchWorkers({ categoryId: activeCategory ?? undefined, query: query || undefined })
      .then((res) => setWorkers(res.data))
      .catch(() => setWorkers([]))
      .finally(() => setLoading(false));
  }, [activeCategory, query]);

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.header}>Find a trusted pro</Text>
        <View style={styles.headerLinks}>
          <Text style={styles.workerLink} onPress={onOpenBookings}>My bookings</Text>
          {onManageWorkerProfile && (
            <Text style={styles.workerLink} onPress={onManageWorkerProfile}>
              My worker profile
            </Text>
          )}
        </View>
      </View>
      <TextInput
        style={styles.search}
        placeholder="Search: electrician, plumber, cleaner…"
        placeholderTextColor={colors.muted}
        value={query}
        onChangeText={setQuery}
      />

      <FlatList
        horizontal
        data={categories}
        keyExtractor={(c) => c.id}
        showsHorizontalScrollIndicator={false}
        style={styles.categoryRow}
        renderItem={({ item }) => (
          <Pressable
            onPress={() => setActiveCategory(activeCategory === item.id ? null : item.id)}
            style={[styles.chip, activeCategory === item.id && styles.chipActive]}
          >
            <Text style={[styles.chipText, activeCategory === item.id && styles.chipTextActive]}>
              {item.name}
            </Text>
          </Pressable>
        )}
      />

      <FlatList
        data={workers}
        keyExtractor={(w) => w.userId}
        contentContainerStyle={{ gap: spacing.sm, paddingTop: spacing.md }}
        ListEmptyComponent={
          !loading ? <Text style={styles.empty}>No workers match yet — try another search.</Text> : null
        }
        renderItem={({ item }) => (
          <Pressable style={styles.card} onPress={() => onSelectWorker(item.userId)}>
            <View style={styles.cardAvatar} />
            <View style={{ flex: 1 }}>
              <Text style={styles.cardName}>{item.user.name}</Text>
              <Text style={styles.cardMeta}>
                {item.category.name} · {item.town}, {item.county}
              </Text>
              <Text style={styles.cardMeta}>
                ★ {item.ratingAverage.toFixed(1)} ({item.ratingCount}) · from KES {item.startingPrice}
              </Text>
            </View>
          </Pressable>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.paper, paddingTop: 56, paddingHorizontal: spacing.md },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: spacing.md, gap: spacing.sm },
  header: { fontSize: 24, fontWeight: "700", color: colors.ink },
  headerLinks: { alignItems: "flex-end", gap: 4 },
  workerLink: { color: colors.copper, fontWeight: "600", fontSize: 12 },
  search: {
    backgroundColor: "#fff",
    borderRadius: 10,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    fontSize: 15,
    borderWidth: 1,
    borderColor: "#00000014",
  },
  categoryRow: { marginTop: spacing.md, flexGrow: 0 },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#00000010",
    marginRight: spacing.sm,
  },
  chipActive: { backgroundColor: colors.copper },
  chipText: { color: colors.ink, fontSize: 13 },
  chipTextActive: { color: colors.paper, fontWeight: "600" },
  card: {
    flexDirection: "row",
    gap: spacing.md,
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: spacing.md,
    alignItems: "center",
  },
  cardAvatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: colors.brass },
  cardName: { fontSize: 16, fontWeight: "700", color: colors.ink },
  cardMeta: { fontSize: 12, color: colors.muted, marginTop: 2 },
  empty: { textAlign: "center", color: colors.muted, marginTop: spacing.xl },
});
