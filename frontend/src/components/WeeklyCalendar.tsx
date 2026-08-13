import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { WorkoutDay, WorkoutStatus } from "../types";

type WeeklyCalendarProps = {
  workouts: WorkoutDay[];
  onPlanDay?: (workout: WorkoutDay) => void;
  onEditWorkout?: (workout: WorkoutDay) => void;
  onMarkDone?: (workout: WorkoutDay) => void;
  onDeleteWorkout?: (workout: WorkoutDay) => void;
};

function getStatusStyle(status: WorkoutStatus) {
  if (status === "erledigt") {
    return styles.doneCard;
  }

  if (status === "geplant") {
    return styles.plannedCard;
  }

  if (status === "verpasst") {
    return styles.missedCard;
  }

  return styles.restCard;
}

function getStatusLabel(status: WorkoutStatus) {
  if (status === "erledigt") {
    return "Erledigt";
  }

  if (status === "geplant") {
    return "Geplant";
  }

  if (status === "verpasst") {
    return "Verpasst";
  }

  return "Ruhetag";
}

export function WeeklyCalendar({
  workouts,
  onPlanDay,
  onEditWorkout,
  onMarkDone,
  onDeleteWorkout,
}: WeeklyCalendarProps) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.weekRow}
    >
      {workouts.map((item) => {
        const isEmptyRestDay = item.status === "ruhe" && item.muscles.length === 0;

        return (
          <View key={item.id} style={[styles.dayCard, getStatusStyle(item.status)]}>
            <View style={styles.dayHeader}>
              <View>
                <Text style={styles.dayText}>{item.day}</Text>
                <Text style={styles.mutedText}>{item.date}</Text>
              </View>
              <Text style={[styles.statusPill, getStatusStyle(item.status)]}>
                {getStatusLabel(item.status)}
              </Text>
            </View>

            <Text style={styles.cardTitle}>{item.title}</Text>
            <Text style={styles.bodyText}>
              {item.time} -{" "}
              {item.durationMinutes > 0
                ? `${item.durationMinutes} min`
                : "kein Training"}
            </Text>
            <Text style={styles.metaText}>{item.type} · {item.intensity}</Text>

            {item.muscles.length > 0 ? (
              <View>
                <View style={styles.chipWrap}>
                  {item.muscles.map((muscle) => (
                    <Text style={styles.chip} key={muscle}>
                      {muscle}
                    </Text>
                  ))}
                </View>
                <View style={styles.actionRow}>
                  <TouchableOpacity
                    style={styles.secondaryAction}
                    onPress={() => onEditWorkout?.(item)}
                  >
                    <Text style={styles.secondaryActionText}>Bearbeiten</Text>
                  </TouchableOpacity>

                  {item.status !== "erledigt" && (
                    <TouchableOpacity
                      style={styles.doneAction}
                      onPress={() => onMarkDone?.(item)}
                    >
                      <Text style={styles.doneActionText}>Erledigt</Text>
                    </TouchableOpacity>
                  )}
                </View>
                <TouchableOpacity
                  style={styles.deleteAction}
                  onPress={() => onDeleteWorkout?.(item)}
                >
                  <Text style={styles.deleteActionText}>Training löschen</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                style={styles.planButton}
                onPress={() => onPlanDay?.(item)}
              >
                <Text style={styles.planButtonText}>Training planen</Text>
              </TouchableOpacity>
            )}
          </View>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  weekRow: {
    gap: 12,
    paddingRight: 20,
  },
  dayCard: {
    backgroundColor: "#111716",
    borderRadius: 8,
    borderWidth: 1,
    minHeight: 214,
    padding: 16,
    width: 224,
  },
  doneCard: {
    borderColor: "rgba(124,255,107,0.42)",
  },
  plannedCard: {
    borderColor: "rgba(68,215,255,0.34)",
  },
  missedCard: {
    borderColor: "rgba(255,176,32,0.55)",
  },
  restCard: {
    borderColor: "rgba(255,255,255,0.08)",
  },
  dayHeader: {
    alignItems: "flex-start",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 18,
  },
  dayText: {
    color: "#F4F7F5",
    fontSize: 18,
    fontWeight: "900",
  },
  mutedText: {
    color: "#8D9A95",
    fontSize: 13,
  },
  statusPill: {
    borderRadius: 999,
    color: "#DCE5E1",
    fontSize: 11,
    fontWeight: "900",
    overflow: "hidden",
    paddingHorizontal: 9,
    paddingVertical: 6,
  },
  cardTitle: {
    color: "#F4F7F5",
    fontSize: 17,
    fontWeight: "900",
    marginBottom: 7,
  },
  bodyText: {
    color: "#B9C4BF",
    fontSize: 14,
    lineHeight: 20,
  },
  metaText: {
    color: "#8D9A95",
    fontSize: 13,
    marginTop: 6,
  },
  chipWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 7,
    marginTop: 16,
  },
  chip: {
    backgroundColor: "#25302D",
    borderRadius: 999,
    color: "#DCE5E1",
    fontSize: 12,
    overflow: "hidden",
    paddingHorizontal: 9,
    paddingVertical: 6,
  },
  actionRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 16,
  },
  secondaryAction: {
    alignItems: "center",
    backgroundColor: "#18201E",
    borderRadius: 8,
    flex: 1,
    minHeight: 42,
    justifyContent: "center",
  },
  secondaryActionText: {
    color: "#DCE5E1",
    fontSize: 12,
    fontWeight: "900",
  },
  doneAction: {
    alignItems: "center",
    backgroundColor: "#7CFF6B",
    borderRadius: 8,
    flex: 1,
    minHeight: 42,
    justifyContent: "center",
  },
  doneActionText: {
    color: "#0B0F0E",
    fontSize: 12,
    fontWeight: "900",
  },
  deleteAction: {
    alignItems: "center",
    borderColor: "rgba(255,90,95,0.38)",
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 8,
    minHeight: 40,
    justifyContent: "center",
  },
  deleteActionText: {
    color: "#FF9A9D",
    fontSize: 12,
    fontWeight: "900",
  },
  planButton: {
    alignItems: "center",
    backgroundColor: "#18201E",
    borderRadius: 8,
    marginTop: 18,
    minHeight: 44,
    justifyContent: "center",
    paddingHorizontal: 12,
  },
  planButtonText: {
    color: "#7CFF6B",
    fontSize: 13,
    fontWeight: "900",
  },
});
