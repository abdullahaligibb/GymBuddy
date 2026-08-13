import { useMemo, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { exercises } from "../data/exercises";
import {
  ExerciseDifficulty,
  ExerciseEquipment,
  MuscleGroup,
} from "../types";

const ALL_FILTER = "Alle";

const muscleOptions = [
  ALL_FILTER,
  ...Array.from(new Set(exercises.map((exercise) => exercise.muscle))).sort(),
] as const;
const equipmentOptions = [
  ALL_FILTER,
  ...Array.from(new Set(exercises.map((exercise) => exercise.equipment))).sort(),
] as const;
const difficultyOptions = [
  ALL_FILTER,
  "Einsteiger",
  "Mittel",
  "Fortgeschritten",
] as const;

type AllFilter = typeof ALL_FILTER;

export function ExerciseLibrary() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedMuscle, setSelectedMuscle] = useState<
    MuscleGroup | AllFilter
  >(ALL_FILTER);
  const [selectedEquipment, setSelectedEquipment] = useState<
    ExerciseEquipment | AllFilter
  >(ALL_FILTER);
  const [selectedDifficulty, setSelectedDifficulty] = useState<
    ExerciseDifficulty | AllFilter
  >(ALL_FILTER);
  const [expandedExerciseId, setExpandedExerciseId] = useState<string | null>(
    null,
  );

  const filteredExercises = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLocaleLowerCase("de-DE");

    return exercises.filter((exercise) => {
      const matchesSearch = exercise.name
        .toLocaleLowerCase("de-DE")
        .includes(normalizedSearch);
      const matchesMuscle =
        selectedMuscle === ALL_FILTER || exercise.muscle === selectedMuscle;
      const matchesEquipment =
        selectedEquipment === ALL_FILTER ||
        exercise.equipment === selectedEquipment;
      const matchesDifficulty =
        selectedDifficulty === ALL_FILTER ||
        exercise.level === selectedDifficulty;

      return (
        matchesSearch &&
        matchesMuscle &&
        matchesEquipment &&
        matchesDifficulty
      );
    });
  }, [
    searchTerm,
    selectedDifficulty,
    selectedEquipment,
    selectedMuscle,
  ]);

  function resetFilters() {
    setSearchTerm("");
    setSelectedMuscle(ALL_FILTER);
    setSelectedEquipment(ALL_FILTER);
    setSelectedDifficulty(ALL_FILTER);
  }

  return (
    <View>
      <TextInput
        accessibilityLabel="Übungen durchsuchen"
        autoCapitalize="none"
        autoCorrect={false}
        clearButtonMode="while-editing"
        onChangeText={setSearchTerm}
        placeholder="Übung suchen …"
        placeholderTextColor="#65716C"
        returnKeyType="search"
        style={styles.searchInput}
        value={searchTerm}
      />

      <FilterRow
        label="Muskelgruppe"
        onSelect={setSelectedMuscle}
        options={muscleOptions}
        selected={selectedMuscle}
      />
      <FilterRow
        label="Equipment"
        onSelect={setSelectedEquipment}
        options={equipmentOptions}
        selected={selectedEquipment}
      />
      <FilterRow
        label="Schwierigkeit"
        onSelect={setSelectedDifficulty}
        options={difficultyOptions}
        selected={selectedDifficulty}
      />

      <View style={styles.resultRow}>
        <Text style={styles.resultText}>
          {filteredExercises.length} von {exercises.length} Übungen
        </Text>
        <TouchableOpacity onPress={resetFilters}>
          <Text style={styles.resetText}>Filter zurücksetzen</Text>
        </TouchableOpacity>
      </View>

      {filteredExercises.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>Keine Übung gefunden</Text>
          <Text style={styles.bodyText}>
            Passe deine Suche oder die ausgewählten Filter an.
          </Text>
        </View>
      ) : (
        <View style={styles.exerciseList}>
          {filteredExercises.map((exercise) => {
            const isExpanded = expandedExerciseId === exercise.id;

            return (
              <View style={styles.exerciseCard} key={exercise.id}>
                <TouchableOpacity
                  accessibilityRole="button"
                  accessibilityState={{ expanded: isExpanded }}
                  onPress={() =>
                    setExpandedExerciseId(isExpanded ? null : exercise.id)
                  }
                  style={styles.cardHeader}
                >
                  <View style={styles.cardHeading}>
                    <Text style={styles.cardTitle}>{exercise.name}</Text>
                    <Text style={styles.bodyText}>
                      {exercise.equipment} · {exercise.level}
                    </Text>
                  </View>
                  <View style={styles.cardMeta}>
                    <Text style={styles.exerciseMuscle}>{exercise.muscle}</Text>
                    <Text style={styles.expandIcon}>{isExpanded ? "−" : "+"}</Text>
                  </View>
                </TouchableOpacity>

                {isExpanded && (
                  <View style={styles.details}>
                    <Text style={styles.description}>{exercise.description}</Text>
                    <DetailRow
                      label="Empfehlung"
                      text={`${exercise.recommendedSets} Sätze · ${exercise.recommendedRepetitions} Wdh.`}
                    />
                    <DetailRow
                      label="Häufiger Fehler"
                      text={exercise.commonMistake}
                    />
                    <DetailRow label="Sicherheit" text={exercise.safetyNote} />
                  </View>
                )}
              </View>
            );
          })}
        </View>
      )}
    </View>
  );
}

type FilterRowProps<T extends string> = {
  label: string;
  options: readonly T[];
  selected: T;
  onSelect: (option: T) => void;
};

function FilterRow<T extends string>({
  label,
  options,
  selected,
  onSelect,
}: FilterRowProps<T>) {
  return (
    <View style={styles.filterGroup}>
      <Text style={styles.filterLabel}>{label}</Text>
      <ScrollView
        contentContainerStyle={styles.filterOptions}
        horizontal
        showsHorizontalScrollIndicator={false}
      >
        {options.map((option) => {
          const isSelected = option === selected;

          return (
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityState={{ selected: isSelected }}
              key={option}
              onPress={() => onSelect(option)}
              style={[styles.filterChip, isSelected && styles.activeFilterChip]}
            >
              <Text
                style={[
                  styles.filterChipText,
                  isSelected && styles.activeFilterChipText,
                ]}
              >
                {option}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

function DetailRow({ label, text }: { label: string; text: string }) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  searchInput: {
    backgroundColor: "#111716",
    borderColor: "rgba(255,255,255,0.12)",
    borderRadius: 8,
    borderWidth: 1,
    color: "#F4F7F5",
    fontSize: 15,
    marginBottom: 16,
    minHeight: 48,
    paddingHorizontal: 14,
  },
  filterGroup: {
    marginBottom: 14,
  },
  filterLabel: {
    color: "#B9C4BF",
    fontSize: 12,
    fontWeight: "800",
    marginBottom: 8,
    textTransform: "uppercase",
  },
  filterOptions: {
    gap: 8,
    paddingRight: 20,
  },
  filterChip: {
    backgroundColor: "#111716",
    borderColor: "rgba(255,255,255,0.08)",
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 13,
    paddingVertical: 9,
  },
  activeFilterChip: {
    backgroundColor: "#7CFF6B",
    borderColor: "#7CFF6B",
  },
  filterChipText: {
    color: "#B9C4BF",
    fontSize: 13,
    fontWeight: "700",
  },
  activeFilterChipText: {
    color: "#0B0F0E",
  },
  resultRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
    marginTop: 2,
  },
  resultText: {
    color: "#8D9A95",
    fontSize: 13,
  },
  resetText: {
    color: "#7CFF6B",
    fontSize: 13,
    fontWeight: "800",
  },
  exerciseList: {
    gap: 10,
  },
  exerciseCard: {
    backgroundColor: "#111716",
    borderColor: "rgba(255,255,255,0.08)",
    borderRadius: 8,
    borderWidth: 1,
    overflow: "hidden",
  },
  cardHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    minHeight: 78,
    padding: 16,
  },
  cardHeading: {
    flex: 1,
    paddingRight: 10,
  },
  cardTitle: {
    color: "#F4F7F5",
    fontSize: 17,
    fontWeight: "900",
    marginBottom: 7,
  },
  cardMeta: {
    alignItems: "center",
    flexDirection: "row",
    gap: 10,
  },
  exerciseMuscle: {
    backgroundColor: "#18201E",
    borderRadius: 999,
    color: "#7CFF6B",
    fontSize: 12,
    fontWeight: "800",
    overflow: "hidden",
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  expandIcon: {
    color: "#F4F7F5",
    fontSize: 22,
    fontWeight: "500",
    minWidth: 16,
    textAlign: "center",
  },
  details: {
    borderColor: "rgba(255,255,255,0.08)",
    borderTopWidth: 1,
    gap: 14,
    padding: 16,
    paddingTop: 15,
  },
  description: {
    color: "#F4F7F5",
    fontSize: 14,
    lineHeight: 21,
  },
  detailRow: {
    gap: 4,
  },
  detailLabel: {
    color: "#7CFF6B",
    fontSize: 12,
    fontWeight: "800",
    textTransform: "uppercase",
  },
  detailText: {
    color: "#B9C4BF",
    fontSize: 14,
    lineHeight: 20,
  },
  bodyText: {
    color: "#B9C4BF",
    fontSize: 14,
    lineHeight: 20,
  },
  emptyState: {
    alignItems: "center",
    backgroundColor: "#111716",
    borderColor: "rgba(255,255,255,0.08)",
    borderRadius: 8,
    borderWidth: 1,
    padding: 28,
  },
  emptyTitle: {
    color: "#F4F7F5",
    fontSize: 17,
    fontWeight: "900",
    marginBottom: 6,
  },
});
