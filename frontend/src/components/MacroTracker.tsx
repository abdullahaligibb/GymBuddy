import { useState } from "react";
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { addDays, parseIsoDate, toIsoDate } from "../domain/calendar";
import { calculateMacroTarget, parseMacroLog } from "../domain/macros";
import type { MacroDraft } from "../domain/macros";
import type { DailyMacroLog, HealthProfile, MacroValues } from "../types";
import { apiMessage } from "../services/api";
import { confirmAction } from "./feedback";

type Props = {
  profile: HealthProfile | null;
  target: MacroValues | null;
  logs: DailyMacroLog[];
  busy: boolean;
  onProfile: () => void;
  onSaveTarget: (target: MacroValues) => Promise<unknown>;
  onSaveLog: (log: DailyMacroLog) => Promise<unknown>;
  onDeleteLog: (day: string) => Promise<unknown>;
};

const fields = [
  ["protein", "Protein"], ["carbs", "Kohlenhydrate"], ["fat", "Fett"],
] as const;

export function MacroTracker({ profile, target, logs, busy, onProfile, onSaveTarget, onSaveLog, onDeleteLog }: Props) {
  const now = new Date();
  const today = toIsoDate(now);
  const [day, setDay] = useState(today);
  const [drafts, setDrafts] = useState<Record<string, MacroDraft>>({});
  const [error, setError] = useState("");
  const saved = logs.find((log) => log.dateIso === day);
  const draft = drafts[day] ?? {
    protein: saved ? String(saved.protein) : "",
    carbs: saved ? String(saved.carbs) : "",
    fat: saved ? String(saved.fat) : "",
  };
  const proposal = calculateMacroTarget(profile, now);
  const preview = parseMacroLog(day, draft, now);

  function clearDraft() {
    setDrafts((current) => {
      const remaining = { ...current };
      delete remaining[day];
      return remaining;
    });
  }

  function move(days: number) {
    setError("");
    setDay(toIsoDate(addDays(parseIsoDate(day), days)));
  }

  async function submit(request: () => Promise<unknown>, onSuccess?: () => void) {
    if (busy) return;
    setError("");
    try {
      await request();
      onSuccess?.();
    } catch (failure) {
      setError(apiMessage(failure));
    }
  }

  return <View style={styles.root}>
    <Text style={styles.heading}>Makroziele pro Tag</Text>
    {target ? <Totals values={target} /> : <Text style={styles.body}>Noch kein Makroziel gespeichert.</Text>}
    {proposal ? <Button label={target ? "Ziel aktualisieren" : "Ziel berechnen und speichern"}
      disabled={busy} onPress={() => submit(() => onSaveTarget(proposal))} /> : <>
      <Text style={styles.body}>Für eine Schätzung braucht es ein vollständiges Erwachsenenprofil mit Berechnungsvariante.</Text>
      <Button label="Zum Profil" disabled={busy} onPress={onProfile} />
    </>}

    <Text style={styles.heading}>Tagesprotokoll</Text>
    <View style={styles.dateRow}>
      <Button label="‹" accessibilityLabel="Vorheriger Tag" disabled={busy} onPress={() => move(-1)} />
      <Text style={styles.date}>{new Intl.DateTimeFormat("de-CH", { dateStyle: "medium" }).format(parseIsoDate(day))}</Text>
      <Button label="›" accessibilityLabel="Nächster Tag" disabled={busy || day >= today} onPress={() => move(1)} />
      <Button label="Heute" disabled={busy || day === today} onPress={() => { setError(""); setDay(today); }} />
    </View>
    {saved ? <Totals values={saved} /> : <Text style={styles.body}>Für diesen Tag gibt es noch keinen Eintrag.</Text>}
    <View style={styles.inputs}>
      {fields.map(([key, label]) => <View style={styles.field} key={key}>
        <Text style={[styles.body, styles.inputLabel]}>{label} (g)</Text>
        <TextInput accessibilityLabel={`${label} in Gramm`} value={draft[key]} keyboardType="number-pad"
          editable={!busy} maxLength={4} style={styles.input} onChangeText={(value) => {
            setError("");
            setDrafts((current) => ({ ...current, [day]: { ...draft, [key]: value } }));
          }} />
      </View>)}
    </View>
    {preview ? <Text style={styles.body}>Berechnete Energie: {preview.calories} kcal</Text> : null}
    {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}
    <View style={styles.dateRow}>
      <Button label={busy ? "Bitte warten …" : "Tageswerte speichern"} disabled={busy} onPress={() => {
        if (!preview) {
          setError("Für jedes Makro eine ganze Zahl zwischen 0 und 1000 g eingeben.");
          return;
        }
        void submit(() => onSaveLog(preview), clearDraft);
      }} />
      {saved ? <Button label="Eintrag löschen" disabled={busy} onPress={async () => {
        if (await confirmAction("Eintrag löschen?", "Die Tageswerte werden entfernt.", "Löschen")) {
          await submit(() => onDeleteLog(day), clearDraft);
        }
      }} /> : null}
    </View>
  </View>;
}

function Totals({ values }: { values: MacroValues }) {
  return <View style={styles.dateRow}>
    <Text style={styles.value}>{values.calories} kcal</Text>
    <Text style={styles.body}>Protein {values.protein} g</Text>
    <Text style={styles.body}>Kohlenhydrate {values.carbs} g</Text>
    <Text style={styles.body}>Fett {values.fat} g</Text>
  </View>;
}

function Button({ label, accessibilityLabel, disabled, onPress }: {
  label: string; accessibilityLabel?: string; disabled: boolean; onPress: () => void;
}) {
  return <TouchableOpacity accessibilityRole="button" accessibilityLabel={accessibilityLabel}
    disabled={disabled} style={[styles.button, disabled && styles.disabled]} onPress={onPress}>
    <Text style={styles.buttonText}>{label}</Text>
  </TouchableOpacity>;
}

const styles = StyleSheet.create({
  root: { gap: 12 },
  heading: { color: "#F4F7F5", fontSize: 21, fontWeight: "900", marginTop: 12 },
  body: { color: "#B9C4BF", fontSize: 14, lineHeight: 20 },
  value: { color: "#F4F7F5", fontWeight: "900", fontSize: 16 },
  dateRow: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: 9 },
  date: { color: "#F4F7F5", minWidth: 90, textAlign: "center" },
  inputs: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  field: { minWidth: 100, flex: 1, gap: 5 },
  inputLabel: { minHeight: 40 },
  input: { color: "#F4F7F5", borderColor: "#44534D", borderWidth: 1, backgroundColor: "#111716",
    paddingHorizontal: 10, minHeight: 44, borderRadius: 8 },
  button: { backgroundColor: "#18201E", borderRadius: 8, minWidth: 44, minHeight: 44,
    alignSelf: "flex-start", alignItems: "center", justifyContent: "center", paddingHorizontal: 12 },
  buttonText: { color: "#7CFF6B", fontWeight: "800" },
  disabled: { opacity: 0.45 },
  error: { color: "#FF9A9D" },
});
