import { useState } from "react";
import {
  Alert,
  Image,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { ExerciseLibrary } from "./src/components/ExerciseLibrary";
import { ProfileFormModal } from "./src/components/ProfileFormModal";
import { TemplateAdoptionModal } from "./src/components/TemplateAdoptionModal";
import { WorkoutDetailsModal } from "./src/components/WorkoutDetailsModal";
import { WorkoutFormModal } from "./src/components/WorkoutFormModal";
import { WorkoutExerciseEditor } from "./src/components/WorkoutExerciseEditor";
import { WorkoutPlanManager } from "./src/components/WorkoutPlanManager";
import { WeeklyCalendar } from "./src/components/WeeklyCalendar";
import { NutritionTipLibrary } from "./src/components/NutritionTipLibrary";
import { exercises } from "./src/data/exercises";
import { demoUser, initialHealthProfile, initialStreak } from "./src/data/profile";
import { workoutTemplates } from "./src/data/templates";
import { addDays, formatWeekRange, getWeekDays, isFutureDate, toIsoDate } from "./src/domain/calendar";
import { createWorkoutFromTemplate } from "./src/domain/workoutTemplates";
import { initialWorkouts } from "./src/data/workouts";
import { HealthProfile, WorkoutDay, WorkoutPlan, WorkoutStatus, WorkoutTemplate } from "./src/types";
import {
  calculateWorkoutWeekStats,
  formatGermanDate,
} from "./src/utils/workoutStats";

const gymBuddyLogo = require("./assets/logo-gymbuddy.png");

const tabs = ["Home", "Kalender", "Übungen", "Stats"];

export default function App() {
  const [workouts, setWorkouts] = useState<WorkoutDay[]>(initialWorkouts);
  const [weekAnchor, setWeekAnchor] = useState(new Date());
  const [profile, setProfile] = useState<HealthProfile>(initialHealthProfile);
  const [plans, setPlans] = useState<WorkoutPlan[]>(workoutTemplates);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [selectedDay, setSelectedDay] = useState<WorkoutDay | undefined>();
  const [exerciseDayId, setExerciseDayId] = useState<string>();
  const exerciseDay = workouts.find((day) => day.id === exerciseDayId);
  const [detailWorkout, setDetailWorkout] = useState<WorkoutDay | undefined>();
  const [templateToAdopt, setTemplateToAdopt] = useState<
    WorkoutTemplate | undefined
  >();

  const now = new Date();
  const todayIso = toIsoDate(now);
  const weekDays = getWeekDays(weekAnchor, workouts);

  function openWorkoutForm(day?: WorkoutDay) {
    setDetailWorkout(undefined);
    setSelectedDay(day ?? weekDays.find((item) => item.dateIso === todayIso) ?? weekDays[0]);
    setIsFormOpen(true);
  }

  function closeWorkoutForm() {
    setIsFormOpen(false);
    setSelectedDay(undefined);
  }

  function commitWorkout(workout: WorkoutDay) {
    setWorkouts((current) => [...current.filter((item) => item.dateIso !== workout.dateIso), workout]);
    closeWorkoutForm();
  }

  function saveWorkout(workout: WorkoutDay) {
    const existing = workouts.find((item) => item.dateIso === workout.dateIso);
    const replacesContent = existing && existing.status !== "ungeplant" && (existing.status !== workout.status || existing.title !== workout.title || existing.id !== selectedDay?.id);
    if (replacesContent) {
      Alert.alert("Eintrag ersetzen?", `Für ${existing.fullDay} besteht bereits «${existing.title}».`, [{ text: "Abbrechen", style: "cancel" }, { text: "Ersetzen", style: "destructive", onPress: () => commitWorkout(workout) }]);
      return;
    }
    commitWorkout(workout);
  }

  function changeStatus(workout: WorkoutDay, status: WorkoutStatus) {
    if (isFutureDate(workout.dateIso) && status !== "geplant") { Alert.alert("Status nicht möglich", "Zukünftige Trainings können noch nicht als erledigt oder verpasst markiert werden."); return; }
    setWorkouts((current) => current.map((item) => item.dateIso === workout.dateIso ? { ...item, status } : item));
    setDetailWorkout((current) => current?.dateIso === workout.dateIso ? { ...current, status } : current);
  }

  function deleteWorkout(workout: WorkoutDay) {
    Alert.alert("Eintrag löschen?", `«${workout.title}» wird aus dem Kalender entfernt.`, [{ text: "Abbrechen", style: "cancel" }, { text: "Löschen", style: "destructive", onPress: () => { setWorkouts((current) => current.filter((item) => item.dateIso !== workout.dateIso)); setDetailWorkout(undefined); } }]);
  }

  function adoptTemplate(dayId: string, time: string) {
    if (!templateToAdopt) {
      return;
    }

    const adoptedTemplate = templateToAdopt;
    const selectedCalendarDay = weekDays.find((workout) => workout.id === dayId);

    if (!selectedCalendarDay) return;
    const adoptedWorkout = createWorkoutFromTemplate(
      adoptedTemplate,
      selectedCalendarDay,
      time,
      exercises,
    );
    setWorkouts((current) => [
      ...current.filter((workout) => workout.dateIso !== selectedCalendarDay.dateIso),
      adoptedWorkout,
    ]);
    setTemplateToAdopt(undefined);
    Alert.alert(
      "Vorlage übernommen",
      `${adoptedTemplate.name} wurde für ${selectedCalendarDay?.fullDay ?? "den gewählten Tag"} eingeplant.`,
    );
  }

  const weekStats = calculateWorkoutWeekStats(
    workouts,
    profile,
    initialStreak.longestWeeks,
    now,
  );
  const progressWidth = `${weekStats.weeklyGoalPercent}%` as `${number}%`;
  const nextWorkoutLabel = weekStats.nextWorkout
    ? `${weekStats.nextWorkout.fullDay}, ${weekStats.nextWorkout.time} - ${weekStats.nextWorkout.title}`
    : "Kein weiteres Training geplant";

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View style={styles.brandRow}>
            <Image
              source={gymBuddyLogo}
              resizeMode="contain"
              style={styles.logo}
            />
            <View>
              <Text style={styles.brand}>Gym Buddy</Text>
              <Text style={styles.mutedText}>{formatGermanDate(now)}</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.addButton} onPress={() => openWorkoutForm()}>
            <Text style={styles.addButtonText}>+ Training</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.heroPanel}>
          <Text style={styles.eyebrow}>Heute</Text>
          <Text style={styles.title}>Hey {demoUser.name}, dein Aufbau läuft.</Text>
          <Text style={styles.bodyText}>
            {demoUser.goal} · {demoUser.experienceLevel} · {demoUser.split}
          </Text>
          <Text style={styles.nextWorkoutText}>Nächstes Training: {nextWorkoutLabel}</Text>
          <View style={styles.progressRow}>
            <Text style={styles.bodyText}>Wochenziel</Text>
            <Text style={styles.metricText}>
              {weekStats.completedWorkouts} / {profile.weeklyWorkoutGoal}
            </Text>
          </View>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: progressWidth }]} />
          </View>
        </View>

        <View style={styles.twoColumn}>
          <View style={styles.smallPanel}>
            <Text style={styles.eyebrow}>Streak</Text>
            <Text style={styles.bigNumber}>
              {weekStats.currentStreak.currentWeeks}
            </Text>
            <Text style={styles.bodyText}>Wochen am Stück</Text>
          </View>
          <View style={styles.smallPanel}>
            <Text style={styles.eyebrow}>Trainingszeit</Text>
            <Text style={styles.bigNumber}>{weekStats.totalTrainingTime}</Text>
            <Text style={styles.bodyText}>Minuten erledigt</Text>
          </View>
        </View>

        <View style={styles.profilePanel}>
          <Text style={styles.eyebrow}>Diese Woche</Text>
          <Text style={styles.sectionHeading}>
            {weekStats.trainingsThisWeek} Trainings insgesamt
          </Text>
          <Text style={styles.bodyText}>
            {weekStats.completedWorkouts} erledigt · längster Streak:{" "}
            {weekStats.currentStreak.longestWeeks} Wochen
          </Text>
        </View>

        <SectionTitle label="Wochenkalender" title="Geplante Gym-Woche" />

        <WeeklyCalendar
          workouts={weekDays}
          onDeleteWorkout={deleteWorkout}
          onEditWorkout={openWorkoutForm}
          onEditExercises={(day) => setExerciseDayId(day.id)}
          onMarkDone={(workout) => changeStatus(workout, "erledigt")}
          onPlanDay={openWorkoutForm}
          onViewWorkout={setDetailWorkout}
          onPreviousWeek={() => setWeekAnchor((date) => addDays(date, -7))}
          onNextWeek={() => setWeekAnchor((date) => addDays(date, 7))}
          onToday={() => setWeekAnchor(new Date())}
          todayIso={todayIso}
          weekLabel={formatWeekRange(weekAnchor)}
        />

        <SectionTitle label="Trainingspläne" title="Workout-Vorlagen" />

        <WorkoutPlanManager plans={plans} onSave={(plan) => setPlans((current) => [...current.filter((item) => item.id !== plan.id), plan])} onDelete={(plan) => Alert.alert("Plan löschen?", `«${plan.name}» wird entfernt.`, [{text:"Abbrechen",style:"cancel"},{text:"Löschen",style:"destructive",onPress:()=>setPlans((current)=>current.filter((item)=>item.id!==plan.id))}])} onUse={setTemplateToAdopt} />

        <SectionTitle label="Profil" title="Körper, Aktivität und Ziel" />
        <View style={styles.profilePanel}><Text style={styles.sectionHeading}>{profile.name}</Text><Text style={styles.bodyText}>{profile.heightCm} cm · {profile.weightKg} kg · Ziel {profile.targetWeightKg} kg</Text><Text style={styles.bodyText}>{profile.activityLevel} · {profile.primaryGoal} · {profile.weeklyWorkoutGoal} Trainings pro Woche</Text><TouchableOpacity style={styles.profileButton} onPress={() => setIsProfileOpen(true)}><Text style={styles.profileButtonText}>Profil bearbeiten</Text></TouchableOpacity></View>

        <SectionTitle label="Übungen" title="Übungsbibliothek" />

        <ExerciseLibrary />

        <SectionTitle label="Ernährung" title="Ernährungstipps" />
        <NutritionTipLibrary />
      </ScrollView>

      <View style={styles.bottomNav}>
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tabButton, tab === "Home" && styles.activeTab]}
          >
            <Text
              style={[styles.tabText, tab === "Home" && styles.activeTabText]}
            >
              {tab}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <WorkoutFormModal
        dayTemplates={weekDays}
        selectedDay={selectedDay}
        visible={isFormOpen}
        onClose={closeWorkoutForm}
        onSubmit={saveWorkout}
      />
      {exerciseDay ? <WorkoutExerciseEditor key={exerciseDay.id} workout={exerciseDay} onClose={() => setExerciseDayId(undefined)} onSave={(exercises) => setWorkouts((items) => items.map((day) => day.id === exerciseDay.id ? { ...day, exercises } : day))} /> : null}

      <WorkoutDetailsModal visible={Boolean(detailWorkout)} workout={detailWorkout} onClose={() => setDetailWorkout(undefined)} onEdit={openWorkoutForm} onDelete={deleteWorkout} onStatus={changeStatus} />

      <ProfileFormModal profile={profile} visible={isProfileOpen} onClose={() => setIsProfileOpen(false)} onSubmit={(next) => { setProfile(next); setIsProfileOpen(false); }} />

      <TemplateAdoptionModal
        days={weekDays}
        onClose={() => setTemplateToAdopt(undefined)}
        onSubmit={adoptTemplate}
        template={templateToAdopt}
        visible={Boolean(templateToAdopt)}
      />
    </SafeAreaView>
  );
}

function SectionTitle({ label, title }: { label: string; title: string }) {
  return (
    <View style={styles.sectionTitle}>
      <Text style={styles.eyebrow}>{label}</Text>
      <Text style={styles.sectionHeading}>{title}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: "#0B0F0E",
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 108,
  },
  header: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  brandRow: {
    alignItems: "center",
    flex: 1,
    flexDirection: "row",
    gap: 11,
    minWidth: 0,
  },
  logo: {
    borderRadius: 10,
    height: 46,
    width: 46,
  },
  brand: {
    color: "#F4F7F5",
    fontSize: 25,
    fontWeight: "900",
  },
  addButton: {
    backgroundColor: "#7CFF6B",
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 11,
  },
  addButtonText: {
    color: "#0B0F0E",
    fontWeight: "800",
  },
  heroPanel: {
    backgroundColor: "#111716",
    borderColor: "rgba(255,255,255,0.08)",
    borderRadius: 8,
    borderWidth: 1,
    padding: 20,
  },
  eyebrow: {
    color: "#8D9A95",
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 0,
    marginBottom: 7,
    textTransform: "uppercase",
  },
  title: {
    color: "#F4F7F5",
    fontSize: 25,
    fontWeight: "900",
    lineHeight: 31,
    marginBottom: 10,
  },
  sectionHeading: {
    color: "#F4F7F5",
    fontSize: 21,
    fontWeight: "900",
  },
  bodyText: {
    color: "#B9C4BF",
    fontSize: 14,
    lineHeight: 20,
  },
  nextWorkoutText: {
    color: "#DCE5E1",
    fontSize: 14,
    fontWeight: "800",
    lineHeight: 20,
    marginTop: 10,
  },
  mutedText: {
    color: "#8D9A95",
    fontSize: 13,
  },
  metricText: {
    color: "#F4F7F5",
    fontSize: 18,
    fontWeight: "900",
  },
  progressRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 18,
  },
  progressTrack: {
    backgroundColor: "#25302D",
    borderRadius: 999,
    height: 10,
    marginTop: 10,
    overflow: "hidden",
  },
  progressFill: {
    backgroundColor: "#7CFF6B",
    height: "100%",
  },
  twoColumn: {
    flexDirection: "row",
    gap: 12,
    marginTop: 12,
  },
  smallPanel: {
    backgroundColor: "#111716",
    borderColor: "rgba(255,255,255,0.08)",
    borderRadius: 8,
    borderWidth: 1,
    flex: 1,
    minHeight: 136,
    padding: 16,
  },
  profilePanel: {
    backgroundColor: "#111716",
    borderColor: "rgba(255,255,255,0.08)",
    borderRadius: 8,
    borderWidth: 1,
    gap: 7,
    marginTop: 12,
    padding: 16,
  },
  bigNumber: {
    color: "#F4F7F5",
    fontSize: 42,
    fontWeight: "900",
    marginBottom: 4,
  },
  petOrb: {
    alignItems: "center",
    backgroundColor: "#44D7FF",
    borderRadius: 28,
    height: 58,
    justifyContent: "center",
    marginBottom: 10,
    width: 58,
  },
  petLetter: {
    color: "#0B0F0E",
    fontSize: 28,
    fontWeight: "900",
  },
  sectionTitle: {
    marginBottom: 12,
    marginTop: 28,
  },
  bottomNav: {
    backgroundColor: "#111716",
    borderColor: "rgba(255,255,255,0.08)",
    borderTopWidth: 1,
    bottom: 0,
    flexDirection: "row",
    gap: 8,
    left: 0,
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 18,
    position: "absolute",
    right: 0,
  },
  tabButton: {
    alignItems: "center",
    borderRadius: 8,
    flex: 1,
    justifyContent: "center",
    minHeight: 42,
  },
  activeTab: {
    backgroundColor: "#18201E",
  },
  tabText: {
    color: "#8D9A95",
    fontSize: 12,
    fontWeight: "800",
  },
  activeTabText: {
    color: "#F4F7F5",
  },
  profileButton: {
    alignItems: "center",
    borderColor: "#7CFF6B",
    borderRadius: 8,
    borderWidth: 1,
    justifyContent: "center",
    marginTop: 10,
    minHeight: 44,
  },
  profileButtonText: {
    color: "#7CFF6B",
    fontSize: 14,
    fontWeight: "900",
  },
});
