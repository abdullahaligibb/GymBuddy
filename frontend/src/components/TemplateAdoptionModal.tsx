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

import { WorkoutDay, WorkoutTemplate } from "../types";

type TemplateAdoptionModalProps = {
  days: WorkoutDay[];
  template?: WorkoutTemplate;
  visible: boolean;
  onClose: () => void;
  onSubmit: (dayId: string, time: string) => void;
};

export function TemplateAdoptionModal({
  days,
  template,
  visible,
  onClose,
  onSubmit,
}: TemplateAdoptionModalProps) {
  const [selectedDayId, setSelectedDayId] = useState(days[0]?.id ?? "");
  const [time, setTime] = useState("18:00");

  useEffect(() => {
    if (!visible) {
      return;
    }

    const preferredDay =
      days.find((day) => day.status === "ruhe" && day.muscles.length === 0) ??
      days[0];
    setSelectedDayId(preferredDay?.id ?? "");
    setTime(preferredDay?.time === "-" ? "18:00" : preferredDay?.time ?? "18:00");
  }, [days, visible]);

  if (!template) {
    return null;
  }

  const selectedDay = days.find((day) => day.id === selectedDayId);
  const replacesWorkout = Boolean(
    selectedDay &&
      !(selectedDay.status === "ruhe" && selectedDay.muscles.length === 0),
  );

  return (
    <Modal
      animationType="slide"
      onRequestClose={onClose}
      transparent
      visible={visible}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.overlay}
      >
        <View style={styles.sheet}>
          <View style={styles.header}>
            <View style={styles.headingColumn}>
              <Text style={styles.eyebrow}>Vorlage übernehmen</Text>
              <Text style={styles.title}>{template.name}</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>Schließen</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.introText}>
            Wähle den Tag, an dem du dieses Workout einplanen möchtest.
          </Text>

          <ScrollView
            contentContainerStyle={styles.dayList}
            horizontal
            showsHorizontalScrollIndicator={false}
          >
            {days.map((day) => {
              const isSelected = day.id === selectedDayId;
              const isFree = day.status === "ruhe" && day.muscles.length === 0;

              return (
                <TouchableOpacity
                  accessibilityRole="button"
                  accessibilityState={{ selected: isSelected }}
                  key={day.id}
                  onPress={() => setSelectedDayId(day.id)}
                  style={[styles.dayOption, isSelected && styles.activeDayOption]}
                >
                  <Text
                    style={[styles.dayName, isSelected && styles.activeDayText]}
                  >
                    {day.day}
                  </Text>
                  <Text
                    style={[styles.dayDate, isSelected && styles.activeDayText]}
                  >
                    {day.date}
                  </Text>
                  <Text
                    style={[styles.dayStatus, isSelected && styles.activeDayText]}
                  >
                    {isFree ? "Frei" : "Belegt"}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          <Text style={styles.fieldLabel}>Uhrzeit</Text>
          <TextInput
            accessibilityLabel="Uhrzeit für die Vorlage"
            onChangeText={setTime}
            placeholder="18:00"
            placeholderTextColor="#66736E"
            returnKeyType="done"
            style={styles.input}
            value={time}
          />

          {replacesWorkout && (
            <Text style={styles.warningText}>
              Das vorhandene Training an diesem Tag wird ersetzt.
            </Text>
          )}

          <View style={styles.templateSummary}>
            <Text style={styles.summaryText}>
              {template.durationMinutes} Min. · {template.exercises.length} Übungen
            </Text>
            <Text style={styles.summaryText}>{template.goal}</Text>
          </View>

          <TouchableOpacity
            disabled={!selectedDayId}
            onPress={() => onSubmit(selectedDayId, time.trim() || "18:00")}
            style={styles.confirmButton}
          >
            <Text style={styles.confirmButtonText}>Im Kalender einplanen</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
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
    padding: 20,
    paddingBottom: 28,
  },
  header: {
    alignItems: "flex-start",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  headingColumn: {
    flex: 1,
    paddingRight: 12,
  },
  eyebrow: {
    color: "#8D9A95",
    fontSize: 12,
    fontWeight: "800",
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
    justifyContent: "center",
    minHeight: 42,
    paddingHorizontal: 12,
  },
  closeButtonText: {
    color: "#DCE5E1",
    fontSize: 13,
    fontWeight: "900",
  },
  introText: {
    color: "#B9C4BF",
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
  },
  dayList: {
    gap: 8,
    paddingRight: 20,
  },
  dayOption: {
    alignItems: "center",
    backgroundColor: "#18201E",
    borderColor: "rgba(255,255,255,0.08)",
    borderRadius: 8,
    borderWidth: 1,
    minWidth: 72,
    paddingHorizontal: 10,
    paddingVertical: 11,
  },
  activeDayOption: {
    backgroundColor: "#7CFF6B",
    borderColor: "#7CFF6B",
  },
  dayName: {
    color: "#F4F7F5",
    fontSize: 16,
    fontWeight: "900",
  },
  dayDate: {
    color: "#8D9A95",
    fontSize: 11,
    marginTop: 2,
  },
  dayStatus: {
    color: "#B9C4BF",
    fontSize: 10,
    fontWeight: "800",
    marginTop: 6,
    textTransform: "uppercase",
  },
  activeDayText: {
    color: "#0B0F0E",
  },
  fieldLabel: {
    color: "#DCE5E1",
    fontSize: 13,
    fontWeight: "900",
    marginBottom: 8,
    marginTop: 18,
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
  },
  warningText: {
    color: "#FFB86B",
    fontSize: 12,
    lineHeight: 18,
    marginTop: 10,
  },
  templateSummary: {
    backgroundColor: "#111716",
    borderRadius: 8,
    gap: 5,
    marginTop: 16,
    padding: 13,
  },
  summaryText: {
    color: "#B9C4BF",
    fontSize: 13,
    lineHeight: 18,
  },
  confirmButton: {
    alignItems: "center",
    backgroundColor: "#7CFF6B",
    borderRadius: 8,
    justifyContent: "center",
    marginTop: 18,
    minHeight: 50,
  },
  confirmButtonText: {
    color: "#0B0F0E",
    fontSize: 15,
    fontWeight: "900",
  },
});
