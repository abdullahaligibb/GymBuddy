import { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { validateHealthProfile } from '../domain/profileForm';
import {
  ActivityLevel,
  ExperienceLevel,
  HealthProfile,
  TrainingGoal,
} from '../types';

const activities: ActivityLevel[] = [
  'Wenig aktiv',
  'Leicht aktiv',
  'Moderat aktiv',
  'Sehr aktiv',
];
const goals: TrainingGoal[] = [
  'Muskelaufbau',
  'Kraftaufbau',
  'Fettabbau',
  'Allgemeine Fitness',
];
const levels: ExperienceLevel[] = ['Einsteiger', 'Mittel', 'Fortgeschritten'];
const days = [
  'Montag',
  'Dienstag',
  'Mittwoch',
  'Donnerstag',
  'Freitag',
  'Samstag',
  'Sonntag',
];
type Props = {
  profile: HealthProfile;
  visible: boolean;
  onClose: () => void;
  onSubmit: (profile: HealthProfile) => void;
  saving?: boolean;
  saveError?: string;
};
export function ProfileFormModal({
  profile,
  visible,
  onClose,
  onSubmit,
  saving,
  saveError,
}: Props) {
  const [draft, setDraft] = useState(profile);
  const [errors, setErrors] = useState<Record<string, string>>({});
  useEffect(() => {
    if (visible) {
      setDraft(profile);
      setErrors({});
    }
  }, [profile, visible]);
  function text(key: keyof HealthProfile, value: string) {
    setDraft((current) => ({ ...current, [key]: value }));
  }
  function number(key: keyof HealthProfile, value: string) {
    setDraft((current) => ({ ...current, [key]: Number(value) || 0 }));
  }
  function toggleDay(day: string) {
    setDraft((current) => ({
      ...current,
      preferredTrainingDays: current.preferredTrainingDays.includes(day)
        ? current.preferredTrainingDays.filter((item) => item !== day)
        : [...current.preferredTrainingDays, day],
    }));
  }
  function submit() {
    if (saving) return;
    const next = validateHealthProfile(draft);
    setErrors(next);
    if (!Object.keys(next).length) onSubmit(draft);
  }
  return (
    <Modal
      animationType="slide"
      transparent
      visible={visible}
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.overlay}
      >
        <View style={styles.sheet}>
          <View style={styles.header}>
            <Text style={styles.title}>Profil bearbeiten</Text>
            <TouchableOpacity style={styles.chip} onPress={onClose}>
              <Text style={styles.chipText}>Schliessen</Text>
            </TouchableOpacity>
          </View>
          <ScrollView
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.content}
          >
            <Field
              label="Name *"
              value={draft.name}
              onChangeText={(v) => text('name', v)}
              error={errors.name}
            />
            <Field
              label="Geburtsdatum (JJJJ-MM-TT) *"
              value={draft.birthDateIso}
              onChangeText={(v) => text('birthDateIso', v)}
              error={errors.birthDateIso}
            />
            <View style={styles.grid}>
              <View style={styles.column}>
                <Field
                  label="Grösse (cm) *"
                  value={String(draft.heightCm || '')}
                  keyboardType="number-pad"
                  onChangeText={(v) => number('heightCm', v)}
                  error={errors.heightCm}
                />
              </View>
              <View style={styles.column}>
                <Field
                  label="Gewicht (kg) *"
                  value={String(draft.weightKg || '')}
                  keyboardType="decimal-pad"
                  onChangeText={(v) => number('weightKg', v)}
                  error={errors.weightKg}
                />
              </View>
            </View>
            <View style={styles.grid}>
              <View style={styles.column}>
                <Field
                  label="Zielgewicht (kg) *"
                  value={String(draft.targetWeightKg || '')}
                  keyboardType="decimal-pad"
                  onChangeText={(v) => number('targetWeightKg', v)}
                  error={errors.targetWeightKg}
                />
              </View>
              <View style={styles.column}>
                <Field
                  label="Zieldatum *"
                  value={draft.targetDateIso}
                  onChangeText={(v) => text('targetDateIso', v)}
                  error={errors.targetDateIso}
                />
              </View>
            </View>
            <Label text="Aktivitätsniveau" />
            <Options
              values={activities}
              selected={draft.activityLevel}
              onSelect={(v) => setDraft({ ...draft, activityLevel: v })}
            />
            <Label text="Primäres Ziel" />
            <Options
              values={goals}
              selected={draft.primaryGoal}
              onSelect={(v) => setDraft({ ...draft, primaryGoal: v })}
            />
            <Label text="Erfahrungsniveau" />
            <Options
              values={levels}
              selected={draft.experienceLevel}
              onSelect={(v) => setDraft({ ...draft, experienceLevel: v })}
            />
            <Field
              label="Trainingsziel pro Woche *"
              value={String(draft.weeklyWorkoutGoal || '')}
              keyboardType="number-pad"
              onChangeText={(v) => number('weeklyWorkoutGoal', v)}
              error={errors.weeklyWorkoutGoal}
            />
            <Label text="Bevorzugte Trainingstage *" />
            <View style={styles.options}>
              {days.map((day) => (
                <Chip
                  key={day}
                  label={day}
                  active={draft.preferredTrainingDays.includes(day)}
                  onPress={() => toggleDay(day)}
                />
              ))}
            </View>
            {errors.preferredTrainingDays ? (
              <Text style={styles.error}>{errors.preferredTrainingDays}</Text>
            ) : null}
            <Label text="Variante für Makroziele" />
            <View style={styles.options}>
              <Chip
                label="Nicht gewählt"
                active={!draft.energyFormula}
                onPress={() => setDraft({ ...draft, energyFormula: undefined })}
              />
              <Chip
                label="Weibliche Formel"
                active={draft.energyFormula === 'female'}
                onPress={() => setDraft({ ...draft, energyFormula: 'female' })}
              />
              <Chip
                label="Männliche Formel"
                active={draft.energyFormula === 'male'}
                onPress={() => setDraft({ ...draft, energyFormula: 'male' })}
              />
            </View>
            {saveError ? (
              <Text accessibilityRole="alert" style={styles.error}>
                {saveError}
              </Text>
            ) : null}
            <TouchableOpacity
              disabled={saving}
              style={styles.save}
              onPress={submit}
            >
              <Text style={styles.saveText}>
                {saving ? 'Wird gespeichert …' : 'Profil speichern'}
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
function Label({ text }: { text: string }) {
  return <Text style={styles.label}>{text}</Text>;
}
function Field({
  label,
  error,
  ...props
}: React.ComponentProps<typeof TextInput> & { label: string; error?: string }) {
  return (
    <View>
      <Label text={label} />
      <TextInput
        {...props}
        accessibilityLabel={label}
        placeholderTextColor="#66736E"
        style={[styles.input, error && styles.inputError]}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}
function Options<T extends string>({
  values,
  selected,
  onSelect,
}: {
  values: T[];
  selected: T;
  onSelect: (v: T) => void;
}) {
  return (
    <View style={styles.options}>
      {values.map((value) => (
        <Chip
          key={value}
          label={value}
          active={selected === value}
          onPress={() => onSelect(value)}
        />
      ))}
    </View>
  );
}
function Chip({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      style={[styles.chip, active && styles.active]}
      onPress={onPress}
    >
      <Text style={[styles.chipText, active && styles.activeText]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}
const styles = StyleSheet.create({
  overlay: {
    backgroundColor: 'rgba(0,0,0,.68)',
    flex: 1,
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#0F1514',
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    maxHeight: '94%',
    padding: 20,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  title: { color: '#F4F7F5', fontSize: 24, fontWeight: '900' },
  content: { paddingBottom: 30 },
  label: {
    color: '#DCE5E1',
    fontSize: 13,
    fontWeight: '900',
    marginBottom: 8,
    marginTop: 14,
  },
  input: {
    backgroundColor: '#111716',
    borderColor: 'rgba(255,255,255,.1)',
    borderRadius: 8,
    borderWidth: 1,
    color: '#F4F7F5',
    minHeight: 48,
    paddingHorizontal: 13,
  },
  inputError: { borderColor: '#FF7A7E' },
  error: { color: '#FF9A9D', fontSize: 12, marginTop: 5 },
  grid: { flexDirection: 'row', gap: 10 },
  column: { flex: 1 },
  options: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    alignItems: 'center',
    backgroundColor: '#18201E',
    borderRadius: 8,
    justifyContent: 'center',
    minHeight: 42,
    paddingHorizontal: 12,
  },
  chipText: { color: '#B9C4BF', fontWeight: '800' },
  active: { backgroundColor: '#7CFF6B' },
  activeText: { color: '#0B0F0E' },
  save: {
    alignItems: 'center',
    backgroundColor: '#7CFF6B',
    borderRadius: 8,
    justifyContent: 'center',
    marginTop: 22,
    minHeight: 50,
  },
  saveText: { color: '#0B0F0E', fontWeight: '900' },
});
