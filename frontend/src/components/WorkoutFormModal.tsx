import { useEffect, useState } from "react";
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
} from "react-native";

import { WorkoutDay, WorkoutIntensity, WorkoutType } from "../types";

type WorkoutFormModalProps = {
  visible: boolean;
  dayTemplates: WorkoutDay[];
  selectedDay?: WorkoutDay;
  onClose: () => void;
  onSubmit: (workout: WorkoutDay) => void;
};

const workoutTypes: WorkoutType[] = [
  "Push",
  "Pull",
  "Legs",
  "Full Body",
  "Upper Body",
  "Lower Body",
  "Cardio",
  "Mobility",
];

const intensityOptions: WorkoutIntensity[] = ["Leicht", "Mittel", "Schwer"];

const muscleOptions = [
  "Brust",
  "Rücken",
  "Beine",
  "Schulter",
  "Bizeps",
  "Trizeps",
  "Bauch",
  "Waden",
  "Cardio",
];

export function WorkoutFormModal({
  visible,
  dayTemplates,
  selectedDay,
  onClose,
  onSubmit,
}: WorkoutFormModalProps) {
  const fallbackDay = selectedDay ?? dayTemplates[0];
  const [dayId, setDayId] = useState(fallbackDay.id);
  const [title, setTitle] = useState("Push Day");
  const [time, setTime] = useState("18:30");
  const [duration, setDuration] = useState("60");
  const [type, setType] = useState<WorkoutType>("Push");
  const [intensity, setIntensity] = useState<WorkoutIntensity>("Mittel");
  const [muscles, setMuscles] = useState<string[]>(["Brust", "Schulter"]);
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (!visible) {
      return;
    }

    const day = selectedDay ?? dayTemplates[0];
    setDayId(day.id);
    setTitle(day.status === "ruhe" && day.muscles.length === 0 ? "" : day.title);
    setTime(day.time === "-" ? "18:00" : day.time);
    setDuration(day.durationMinutes > 0 ? String(day.durationMinutes) : "60");
    setType(day.type === "Rest Day" ? "Push" : day.type);
    setIntensity(day.intensity);
    setMuscles(day.muscles.length > 0 ? day.muscles : ["Brust"]);
    setNotes(day.notes ?? "");
  }, [dayTemplates, selectedDay, visible]);

  const selectedTemplate =
    dayTemplates.find((template) => template.id === dayId) ?? fallbackDay;

  function toggleMuscle(muscle: string) {
    setMuscles((current) =>
      current.includes(muscle)
        ? current.filter((item) => item !== muscle)
        : [...current, muscle],
    );
  }

  function handleSubmit() {
    const cleanTitle = title.trim() || `${type} Training`;
    const cleanDuration = Number.parseInt(duration, 10);

    onSubmit({
      ...selectedTemplate,
      id: selectedTemplate.id,
      title: cleanTitle,
      time: time.trim() || "18:00",
      durationMinutes: Number.isFinite(cleanDuration) ? cleanDuration : 60,
      type,
      muscles: muscles.length > 0 ? muscles : ["Ganzkörper"],
      intensity,
      status: "geplant",
      notes: notes.trim(),
    });
  }

  return (
    <Modal animationType="slide" transparent visible={visible} onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.overlay}
      >
        <View style={styles.sheet}>
          <View style={styles.sheetHeader}>
            <View>
              <Text style={styles.eyebrow}>Training planen</Text>
              <Text style={styles.title}>Neues Workout</Text>
            </View>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Text style={styles.closeButtonText}>Schliessen</Text>
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            <FieldLabel label="Tag" />
            <View style={styles.optionRow}>
              {dayTemplates.map((day) => (
                <TouchableOpacity
                  key={day.id}
                  style={[styles.optionChip, day.id === dayId && styles.activeChip]}
                  onPress={() => setDayId(day.id)}
                >
                  <Text
                    style={[
                      styles.optionChipText,
                      day.id === dayId && styles.activeChipText,
                    ]}
                  >
                    {day.day}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <FieldLabel label="Trainingstitel" />
            <TextInput
              placeholder="z.B. Push Day"
              placeholderTextColor="#66736E"
              style={styles.input}
              value={title}
              onChangeText={setTitle}
            />

            <View style={styles.inputGrid}>
              <View style={styles.inputColumn}>
                <FieldLabel label="Uhrzeit" />
                <TextInput
                  placeholder="18:30"
                  placeholderTextColor="#66736E"
                  style={styles.input}
                  value={time}
                  onChangeText={setTime}
                />
              </View>
              <View style={styles.inputColumn}>
                <FieldLabel label="Dauer" />
                <TextInput
                  keyboardType="number-pad"
                  placeholder="60"
                  placeholderTextColor="#66736E"
                  style={styles.input}
                  value={duration}
                  onChangeText={setDuration}
                />
              </View>
            </View>

            <FieldLabel label="Workout-Typ" />
            <View style={styles.optionRow}>
              {workoutTypes.map((option) => (
                <SelectableChip
                  key={option}
                  active={type === option}
                  label={option}
                  onPress={() => setType(option)}
                />
              ))}
            </View>

            <FieldLabel label="Intensität" />
            <View style={styles.optionRow}>
              {intensityOptions.map((option) => (
                <SelectableChip
                  key={option}
                  active={intensity === option}
                  label={option}
                  onPress={() => setIntensity(option)}
                />
              ))}
            </View>

            <FieldLabel label="Muskelgruppen" />
            <View style={styles.optionRow}>
              {muscleOptions.map((option) => (
                <SelectableChip
                  key={option}
                  active={muscles.includes(option)}
                  label={option}
                  onPress={() => toggleMuscle(option)}
                />
              ))}
            </View>

            <FieldLabel label="Notizen" />
            <TextInput
              multiline
              placeholder="Optional, z.B. Fokus auf Technik"
              placeholderTextColor="#66736E"
              style={[styles.input, styles.notesInput]}
              value={notes}
              onChangeText={setNotes}
            />

            <TouchableOpacity style={styles.saveButton} onPress={handleSubmit}>
              <Text style={styles.saveButtonText}>Training speichern</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function FieldLabel({ label }: { label: string }) {
  return <Text style={styles.fieldLabel}>{label}</Text>;
}

function SelectableChip({
  active,
  label,
  onPress,
}: {
  active: boolean;
  label: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={[styles.optionChip, active && styles.activeChip]}
      onPress={onPress}
    >
      <Text style={[styles.optionChipText, active && styles.activeChipText]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  overlay: {
    backgroundColor: "rgba(0,0,0,0.62)",
    flex: 1,
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: "#0F1514",
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    maxHeight: "92%",
    padding: 20,
  },
  sheetHeader: {
    alignItems: "flex-start",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  eyebrow: {
    color: "#8D9A95",
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 0,
    marginBottom: 6,
    textTransform: "uppercase",
  },
  title: {
    color: "#F4F7F5",
    fontSize: 24,
    fontWeight: "900",
  },
  closeButton: {
    alignItems: "center",
    backgroundColor: "#18201E",
    borderRadius: 8,
    minHeight: 42,
    justifyContent: "center",
    paddingHorizontal: 12,
  },
  closeButtonText: {
    color: "#DCE5E1",
    fontSize: 13,
    fontWeight: "900",
  },
  fieldLabel: {
    color: "#DCE5E1",
    fontSize: 13,
    fontWeight: "900",
    marginBottom: 8,
    marginTop: 14,
  },
  input: {
    backgroundColor: "#111716",
    borderColor: "rgba(255,255,255,0.08)",
    borderRadius: 8,
    borderWidth: 1,
    color: "#F4F7F5",
    fontSize: 15,
    minHeight: 48,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  inputGrid: {
    flexDirection: "row",
    gap: 12,
  },
  inputColumn: {
    flex: 1,
  },
  notesInput: {
    minHeight: 92,
    textAlignVertical: "top",
  },
  optionRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  optionChip: {
    alignItems: "center",
    backgroundColor: "#18201E",
    borderColor: "rgba(255,255,255,0.08)",
    borderRadius: 999,
    borderWidth: 1,
    minHeight: 40,
    justifyContent: "center",
    paddingHorizontal: 13,
  },
  activeChip: {
    backgroundColor: "#7CFF6B",
    borderColor: "#7CFF6B",
  },
  optionChipText: {
    color: "#B9C4BF",
    fontSize: 13,
    fontWeight: "800",
  },
  activeChipText: {
    color: "#0B0F0E",
  },
  saveButton: {
    alignItems: "center",
    backgroundColor: "#7CFF6B",
    borderRadius: 8,
    justifyContent: "center",
    marginTop: 22,
    minHeight: 50,
  },
  saveButtonText: {
    color: "#0B0F0E",
    fontSize: 15,
    fontWeight: "900",
  },
});
