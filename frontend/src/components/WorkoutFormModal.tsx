import { useEffect, useState } from "react";
import { KeyboardAvoidingView, Modal, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";

import { isFutureDate } from "../domain/calendar";
import { hasValidationErrors, validateRestDay, validateWorkoutDraft } from "../domain/workoutForm";
import { WorkoutDay, WorkoutFocus, WorkoutIntensity, WorkoutStatus, WorkoutType } from "../types";

type Props = { visible: boolean; dayTemplates: WorkoutDay[]; selectedDay?: WorkoutDay; onClose: () => void; onSubmit: (workout: WorkoutDay) => void };
const workoutTypes: Exclude<WorkoutType, "Rest Day">[] = ["Push", "Pull", "Legs", "Full Body", "Upper Body", "Lower Body", "Cardio", "Mobility"];
const intensities: WorkoutIntensity[] = ["Leicht", "Mittel", "Schwer"];
const statuses: Exclude<WorkoutStatus, "ruhe" | "ungeplant">[] = ["geplant", "erledigt", "verpasst"];
const muscles: WorkoutFocus[] = ["Brust", "Rücken", "Beine", "Schulter", "Bizeps", "Trizeps", "Bauch", "Waden", "Cardio"];

export function WorkoutFormModal({ visible, dayTemplates, selectedDay, onClose, onSubmit }: Props) {
  const fallback = selectedDay ?? dayTemplates[0];
  const [dayId, setDayId] = useState(fallback?.id ?? "");
  const [mode, setMode] = useState<"training" | "rest">("training");
  const [title, setTitle] = useState("");
  const [time, setTime] = useState("18:00");
  const [duration, setDuration] = useState("60");
  const [type, setType] = useState<Exclude<WorkoutType, "Rest Day">>("Push");
  const [intensity, setIntensity] = useState<WorkoutIntensity>("Mittel");
  const [status, setStatus] = useState<Exclude<WorkoutStatus, "ruhe" | "ungeplant">>("geplant");
  const [selectedMuscles, setSelectedMuscles] = useState<WorkoutFocus[]>(["Brust"]);
  const [notes, setNotes] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!visible || !fallback) return;
    const rest = fallback.status === "ruhe" && fallback.title !== "Noch kein Training";
    setDayId(fallback.id); setMode(rest ? "rest" : "training");
    setTitle(fallback.status === "ungeplant" || fallback.title === "Noch kein Training" ? "" : fallback.title);
    setTime(fallback.time === "-" ? "18:00" : fallback.time);
    setDuration(fallback.durationMinutes ? String(fallback.durationMinutes) : "60");
    setType(fallback.type === "Rest Day" ? "Push" : fallback.type);
    setIntensity(fallback.intensity);
    setStatus(fallback.status === "erledigt" || fallback.status === "verpasst" ? fallback.status : "geplant");
    setSelectedMuscles(fallback.muscles.filter((item) => item !== "Regeneration").length ? fallback.muscles.filter((item) => item !== "Regeneration") : ["Brust"]);
    setNotes(fallback.notes ?? ""); setErrors({});
  }, [fallback, visible]);

  const target = dayTemplates.find((day) => day.id === dayId) ?? fallback;
  function submit() {
    if (!target) return;
    const nextErrors = mode === "rest"
      ? (validateRestDay(target.dateIso, "ruhe") ? {} : { dateIso: "Bitte einen gültigen Tag auswählen." })
      : validateWorkoutDraft({ dateIso: target.dateIso, title, time, duration, type, muscles: selectedMuscles, intensity, status, notes });
    setErrors(nextErrors);
    if (hasValidationErrors(nextErrors)) return;
    onSubmit(mode === "rest" ? { ...target, title: "Ruhetag", time: "-", durationMinutes: 0, type: "Rest Day", muscles: ["Regeneration"], intensity: "Leicht", status: "ruhe", notes: notes.trim(), exercises: undefined, sourceTemplateId: undefined } : { ...target, title: title.trim(), time: time.trim(), durationMinutes: Number(duration), type, muscles: selectedMuscles, intensity, status, notes: notes.trim(), exercises: target.dateIso === selectedDay?.dateIso ? selectedDay.exercises : undefined, sourceTemplateId: target.dateIso === selectedDay?.dateIso ? selectedDay.sourceTemplateId : undefined });
  }
  function toggleMuscle(value: WorkoutFocus) { setSelectedMuscles((current) => current.includes(value) ? current.filter((item) => item !== value) : [...current, value]); }
  return <Modal animationType="slide" transparent visible={visible} onRequestClose={onClose}>
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.overlay}><View style={styles.sheet}>
      <View style={styles.header}><View><Text style={styles.eyebrow}>{selectedDay?.status !== "ungeplant" ? "Eintrag bearbeiten" : "Eintrag planen"}</Text><Text style={styles.title}>Training & Ruhetag</Text></View><TouchableOpacity style={styles.close} onPress={onClose}><Text style={styles.closeText}>Schliessen</Text></TouchableOpacity></View>
      <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <Label text="Eintrag"/><View style={styles.row}><Chip label="Training" active={mode === "training"} onPress={() => setMode("training")}/><Chip label="Ruhetag" active={mode === "rest"} onPress={() => setMode("rest")}/></View>
        <Label text="Tag"/><View style={styles.row}>{dayTemplates.map((day) => <Chip key={day.id} label={`${day.day} ${day.date}`} active={day.id === dayId} onPress={() => { setDayId(day.id); setErrors({}); }}/>)}</View>
        {mode === "training" ? <>
          <Label text="Trainingstitel *"/><Input value={title} onChangeText={setTitle} placeholder="z.B. Push Day" error={errors.title}/>
          <View style={styles.grid}><View style={styles.column}><Label text="Uhrzeit *"/><Input value={time} onChangeText={setTime} placeholder="18:30" error={errors.time}/></View><View style={styles.column}><Label text="Dauer in Minuten *"/><Input value={duration} onChangeText={setDuration} placeholder="60" keyboardType="number-pad" error={errors.duration}/></View></View>
          <Label text="Trainingsart"/><View style={styles.row}>{workoutTypes.map((value) => <Chip key={value} label={value} active={type === value} onPress={() => setType(value)}/>)}</View>
          <Label text="Intensität"/><View style={styles.row}>{intensities.map((value) => <Chip key={value} label={value} active={intensity === value} onPress={() => setIntensity(value)}/>)}</View>
          <Label text="Status"/><View style={styles.row}>{statuses.map((value) => <Chip key={value} label={value[0].toUpperCase() + value.slice(1)} active={status === value} disabled={isFutureDate(target?.dateIso ?? "") && value !== "geplant"} onPress={() => setStatus(value)}/>)}</View>{errors.status ? <Text style={styles.error}>{errors.status}</Text> : null}
          <Label text="Muskelgruppen *"/><View style={styles.row}>{muscles.map((value) => <Chip key={value} label={value} active={selectedMuscles.includes(value)} onPress={() => toggleMuscle(value)}/>)}</View>{errors.muscles ? <Text style={styles.error}>{errors.muscles}</Text> : null}
        </> : <Text style={styles.hint}>Der Tag wird als Regenerationstag gespeichert. Ein bestehendes Training wird erst nach deiner Bestätigung ersetzt.</Text>}
        <Label text="Notizen"/><TextInput multiline value={notes} onChangeText={setNotes} placeholder="Optional" placeholderTextColor="#66736E" style={[styles.input, styles.notes]}/>
        <TouchableOpacity style={styles.save} onPress={submit}><Text style={styles.saveText}>{mode === "rest" ? "Ruhetag speichern" : "Training speichern"}</Text></TouchableOpacity>
      </ScrollView>
    </View></KeyboardAvoidingView>
  </Modal>;
}
function Label({ text }: { text: string }) { return <Text style={styles.label}>{text}</Text>; }
function Input({ error, ...props }: React.ComponentProps<typeof TextInput> & { error?: string }) { return <View><TextInput {...props} placeholderTextColor="#66736E" style={[styles.input, error ? styles.inputError : null]}/>{error ? <Text style={styles.error}>{error}</Text> : null}</View>; }
function Chip({ label, active, disabled, onPress }: { label: string; active: boolean; disabled?: boolean; onPress: () => void }) { return <TouchableOpacity disabled={disabled} onPress={onPress} style={[styles.chip, active && styles.activeChip, disabled && styles.disabled]}><Text style={[styles.chipText, active && styles.activeChipText]}>{label}</Text></TouchableOpacity>; }
const styles = StyleSheet.create({ overlay:{backgroundColor:"rgba(0,0,0,0.68)",flex:1,justifyContent:"flex-end"},sheet:{backgroundColor:"#0F1514",borderTopLeftRadius:18,borderTopRightRadius:18,maxHeight:"94%",padding:20},header:{alignItems:"flex-start",flexDirection:"row",justifyContent:"space-between",marginBottom:8},eyebrow:{color:"#8D9A95",fontSize:12,fontWeight:"800",textTransform:"uppercase"},title:{color:"#F4F7F5",fontSize:23,fontWeight:"900",marginTop:5},close:{backgroundColor:"#18201E",borderRadius:8,minHeight:42,justifyContent:"center",paddingHorizontal:12},closeText:{color:"#DCE5E1",fontWeight:"800"},content:{paddingBottom:28},label:{color:"#DCE5E1",fontSize:13,fontWeight:"900",marginBottom:8,marginTop:15},row:{flexDirection:"row",flexWrap:"wrap",gap:8},grid:{flexDirection:"row",gap:10},column:{flex:1},chip:{alignItems:"center",backgroundColor:"#18201E",borderColor:"rgba(255,255,255,0.08)",borderRadius:8,borderWidth:1,justifyContent:"center",minHeight:42,paddingHorizontal:12},activeChip:{backgroundColor:"#7CFF6B",borderColor:"#7CFF6B"},chipText:{color:"#B9C4BF",fontSize:13,fontWeight:"800"},activeChipText:{color:"#0B0F0E"},disabled:{opacity:0.35},input:{backgroundColor:"#111716",borderColor:"rgba(255,255,255,0.1)",borderRadius:8,borderWidth:1,color:"#F4F7F5",fontSize:15,minHeight:48,paddingHorizontal:13,paddingVertical:11},inputError:{borderColor:"#FF7A7E"},error:{color:"#FF9A9D",fontSize:12,marginTop:5},notes:{minHeight:92,textAlignVertical:"top"},hint:{backgroundColor:"#18201E",borderRadius:8,color:"#B9C4BF",lineHeight:20,marginTop:14,padding:14},save:{alignItems:"center",backgroundColor:"#7CFF6B",borderRadius:8,justifyContent:"center",marginTop:22,minHeight:50},saveText:{color:"#0B0F0E",fontSize:15,fontWeight:"900"} });
