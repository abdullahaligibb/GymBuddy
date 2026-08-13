import { ScrollView, StyleSheet, Text, View } from "react-native";

import { exercises } from "../data/exercises";
import { workoutTemplates } from "../data/workoutTemplates";

const exerciseNames = new Map(
  exercises.map((exercise) => [exercise.id, exercise.name]),
);

export function WorkoutTemplateLibrary() {
  return (
    <ScrollView
      contentContainerStyle={styles.templateList}
      horizontal
      showsHorizontalScrollIndicator={false}
    >
      {workoutTemplates.map((template) => (
        <View key={template.id} style={styles.templateCard}>
          <View style={styles.cardHeader}>
            <View style={styles.headingColumn}>
              <Text style={styles.cardTitle}>{template.name}</Text>
              <Text style={styles.goalText}>{template.goal}</Text>
            </View>
            <Text style={styles.difficultyBadge}>{template.difficulty}</Text>
          </View>

          <View style={styles.summaryRow}>
            <SummaryItem label="Dauer" value={`${template.durationMinutes} Min.`} />
            <SummaryItem
              label="Übungen"
              value={String(template.exercises.length)}
            />
          </View>

          <View style={styles.muscleList}>
            {template.muscles.map((muscle) => (
              <Text key={muscle} style={styles.muscleChip}>
                {muscle}
              </Text>
            ))}
          </View>

          <View style={styles.exerciseList}>
            <Text style={styles.listLabel}>Übungsliste</Text>
            {template.exercises.map((templateExercise, index) => (
              <View
                key={templateExercise.exerciseId}
                style={styles.exerciseRow}
              >
                <View style={styles.exerciseNameRow}>
                  <Text style={styles.exerciseNumber}>{index + 1}</Text>
                  <Text style={styles.exerciseName}>
                    {exerciseNames.get(templateExercise.exerciseId) ??
                      templateExercise.exerciseId}
                  </Text>
                </View>
                <Text style={styles.exercisePrescription}>
                  {templateExercise.sets} × {templateExercise.repetitions}
                </Text>
              </View>
            ))}
          </View>
        </View>
      ))}
    </ScrollView>
  );
}

function SummaryItem({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.summaryItem}>
      <Text style={styles.summaryLabel}>{label}</Text>
      <Text style={styles.summaryValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  templateList: {
    gap: 12,
    paddingRight: 20,
  },
  templateCard: {
    backgroundColor: "#111716",
    borderColor: "rgba(124,255,107,0.2)",
    borderRadius: 8,
    borderWidth: 1,
    padding: 18,
    width: 318,
  },
  cardHeader: {
    alignItems: "flex-start",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  headingColumn: {
    flex: 1,
    paddingRight: 10,
  },
  cardTitle: {
    color: "#F4F7F5",
    fontSize: 19,
    fontWeight: "900",
    marginBottom: 6,
  },
  goalText: {
    color: "#B9C4BF",
    fontSize: 13,
    lineHeight: 19,
  },
  difficultyBadge: {
    backgroundColor: "#18201E",
    borderRadius: 999,
    color: "#7CFF6B",
    fontSize: 11,
    fontWeight: "800",
    overflow: "hidden",
    paddingHorizontal: 9,
    paddingVertical: 6,
  },
  summaryRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 16,
  },
  summaryItem: {
    backgroundColor: "#18201E",
    borderRadius: 8,
    flex: 1,
    padding: 10,
  },
  summaryLabel: {
    color: "#8D9A95",
    fontSize: 11,
    fontWeight: "800",
    marginBottom: 3,
    textTransform: "uppercase",
  },
  summaryValue: {
    color: "#F4F7F5",
    fontSize: 14,
    fontWeight: "900",
  },
  muscleList: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 14,
  },
  muscleChip: {
    borderColor: "rgba(255,255,255,0.12)",
    borderRadius: 999,
    borderWidth: 1,
    color: "#DCE5E1",
    fontSize: 11,
    overflow: "hidden",
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  exerciseList: {
    borderColor: "rgba(255,255,255,0.08)",
    borderTopWidth: 1,
    gap: 10,
    marginTop: 16,
    paddingTop: 14,
  },
  listLabel: {
    color: "#8D9A95",
    fontSize: 11,
    fontWeight: "800",
    textTransform: "uppercase",
  },
  exerciseRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  exerciseNameRow: {
    alignItems: "center",
    flex: 1,
    flexDirection: "row",
    paddingRight: 8,
  },
  exerciseNumber: {
    color: "#65716C",
    fontSize: 12,
    fontWeight: "800",
    width: 22,
  },
  exerciseName: {
    color: "#DCE5E1",
    flex: 1,
    fontSize: 13,
    fontWeight: "700",
  },
  exercisePrescription: {
    color: "#7CFF6B",
    fontSize: 12,
    fontWeight: "900",
  },
});
