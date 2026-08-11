import { useEffect, useState } from "react";
import { ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import * as ImagePicker from "expo-image-picker";
import type { CategoryDto, WorkerStatus } from "@amon/shared";
import {
  fetchCategories,
  fetchOwnWorkerProfile,
  uploadWorkerDocuments,
  upsertWorkerProfile,
  type OwnWorkerProfile,
} from "../api/workers";
import { colors, spacing } from "../theme";

type Props = {
  onBack: () => void;
};

const STATUS_LABEL: Record<WorkerStatus, string> = {
  pending_review: "Pending review",
  approved: "Approved",
  rejected: "Rejected — edit and resubmit",
  suspended: "Suspended",
};

export function WorkerOnboardingScreen({ onBack }: Props) {
  const [categories, setCategories] = useState<CategoryDto[]>([]);
  const [profile, setProfile] = useState<OwnWorkerProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [categoryId, setCategoryId] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [bio, setBio] = useState("");
  const [skills, setSkills] = useState("");
  const [yearsExperience, setYearsExperience] = useState("");
  const [county, setCounty] = useState("");
  const [town, setTown] = useState("");
  const [languages, setLanguages] = useState("");
  const [startingPrice, setStartingPrice] = useState("");
  const [workingHours, setWorkingHours] = useState("");

  const [idPhotoUri, setIdPhotoUri] = useState<string | null>(null);
  const [selfieUri, setSelfieUri] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    Promise.all([fetchCategories(), fetchOwnWorkerProfile()])
      .then(([cats, own]) => {
        setCategories(cats);
        if (own) {
          setProfile(own);
          setCategoryId(own.categoryId);
          setBusinessName(own.businessName ?? "");
          setBio(own.bio);
          setSkills(own.skills.join(", "));
          setYearsExperience(String(own.yearsExperience));
          setCounty(own.county);
          setTown(own.town);
          setLanguages(own.languages.join(", "));
          setStartingPrice(String(own.startingPrice));
          setWorkingHours(own.workingHours);
        }
      })
      .catch(() => setError("Could not load your profile"))
      .finally(() => setLoading(false));
  }, []);

  async function handleSaveProfile() {
    setError(null);
    setSaving(true);
    try {
      const saved = await upsertWorkerProfile({
        categoryId,
        businessName: businessName || undefined,
        bio: bio || undefined,
        skills: skills ? skills.split(",").map((s) => s.trim()).filter(Boolean) : undefined,
        yearsExperience: yearsExperience ? Number(yearsExperience) : undefined,
        county,
        town,
        languages: languages ? languages.split(",").map((s) => s.trim()).filter(Boolean) : undefined,
        startingPrice: Number(startingPrice),
        workingHours: workingHours || undefined,
      });
      setProfile(saved);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save your profile");
    } finally {
      setSaving(false);
    }
  }

  async function pickImage(kind: "id" | "selfie") {
    setError(null);
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setError("Photo library access is needed to upload this");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
    });
    if (result.canceled) return;
    const uri = result.assets[0].uri;
    if (kind === "id") setIdPhotoUri(uri);
    else setSelfieUri(uri);
  }

  async function handleUpload() {
    if (!idPhotoUri && !selfieUri) return;
    setError(null);
    setUploading(true);
    try {
      const updated = await uploadWorkerDocuments({
        idPhoto: idPhotoUri ?? undefined,
        selfie: selfieUri ?? undefined,
      });
      setProfile(updated);
      setIdPhotoUri(null);
      setSelfieUri(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not upload photos");
    } finally {
      setUploading(false);
    }
  }

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator color={colors.copper} />
      </View>
    );
  }

  const canSave = Boolean(categoryId && county && town && startingPrice);

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: spacing.xl }}>
      <Text style={styles.back} onPress={onBack}>← Back</Text>
      <Text style={styles.title}>Worker profile</Text>

      {profile && (
        <View
          style={[
            styles.statusBadge,
            profile.status === "approved" && styles.statusApproved,
            profile.status === "rejected" && styles.statusRejected,
          ]}
        >
          <Text style={styles.statusText}>{STATUS_LABEL[profile.status]}</Text>
        </View>
      )}

      <Text style={styles.label}>Category</Text>
      <View style={styles.chipRow}>
        {categories.map((c) => (
          <Pressable
            key={c.id}
            onPress={() => setCategoryId(c.id)}
            style={[styles.chip, categoryId === c.id && styles.chipActive]}
          >
            <Text style={[styles.chipText, categoryId === c.id && styles.chipTextActive]}>{c.name}</Text>
          </Pressable>
        ))}
      </View>

      <Text style={styles.label}>Business name (optional)</Text>
      <TextInput
        style={styles.input}
        value={businessName}
        onChangeText={setBusinessName}
        placeholder="e.g. Otieno Electricals"
        placeholderTextColor={colors.muted}
      />

      <Text style={styles.label}>About you</Text>
      <TextInput
        style={[styles.input, styles.multiline]}
        value={bio}
        onChangeText={setBio}
        placeholder="Your experience, specialties…"
        placeholderTextColor={colors.muted}
        multiline
        numberOfLines={4}
      />

      <Text style={styles.label}>Skills (comma separated)</Text>
      <TextInput
        style={styles.input}
        value={skills}
        onChangeText={setSkills}
        placeholder="wiring, sockets, solar"
        placeholderTextColor={colors.muted}
      />

      <Text style={styles.label}>Years of experience</Text>
      <TextInput
        style={styles.input}
        value={yearsExperience}
        onChangeText={setYearsExperience}
        keyboardType="number-pad"
        placeholder="3"
        placeholderTextColor={colors.muted}
      />

      <Text style={styles.label}>County</Text>
      <TextInput style={styles.input} value={county} onChangeText={setCounty} placeholder="Nairobi" placeholderTextColor={colors.muted} />

      <Text style={styles.label}>Town</Text>
      <TextInput style={styles.input} value={town} onChangeText={setTown} placeholder="Kasarani" placeholderTextColor={colors.muted} />

      <Text style={styles.label}>Languages (comma separated)</Text>
      <TextInput
        style={styles.input}
        value={languages}
        onChangeText={setLanguages}
        placeholder="English, Swahili"
        placeholderTextColor={colors.muted}
      />

      <Text style={styles.label}>Starting price (KES)</Text>
      <TextInput
        style={styles.input}
        value={startingPrice}
        onChangeText={setStartingPrice}
        keyboardType="numeric"
        placeholder="500"
        placeholderTextColor={colors.muted}
      />

      <Text style={styles.label}>Working hours</Text>
      <TextInput
        style={styles.input}
        value={workingHours}
        onChangeText={setWorkingHours}
        placeholder="Mon–Sat, 8am–6pm"
        placeholderTextColor={colors.muted}
      />

      {error && <Text style={styles.error}>{error}</Text>}

      <Pressable style={styles.button} onPress={handleSaveProfile} disabled={saving || !canSave}>
        {saving ? <ActivityIndicator color={colors.paper} /> : <Text style={styles.buttonText}>{profile ? "Save changes" : "Create profile"}</Text>}
      </Pressable>

      {profile && (
        <>
          <Text style={styles.sectionTitle}>Verification documents</Text>
          <Text style={styles.hint}>Required before your profile can be approved.</Text>

          <View style={styles.uploadRow}>
            <Pressable style={styles.uploadTile} onPress={() => pickImage("id")}>
              {idPhotoUri ? (
                <Image source={{ uri: idPhotoUri }} style={styles.uploadPreview} />
              ) : (
                <Text style={styles.uploadTileText}>
                  {profile.idPhotoUploaded ? "✓ ID uploaded\n(tap to replace)" : "Add ID photo"}
                </Text>
              )}
            </Pressable>
            <Pressable style={styles.uploadTile} onPress={() => pickImage("selfie")}>
              {selfieUri ? (
                <Image source={{ uri: selfieUri }} style={styles.uploadPreview} />
              ) : (
                <Text style={styles.uploadTileText}>
                  {profile.selfieUploaded ? "✓ Selfie uploaded\n(tap to replace)" : "Add selfie"}
                </Text>
              )}
            </Pressable>
          </View>

          {(idPhotoUri || selfieUri) && (
            <Pressable style={styles.button} onPress={handleUpload} disabled={uploading}>
              {uploading ? <ActivityIndicator color={colors.paper} /> : <Text style={styles.buttonText}>Upload</Text>}
            </Pressable>
          )}
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.paper, paddingTop: 56, paddingHorizontal: spacing.md },
  centered: { justifyContent: "center", alignItems: "center" },
  back: { color: colors.copper, fontWeight: "600", marginBottom: spacing.md },
  title: { fontSize: 22, fontWeight: "700", color: colors.ink, marginBottom: spacing.sm },
  statusBadge: {
    alignSelf: "flex-start",
    backgroundColor: colors.brass,
    borderRadius: 20,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    marginBottom: spacing.md,
  },
  statusApproved: { backgroundColor: colors.success },
  statusRejected: { backgroundColor: colors.danger },
  statusText: { color: colors.paper, fontWeight: "700", fontSize: 12 },
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
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#00000010",
  },
  chipActive: { backgroundColor: colors.copper },
  chipText: { color: colors.ink, fontSize: 13 },
  chipTextActive: { color: colors.paper, fontWeight: "600" },
  button: { backgroundColor: colors.copper, borderRadius: 10, paddingVertical: 14, alignItems: "center", marginTop: spacing.xl },
  buttonText: { color: colors.paper, fontWeight: "700" },
  error: { color: "#E4756B", marginTop: spacing.sm },
  sectionTitle: { fontWeight: "700", color: colors.ink, marginTop: spacing.xl, marginBottom: spacing.xs },
  hint: { color: colors.muted, fontSize: 12, marginBottom: spacing.sm },
  uploadRow: { flexDirection: "row", gap: spacing.sm },
  uploadTile: {
    flex: 1,
    height: 140,
    borderRadius: 10,
    backgroundColor: "#00000010",
    borderWidth: 1,
    borderColor: "#00000014",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  uploadTileText: { color: colors.muted, fontSize: 12, textAlign: "center", paddingHorizontal: spacing.sm },
  uploadPreview: { width: "100%", height: "100%" },
});
