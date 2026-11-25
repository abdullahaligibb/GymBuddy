import { StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import type { Exercise } from "../types";
import { addExerciseDraft, ExerciseDraft, moveExercise } from "../domain/workoutExercises";
import { ExerciseLibrary } from "./ExerciseLibrary";

type Props = {
  value: ExerciseDraft[];
  catalog: readonly Exercise[];
  onChange: (value: ExerciseDraft[]) => void;
  errors?: Record<string, string[]>;
  disabled?: boolean;
};

export function ExerciseDraftList({ value, catalog, onChange, errors = {}, disabled = false }: Props) {
  const names = new Map(catalog.map((exercise) => [exercise.id, exercise.name]));
  function change(index: number, field: keyof Omit<ExerciseDraft, "exerciseId">, text: string) {
    onChange(value.map((row, i) => i === index ? { ...row, [field]: text } : row));
  }
  return <View style={s.list}>
    <Text style={s.title}>Ausgewählte Übungen ({value.length})</Text>
    {!value.length ? <Text style={s.body}>Noch keine Übungen ausgewählt. Füge unten eine Übung hinzu.</Text> : null}
    {value.map((row, index) => {
      const name = names.get(row.exerciseId) ?? "Übung nicht im geladenen Katalog";
      return <View key={`${row.exerciseId}-${index}`} style={s.card}>
        <Text style={s.title}>{index + 1}. {name}</Text>
        <View style={s.actions}>
          <Action label="Nach oben" name={`${name} nach oben`} disabled={disabled || index === 0} onPress={() => onChange(moveExercise(value, index, -1))} />
          <Action label="Nach unten" name={`${name} nach unten`} disabled={disabled || index === value.length - 1} onPress={() => onChange(moveExercise(value, index, 1))} />
          <Action label="Entfernen" name={`${name} entfernen`} disabled={disabled} onPress={() => onChange(value.filter((_, i) => i !== index))} />
        </View>
        {([
          ["sets", "Sätze", "numeric"],
          ["repetitions", "Wiederholungen oder Zeit", "default"],
          ["weightKg", "Gewicht in kg optional", "decimal-pad"],
          ["restSeconds", "Pause in Sekunden optional", "numeric"],
          ["notes", "Notizen optional", "default"],
        ] as const).map(([field, label, keyboardType]) => <View key={field}>
          <Text style={s.body}>{label}</Text>
          <TextInput accessibilityLabel={`${name}: ${label}`} value={row[field]} onChangeText={(text) => change(index, field, text)} keyboardType={keyboardType} editable={!disabled} style={s.input} />
        </View>)}
        {errors[row.exerciseId]?.map((error) => <Text accessibilityRole="alert" key={error} style={s.error}>{error}</Text>)}
      </View>;
    })}
    <Text style={s.title}>Übungen hinzufügen</Text>
    <ExerciseLibrary exercises={catalog} selectedExerciseIds={value.map((row) => row.exerciseId)} onSelect={disabled ? undefined : (exercise) => onChange(addExerciseDraft(value, exercise))} />
  </View>;
}

function Action({ label, name, disabled, onPress }: { label: string; name: string; disabled: boolean; onPress: () => void }) {
  return <TouchableOpacity accessibilityRole="button" accessibilityLabel={name} accessibilityState={{ disabled }} disabled={disabled} onPress={onPress} style={[s.button, disabled && { opacity: 0.4 }]}><Text style={s.buttonText}>{label}</Text></TouchableOpacity>;
}

const s = StyleSheet.create({
  list: { gap: 16 }, card: { gap: 10, padding: 14, backgroundColor: "#151D1A", borderRadius: 10 },
  title: { color: "#F4F7F5", fontSize: 17, fontWeight: "800" }, body: { color: "#B9C4BF", lineHeight: 21 },
  actions: { flexDirection: "row", flexWrap: "wrap", gap: 8 }, input: { color: "#FFF", backgroundColor: "#0B100F", borderColor: "#45554C", borderWidth: 1, borderRadius: 6, padding: 12, minHeight: 44 },
  button: { minHeight: 44, justifyContent: "center", borderRadius: 7, backgroundColor: "#25372B", padding: 11 }, buttonText: { color: "#A4FF89", fontWeight: "700" }, error: { color: "#FFB5A5", lineHeight: 21 },
});
