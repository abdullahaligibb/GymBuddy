import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  BackHandler,
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
import { AuthScreen } from "./src/components/AuthScreen";
import { MacroTracker } from "./src/components/MacroTracker";
import { ProfileFormModal } from "./src/components/ProfileFormModal";
import { TemplateAdoptionModal } from "./src/components/TemplateAdoptionModal";
import { WorkoutDetailsModal } from "./src/components/WorkoutDetailsModal";
import { WorkoutFormModal } from "./src/components/WorkoutFormModal";
import { WorkoutExerciseEditor } from "./src/components/WorkoutExerciseEditor";
import { WorkoutPlanManager } from "./src/components/WorkoutPlanManager";
import { WeeklyCalendar } from "./src/components/WeeklyCalendar";
import { NutritionTipLibrary } from "./src/components/NutritionTipLibrary";
import { confirmAction } from "./src/components/feedback";
import { addDays, formatWeekRange, getWeekDays, isFutureDate, toIsoDate } from "./src/domain/calendar";
import { createWorkoutFromTemplate } from "./src/domain/workoutTemplates";
import { HealthProfile, WorkoutDay, WorkoutPlan, WorkoutStatus, WorkoutTemplate } from "./src/types";
import { createMockApi, demoLogin } from "./src/services/mockApi";
import { useSession } from "./src/services/useSession";
import { useTrainingData } from "./src/services/useTrainingData";
import { ApiError } from "./src/services/api";
import { upsertWorkout, removeWorkout } from "./src/domain/workoutState";
import {
  calculateWorkoutWeekStats,
  formatGermanDate,
} from "./src/utils/workoutStats";

const gymBuddyLogo = require("./assets/logo-gymbuddy.png");

const tabs = ["Start", "Kalender", "Übungen", "Statistik", "Ernährung"] as const;
type Tab = typeof tabs[number];
const api = createMockApi();

export default function App() {
  const auth = useSession(api);
  if (!auth.session) {
    return <AuthScreen
      checking={auth.checking}
      busy={auth.busy}
      error={auth.error}
      restoreFailed={auth.restoreFailed}
      onRetry={auth.restore}
      onDemo={() => auth.authenticate(() => api.login(demoLogin))}
      onLogin={(input) => auth.authenticate(() => api.login(input))}
      onRegister={(input) => auth.authenticate(() => api.register(input))}
    />;
  }
  const { token, user } = auth.session;
  return <TrainingApp key={token} token={token} username={user.username} endSession={auth.end} />;
}

function TrainingApp({ username, token, endSession }: {
  username: string; token: string; endSession: (token: string, expired?: boolean) => Promise<void>;
}) {
  const { data, loading, saving, error, load, mutate } = useTrainingData(api, token, endSession);
  const [tab, setTab] = useState<Tab>("Start");
  const [showProfile, setShowProfile] = useState(false);
  const [weekAnchor, setWeekAnchor] = useState(new Date());
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [selectedDay, setSelectedDay] = useState<WorkoutDay | undefined>();
  const [exerciseDayId, setExerciseDayId] = useState<string>();
  const [detailDayId, setDetailDayId] = useState<string>();
  const [actionError, setActionError] = useState("");
  const [templateToAdopt, setTemplateToAdopt] = useState<
    WorkoutTemplate | undefined
  >();

  const now = new Date();
  const todayIso = toIsoDate(now);
  const weekDays = useMemo(() => getWeekDays(weekAnchor, data?.workouts ?? []), [weekAnchor, data?.workouts]);
  const emptyProfile = useMemo<HealthProfile>(() => ({
    name: username, birthDateIso: "", heightCm: 0, weightKg: 0, targetWeightKg: 0,
    targetDateIso: "", activityLevel: "Leicht aktiv", primaryGoal: "Allgemeine Fitness",
    experienceLevel: "Einsteiger", weeklyWorkoutGoal: 3, preferredTrainingDays: [],
  }), [username]);

  useEffect(() => {
    const subscription = BackHandler.addEventListener("hardwareBackPress", () => {
      if (showProfile) {
        setShowProfile(false);
        return true;
      }
      if (tab === "Start") return false;
      setTab("Start");
      return true;
    });
    return () => subscription.remove();
  }, [showProfile, tab]);

  if (!data) {
    return <SafeAreaView style={styles.safeArea}>
      <View style={styles.scrollContent}>
        <Text style={styles.brand}>Gym Buddy</Text>
        {loading ? <ActivityIndicator color="#7CFF6B" accessibilityLabel="Daten werden geladen" /> : <>
          <Text accessibilityRole="alert" style={styles.error}>{error}</Text>
          <TouchableOpacity style={styles.profileButton} onPress={load}><Text style={styles.profileButtonText}>Erneut versuchen</Text></TouchableOpacity>
        </>}
        <TouchableOpacity style={styles.profileButton} onPress={() => endSession(token)}><Text style={styles.profileButtonText}>Abmelden</Text></TouchableOpacity>
      </View>
    </SafeAreaView>;
  }
  const { workouts, plans, profile, exercises } = data;
  const exerciseDay = workouts.find((day) => day.id === exerciseDayId);
  const detailWorkout = workouts.find((day) => day.id === detailDayId);

  function openWorkoutForm(day?: WorkoutDay) {
    setDetailDayId(undefined);
    setActionError("");
    setSelectedDay(day ?? weekDays.find((item) => item.dateIso === todayIso) ?? weekDays[0]);
    setIsFormOpen(true);
  }

  function closeWorkoutForm() {
    setIsFormOpen(false);
    setSelectedDay(undefined);
  }

  function persistWorkout(workout: WorkoutDay) {
    return mutate(() => api.saveWorkout(token, workout), (current, saved) => ({
      ...current, workouts: upsertWorkout(current.workouts, saved),
    }));
  }

  async function saveWorkout(workout: WorkoutDay) {
    if (saving) return;
    const existing = workouts.find((item) => item.dateIso === workout.dateIso);
    const replaces = existing && (existing.id !== selectedDay?.id || (existing.status === "ruhe") !== (workout.status === "ruhe"));
    if (replaces && !await confirmAction("Eintrag ersetzen?", `Für ${existing.fullDay} besteht bereits «${existing.title}».`, "Ersetzen")) return;
    try {
      setActionError("");
      await persistWorkout(workout);
      closeWorkoutForm();
    } catch (failure) {
      setActionError(failure instanceof ApiError ? failure.message : "Speichern fehlgeschlagen. Deine Eingaben bleiben erhalten.");
    }
  }

  async function changeStatus(workout: WorkoutDay, status: WorkoutStatus) {
    if (saving) return;
    if (isFutureDate(workout.dateIso) && status !== "geplant") {
      setActionError("Zukünftige Trainings können nur als geplant markiert werden.");
      return;
    }
    setActionError("");
    await present(
      mutate(() => api.setStatus(token, workout, status), (current, saved) => ({
        ...current, workouts: upsertWorkout(current.workouts, saved),
      })),
    );
  }

  async function present(request: Promise<unknown>, onSuccess?: () => void) {
    try {
      await request;
      onSuccess?.();
    } catch (failure) {
      setActionError(failure instanceof ApiError ? failure.message : "Verbindung fehlgeschlagen. Bitte erneut versuchen.");
    }
  }

  async function deleteWorkout(workout: WorkoutDay) {
    if (saving || !await confirmAction("Eintrag löschen?", `«${workout.title}» wird aus dem Kalender entfernt.`, "Löschen")) return;
    setActionError("");
    await present(mutate(() => api.deleteWorkout(token, workout), (current) => ({
      ...current, workouts: removeWorkout(current.workouts, workout.dateIso),
    })), () => setDetailDayId(undefined));
  }

  async function adoptTemplate(dayId: string, time: string) {
    const day = weekDays.find((workout) => workout.id === dayId);
    if (!day || !templateToAdopt) throw new ApiError(400, "Vorlage oder Tag fehlt.");
    await persistWorkout(createWorkoutFromTemplate(templateToAdopt, day, time, exercises));
  }

  async function savePlan(plan: WorkoutPlan) {
    await mutate(() => api.savePlan(token, plan), (current, saved) => ({
      ...current, plans: [...current.plans.filter((item) => item.id !== saved.id), saved],
    }));
  }

  async function deletePlan(plan: WorkoutPlan) {
    if (saving || !await confirmAction("Plan löschen?", `«${plan.name}» wird entfernt.`, "Löschen")) return;
    setActionError("");
    await present(mutate(() => api.deletePlan(token, plan), (current) => ({
      ...current, plans: current.plans.filter((item) => item.id !== plan.id),
    })));
  }

  function saveProfile(next: HealthProfile) {
    setActionError("");
    return present(mutate(() => api.saveProfile(token, next), (current, saved) => ({
      ...current, profile: saved,
    })), () => setIsProfileOpen(false));
  }

  const goal = profile?.weeklyWorkoutGoal ?? emptyProfile.weeklyWorkoutGoal;
  const weekStats = calculateWorkoutWeekStats(
    workouts,
    { weeklyWorkoutGoal: goal },
    0,
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
        key={showProfile ? "profile" : tab}
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
          <TouchableOpacity
            accessibilityRole="button"
            style={styles.profileButton}
            onPress={() => { setActionError(""); setShowProfile(!showProfile); }}
          >
            <Text style={styles.profileButtonText}>{showProfile ? "Zurück" : "Profil"}</Text>
          </TouchableOpacity>
        </View>
        {actionError || error ? <Text accessibilityRole="alert" style={styles.error}>{actionError || error}</Text> : null}

        {!showProfile && tab === "Start" ? <View style={styles.heroPanel}>
          <Text style={styles.eyebrow}>Heute</Text>
          <Text style={styles.title}>Hallo {username}</Text>
          <Text style={styles.bodyText}>
            {profile ? `${profile.primaryGoal} · ${profile.experienceLevel}` : "Profil noch nicht eingerichtet"}
          </Text>
          <Text style={styles.nextWorkoutText}>Nächstes Training: {nextWorkoutLabel}</Text>
          <View style={styles.progressRow}>
            <Text style={styles.bodyText}>Wochenziel</Text>
            <Text style={styles.metricText}>
              {weekStats.completedWorkouts} / {goal}
            </Text>
          </View>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: progressWidth }]} />
          </View>
        </View> : null}

        {!showProfile && (tab === "Start" || tab === "Statistik") ? <>
        {tab === "Statistik" ? <SectionTitle label="Training" title="Wochenstatistik" /> : null}
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
        </> : null}

        {!showProfile && tab === "Kalender" ? <>
        <SectionTitle label="Wochenkalender" title="Geplante Gym-Woche" />

        <TouchableOpacity accessibilityRole="button" style={styles.addButton} onPress={() => openWorkoutForm()}>
          <Text style={styles.addButtonText}>+ Training</Text>
        </TouchableOpacity>
        <WeeklyCalendar
          workouts={weekDays}
          onDeleteWorkout={deleteWorkout}
          onEditWorkout={openWorkoutForm}
          onEditExercises={(day) => setExerciseDayId(day.id)}
          onMarkDone={(workout) => changeStatus(workout, "erledigt")}
          onPlanDay={openWorkoutForm}
          onViewWorkout={(workout) => { setActionError(""); setDetailDayId(workout.id); }}
          onPreviousWeek={() => setWeekAnchor((date) => addDays(date, -7))}
          onNextWeek={() => setWeekAnchor((date) => addDays(date, 7))}
          onToday={() => setWeekAnchor(new Date())}
          todayIso={todayIso}
          weekLabel={formatWeekRange(weekAnchor)}
        />

        <SectionTitle label="Trainingspläne" title="Workout-Vorlagen" />

        <WorkoutPlanManager plans={plans} onSave={savePlan} onDelete={deletePlan} onUse={setTemplateToAdopt} />
        </> : null}

        {showProfile ? <>
        <SectionTitle label="Profil" title="Körper, Aktivität und Ziel" />
        <View style={styles.profilePanel}>
          {profile ? <>
            <Text style={styles.sectionHeading}>{profile.name}</Text>
            <Text style={styles.bodyText}>{profile.heightCm} cm · {profile.weightKg} kg · Ziel {profile.targetWeightKg} kg</Text>
            <Text style={styles.bodyText}>{profile.activityLevel} · {profile.primaryGoal} · {goal} Trainings pro Woche</Text>
          </> : <Text style={styles.bodyText}>Du hast noch kein Profil angelegt.</Text>}
          <TouchableOpacity style={styles.profileButton} onPress={() => { setActionError(""); setIsProfileOpen(true); }}>
            <Text style={styles.profileButtonText}>{profile ? "Profil bearbeiten" : "Profil einrichten"}</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity accessibilityRole="button" style={styles.profileButton} onPress={() => endSession(token)}>
          <Text style={styles.profileButtonText}>Abmelden</Text>
        </TouchableOpacity>
        </> : null}

        {!showProfile && tab === "Übungen" ? <>
        <SectionTitle label="Übungen" title="Übungsbibliothek" />

        <ExerciseLibrary exercises={exercises} />
        </> : null}

        {!showProfile && tab === "Ernährung" ? <>
        <MacroTracker
          profile={profile}
          target={data.macroTarget}
          logs={data.macroLogs}
          busy={saving}
          onProfile={() => setShowProfile(true)}
          onSaveTarget={(target) => mutate(() => api.saveMacroTarget(token, target), (current, saved) => ({
            ...current, macroTarget: saved,
          }))}
          onSaveLog={(log) => mutate(() => api.saveMacroLog(token, log), (current, saved) => ({
            ...current, macroLogs: [...current.macroLogs.filter((item) => item.dateIso !== saved.dateIso), saved],
          }))}
          onDeleteLog={(date) => mutate(() => api.deleteMacroLog(token, date), (current) => ({
            ...current, macroLogs: current.macroLogs.filter((item) => item.dateIso !== date),
          }))}
        />
        <SectionTitle label="Ernährung" title="Ernährungstipps" />
        <NutritionTipLibrary />
        </> : null}
      </ScrollView>

      <View style={styles.bottomNav}>
        {tabs.map((option) => (
          <TouchableOpacity
            key={option}
            accessibilityRole="tab"
            accessibilityState={{ selected: !showProfile && option === tab }}
            onPress={() => { setActionError(""); setTab(option); setShowProfile(false); }}
            style={[styles.tabButton, !showProfile && option === tab && styles.activeTab]}
          >
            <Text
              style={[styles.tabText, !showProfile && option === tab && styles.activeTabText]}
            >
              {option}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <WorkoutFormModal
        dayTemplates={weekDays}
        selectedDay={selectedDay}
        visible={isFormOpen}
        onClose={() => { if (!saving) closeWorkoutForm(); }}
        onSubmit={saveWorkout}
        saving={saving}
        saveError={actionError}
      />
      {exerciseDay ? <WorkoutExerciseEditor key={exerciseDay.id} workout={exerciseDay} exercises={exercises} onClose={() => setExerciseDayId(undefined)} onSave={async (items) => { await persistWorkout({ ...exerciseDay, exercises: items }); }} /> : null}

      <WorkoutDetailsModal visible={Boolean(detailWorkout)} workout={detailWorkout} onClose={() => { setActionError(""); setDetailDayId(undefined); }} onEdit={openWorkoutForm} onDelete={deleteWorkout} onStatus={changeStatus} saveError={actionError} />

      <ProfileFormModal profile={profile ?? emptyProfile} visible={isProfileOpen} onClose={() => { if (!saving) setIsProfileOpen(false); }} onSubmit={saveProfile} saving={saving} saveError={actionError} />

      <TemplateAdoptionModal
        days={weekDays}
        onClose={() => setTemplateToAdopt(undefined)}
        onSubmit={adoptTemplate}
        template={templateToAdopt}
        exercises={exercises}
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
    alignSelf: "flex-start",
    backgroundColor: "#7CFF6B",
    borderRadius: 8,
    marginBottom: 12,
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
  error: {
    color: "#FF9A9D",
    marginVertical: 10,
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
    gap: 3,
    left: 0,
    paddingHorizontal: 10,
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
    fontSize: 11,
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
