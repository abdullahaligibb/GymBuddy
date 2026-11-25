import { useState } from "react";
import { Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import type { Exercise, WorkoutDay, WorkoutExercise } from "../types";
import { exercises as defaultCatalog } from "../data/exercises";
import { addExerciseDraft, ExerciseDraft, moveExercise, toExerciseDraft, validateExerciseDrafts } from "../domain/workoutExercises";
import { ExerciseLibrary } from "./ExerciseLibrary";

type Props = { workout: WorkoutDay; exercises?: readonly Exercise[]; onSave: (exercises: WorkoutExercise[]) => void | Promise<void>; onClose: () => void };
/** Mount per selected workout. Data is a draft until onSave resolves successfully. */
export function WorkoutExerciseEditor({ workout, exercises = defaultCatalog, onSave, onClose }: Props) {
  const [initial] = useState(() => (workout.exercises ?? []).map(toExerciseDraft));
  const [draft, setDraft] = useState<ExerciseDraft[]>(initial);
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [message, setMessage] = useState(""); const [saving, setSaving] = useState(false); const [confirmDiscard, setConfirmDiscard] = useState(false);
  const dirty = JSON.stringify(draft) !== JSON.stringify(initial);
  const editable = workout.type !== "Rest Day" && workout.status !== "ruhe";
  const names = new Map(exercises.map((x) => [x.id, x.name]));
  function close() { if (saving) return; if (dirty) setConfirmDiscard(true); else onClose(); }
  function change(index: number, field: keyof Omit<ExerciseDraft, "exerciseId">, value: string) {
    setDraft((items) => items.map((item, i) => i === index ? { ...item, [field]: value } : item)); setMessage("");
  }
  async function save() {
    if (saving || !editable) return;
    const result = validateExerciseDrafts(draft, exercises); setErrors(result.errors); setMessage("");
    if (!result.value) return;
    setSaving(true);
    try { await onSave(result.value); onClose(); }
    catch { setMessage("Die Übungen konnten nicht gespeichert werden. Deine Eingaben bleiben erhalten. Bitte erneut versuchen."); }
    finally { setSaving(false); }
  }
  return <Modal visible animationType="slide" onRequestClose={close}>
    <View style={s.root}>
      <View style={s.header}><View style={s.heading}><Text style={s.title}>Trainingsübungen</Text><Text style={s.body}>{workout.title} · {workout.date}</Text></View><Button label="Schliessen" onPress={close} disabled={saving} /></View>
      <ScrollView contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">
        {!editable ? <Text accessibilityRole="alert" style={s.error}>Für einen Ruhetag können keine Übungen gespeichert werden.</Text> : null}
        {confirmDiscard ? <View style={s.card}><Text style={s.body}>Ungespeicherte Änderungen verwerfen?</Text><View style={s.row}><Button label="Weiter bearbeiten" onPress={() => setConfirmDiscard(false)} /><Button label="Verwerfen" onPress={onClose} /></View></View> : null}
        {message ? <Text accessibilityRole="alert" style={s.error}>{message}</Text> : null}
        <Text style={s.title}>Ausgewählte Übungen ({draft.length})</Text>
        {!draft.length ? <Text style={s.body}>Noch keine Übungen ausgewählt. Füge unten eine Übung hinzu.</Text> : null}
        {draft.map((item, index) => <View key={item.exerciseId} style={s.card}>
          <Text style={s.subtitle}>{index + 1}. {names.get(item.exerciseId) ?? "Übung nicht im geladenen Katalog"}</Text>
          <View style={s.row}><Button label="Nach oben" accessibilityLabel={`${names.get(item.exerciseId) ?? "Übung"} nach oben`} disabled={saving || index === 0} onPress={() => setDraft((items) => moveExercise(items, index, -1))} /><Button label="Nach unten" accessibilityLabel={`${names.get(item.exerciseId) ?? "Übung"} nach unten`} disabled={saving || index === draft.length - 1} onPress={() => setDraft((items) => moveExercise(items, index, 1))} /><Button label="Entfernen" accessibilityLabel={`${names.get(item.exerciseId) ?? "Übung"} entfernen`} disabled={saving} onPress={() => setDraft((items) => items.filter((_, i) => i !== index))} /></View>
          {([['sets', 'Sätze', 'numeric'], ['repetitions', 'Wiederholungen oder Zeit', 'default'], ['weightKg', 'Gewicht in kg optional', 'decimal-pad'], ['restSeconds', 'Pause in Sekunden optional', 'numeric'], ['notes', 'Notizen optional', 'default']] as const).map(([field, label, keyboardType]) => <View key={field}><Text style={s.label}>{label}</Text><TextInput accessibilityLabel={`${names.get(item.exerciseId) ?? item.exerciseId}: ${label}`} value={item[field]} onChangeText={(value) => change(index, field, value)} keyboardType={keyboardType} editable={!saving && editable} style={s.input} /></View>)}
          {errors[item.exerciseId]?.map((error) => <Text accessibilityRole="alert" key={error} style={s.error}>{error}</Text>)}
        </View>)}
        {editable ? <><Text style={s.title}>Übungen hinzufügen</Text><ExerciseLibrary exercises={exercises} selectedExerciseIds={draft.map((x) => x.exerciseId)} onSelect={saving ? undefined : (exercise) => { setDraft((items) => addExerciseDraft(items, exercise)); setErrors({}); setMessage(""); }} /></> : null}
      </ScrollView>
      <View style={s.footer}><Text style={s.body}>{dirty ? "Ungespeicherte Änderungen" : "Keine Änderungen"}</Text><Button label={saving ? "Wird gespeichert …" : "Übungen speichern"} disabled={saving || !editable} onPress={save} /></View>
    </View>
  </Modal>;
}
function Button({ label, onPress, disabled = false, accessibilityLabel }: { label: string; onPress: () => void; disabled?: boolean; accessibilityLabel?: string }) {
  return <TouchableOpacity accessibilityRole="button" accessibilityLabel={accessibilityLabel ?? label} accessibilityState={{ disabled }} disabled={disabled} onPress={onPress} style={[s.button, disabled && s.disabled]}><Text style={s.buttonText}>{label}</Text></TouchableOpacity>;
}
const s = StyleSheet.create({ root: { flex: 1, backgroundColor: '#0b100f', paddingTop: 32 }, header: { padding: 16, flexDirection: 'row', gap: 10, alignItems: 'center' }, heading: { flex: 1 }, content: { padding: 16, paddingBottom: 36, gap: 16 }, title: { color: '#F4F7F5', fontSize: 20, fontWeight: '800' }, subtitle: { color: '#F4F7F5', fontSize: 17, fontWeight: '700' }, body: { color: '#B9C4BF', fontSize: 14, lineHeight: 21 }, label: { color: '#B9C4BF', fontSize: 13, marginTop: 8, marginBottom: 4 }, card: { backgroundColor: '#151d1a', padding: 14, borderRadius: 10, gap: 8 }, row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 }, input: { backgroundColor: '#0b100f', color: '#fff', borderWidth: 1, borderColor: '#45554c', borderRadius: 6, padding: 12, minHeight: 44 }, button: { backgroundColor: '#25372b', borderRadius: 7, padding: 11, minHeight: 44, justifyContent: 'center' }, buttonText: { color: '#a4ff89', fontWeight: '700', fontSize: 13 }, disabled: { opacity: .4 }, error: { color: '#ffb5a5', fontSize: 14, lineHeight: 21 }, footer: { padding: 16, gap: 8, borderTopWidth: 1, borderColor: '#354139' } });
