import { useState } from "react";
import { Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import type { Exercise, WorkoutFocus, WorkoutPlan } from "../types";
import { exercises as defaultCatalog } from "../data/exercises";
import { toPlanDraft, validatePlanDraft } from "../domain/workoutPlans";
import { ExerciseDraftList } from "./ExerciseDraftList";

type Props = {
  plans: WorkoutPlan[];
  exercises?: readonly Exercise[];
  onSave: (plan: WorkoutPlan) => void | Promise<void>;
  onDelete: (plan: WorkoutPlan) => void;
  onUse: (plan: WorkoutPlan) => void;
};

export function WorkoutPlanManager({ plans, exercises = defaultCatalog, onSave, onDelete, onUse }: Props) {
  const [editing, setEditing] = useState<WorkoutPlan>();
  const [creating, setCreating] = useState(false);
  function open(plan?: WorkoutPlan) {
    setEditing(plan ?? { id: `plan-${Date.now()}`, name: "", type: "Full Body", durationMinutes: 60, goal: "", difficulty: "Mittel", muscles: ["Ganzkörper"], exercises: [], isCustom: true });
    setCreating(!plan);
  }
  return <View>
    <Action label="+ Neuen Trainingsplan anlegen" onPress={() => open()} />
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.list}>
      {plans.map((plan) => <View key={plan.id} style={s.card}>
        <Text style={s.title}>{plan.name}</Text><Text style={s.body}>{plan.goal}</Text>
        <Text style={s.body}>{plan.durationMinutes} Min. · {plan.type} · {plan.exercises.length} Übungen</Text>
        <View style={s.row}><Action label="Bearbeiten" name={`${plan.name} bearbeiten`} onPress={() => open(plan)} /><Action label="Auswählen" name={`${plan.name} auswählen`} onPress={() => onUse(plan)} /></View>
        {plan.isCustom ? <Action label="Plan löschen" name={`${plan.name} löschen`} onPress={() => onDelete(plan)} /> : null}
      </View>)}
    </ScrollView>
    {editing ? <PlanModal key={editing.id} plan={editing} creating={creating} catalog={exercises} onClose={() => setEditing(undefined)} onSave={onSave} /> : null}
  </View>;
}

function PlanModal({ plan, creating, catalog, onClose, onSave }: { plan: WorkoutPlan; creating: boolean; catalog: readonly Exercise[]; onClose: () => void; onSave: Props["onSave"] }) {
  const [initial] = useState(() => toPlanDraft(plan));
  const [draft, setDraft] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [discard, setDiscard] = useState(false);
  const dirty = JSON.stringify(initial) !== JSON.stringify(draft);
  function close() { if (!saving) { if (dirty) setDiscard(true); else onClose(); } }
  async function save() {
    if (saving) return;
    const result = validatePlanDraft(draft, catalog);
    setErrors(result.errors); setMessage(result.message ?? "");
    if (!result.value) return;
    setSaving(true);
    try { await onSave(result.value); onClose(); }
    catch { setMessage("Speichern fehlgeschlagen. Deine Eingaben bleiben erhalten."); }
    finally { setSaving(false); }
  }
  const muscleOptions: WorkoutFocus[] = ["Brust", "Rücken", "Beine", "Schulter", "Bizeps", "Trizeps", "Bauch", "Waden", "Gesäß", "Ganzkörper", "Cardio"];
  return <Modal animationType="slide" transparent visible onRequestClose={close}>
    <View style={s.overlay}><View style={s.sheet}>
      <View style={s.row}><Text style={s.title}>{creating ? "Trainingsplan anlegen" : "Trainingsplan bearbeiten"}</Text><Action label="Schliessen" disabled={saving} onPress={close} /></View>
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={s.content}>
        {discard ? <View style={s.notice}><Text style={s.body}>Ungespeicherte Planänderungen verwerfen?</Text><Action label="Weiter bearbeiten" onPress={() => setDiscard(false)} /><Action label="Planänderungen verwerfen" onPress={onClose} /></View> : null}
        <Field label="Planname" value={draft.name} disabled={saving} onChange={(name) => setDraft({ ...draft, name })} />
        <Field label="Planziel" value={draft.goal} disabled={saving} onChange={(goal) => setDraft({ ...draft, goal })} />
        <Field label="Plandauer in Minuten" value={draft.duration} disabled={saving} onChange={(duration) => setDraft({ ...draft, duration })} />
        <Text style={s.label}>Trainingsart</Text><View style={s.row}>{(["Push", "Pull", "Legs", "Full Body", "Upper Body", "Lower Body", "Cardio"] as const).map((type) => <Action key={type} label={type} name={`Planart ${type}`} selected={draft.type === type} disabled={saving} onPress={() => setDraft({ ...draft, type })} />)}</View>
        <Text style={s.label}>Intensität</Text><View style={s.row}>{(["Leicht", "Mittel", "Schwer"] as const).map((difficulty) => <Action key={difficulty} label={difficulty} name={`Planintensität ${difficulty}`} selected={draft.difficulty === difficulty} disabled={saving} onPress={() => setDraft({ ...draft, difficulty })} />)}</View>
        <Text style={s.label}>Muskelgruppen</Text><View style={s.row}>{muscleOptions.map((muscle) => <Action key={muscle} label={muscle} name={`Planmuskel ${muscle}`} selected={draft.muscles.includes(muscle)} disabled={saving} onPress={() => setDraft({ ...draft, muscles: draft.muscles.includes(muscle) ? draft.muscles.filter((item) => item !== muscle) : [...draft.muscles, muscle] })} />)}</View>
        <ExerciseDraftList value={draft.exercises} catalog={catalog} errors={errors} disabled={saving} onChange={(exercises) => { setDraft({ ...draft, exercises }); setErrors({}); setMessage(""); }} />
        {message ? <Text accessibilityRole="alert" style={s.error}>{message}</Text> : null}
        <Action label={saving ? "Wird gespeichert …" : "Plan speichern"} disabled={saving} onPress={save} />
      </ScrollView>
    </View></View>
  </Modal>;
}

function Field({ label, value, disabled, onChange }: { label: string; value: string; disabled: boolean; onChange: (value: string) => void }) {
  return <View><Text style={s.label}>{label}</Text><TextInput accessibilityLabel={label} editable={!disabled} style={s.input} value={value} onChangeText={onChange} /></View>;
}
function Action({ label, name = label, selected, disabled = false, onPress }: { label: string; name?: string; selected?: boolean; disabled?: boolean; onPress: () => void }) {
  return <TouchableOpacity accessibilityRole="button" accessibilityLabel={name} accessibilityState={{ disabled, ...(selected === undefined ? {} : { selected }) }} disabled={disabled} onPress={onPress} style={[s.button, selected && s.selected, disabled && { opacity: 0.4 }]}><Text style={[s.buttonText, selected && { color: "#0B100F" }]}>{label}</Text></TouchableOpacity>;
}
const s = StyleSheet.create({
  list: { gap: 12, paddingVertical: 12 }, card: { backgroundColor: "#111716", borderRadius: 10, padding: 16, width: 300, gap: 12 }, title: { color: "#F4F7F5", fontSize: 20, fontWeight: "800", flexShrink: 1 },
  body: { color: "#B9C4BF", lineHeight: 21 }, row: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: 8 }, button: { backgroundColor: "#25372B", padding: 12, minHeight: 44, borderRadius: 8, justifyContent: "center" }, buttonText: { color: "#A4FF89", fontWeight: "800" }, selected: { backgroundColor: "#7CFF6B" },
  overlay: { backgroundColor: "rgba(0,0,0,.68)", flex: 1, justifyContent: "flex-end" }, sheet: { backgroundColor: "#0F1514", borderTopLeftRadius: 18, borderTopRightRadius: 18, maxHeight: "94%", padding: 20 }, content: { gap: 14, paddingBottom: 30 }, label: { color: "#DCE5E1", fontWeight: "800", marginVertical: 8 }, input: { backgroundColor: "#111716", borderColor: "#45554C", borderWidth: 1, borderRadius: 8, color: "#FFF", minHeight: 48, padding: 12 }, error: { color: "#FFB5A5", lineHeight: 21 }, notice: { gap: 10, paddingVertical: 12 },
});
