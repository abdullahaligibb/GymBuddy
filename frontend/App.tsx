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
import { TemplateAdoptionModal } from "./src/components/TemplateAdoptionModal";
import { WorkoutTemplateLibrary } from "./src/components/WorkoutTemplateLibrary";
import { WorkoutFormModal } from "./src/components/WorkoutFormModal";
import { WeeklyCalendar } from "./src/components/WeeklyCalendar";
import { initialWorkouts } from "./src/data/workouts";
import { WorkoutDay, WorkoutTemplate } from "./src/types";

const gymBuddyLogo = require("./assets/logo-gymbuddy.png");

const tabs = ["Home", "Kalender", "Übungen", "Stats"];
const weeklyGoal = 3;

export default function App() {
  const [workouts, setWorkouts] = useState<WorkoutDay[]>(initialWorkouts);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedDay, setSelectedDay] = useState<WorkoutDay | undefined>();
  const [templateToAdopt, setTemplateToAdopt] = useState<
    WorkoutTemplate | undefined
  >();

  function openWorkoutForm(day?: WorkoutDay) {
    const fallbackDay =
      workouts.find((workout) => workout.muscles.length === 0) ?? workouts[0];
    setSelectedDay(day ?? fallbackDay);
    setIsFormOpen(true);
  }

  function closeWorkoutForm() {
    setIsFormOpen(false);
    setSelectedDay(undefined);
  }

  function saveWorkout(workout: WorkoutDay) {
    setWorkouts((current) =>
      current.map((item) => (item.id === workout.id ? workout : item)),
    );
    closeWorkoutForm();
  }

  function markWorkoutDone(workout: WorkoutDay) {
    setWorkouts((current) =>
      current.map((item) =>
        item.id === workout.id ? { ...item, status: "erledigt" } : item,
      ),
    );
  }

  function deleteWorkout(workout: WorkoutDay) {
    setWorkouts((current) =>
      current.map((item) =>
        item.id === workout.id
          ? {
              ...item,
              title: "Noch kein Training",
              time: "-",
              durationMinutes: 0,
              type: "Rest Day",
              muscles: [],
              intensity: "Leicht",
              status: "ruhe",
              notes: undefined,
              sourceTemplateId: undefined,
              exercises: undefined,
            }
          : item,
      ),
    );
  }

  function adoptTemplate(dayId: string, time: string) {
    if (!templateToAdopt) {
      return;
    }

    const adoptedTemplate = templateToAdopt;
    const selectedCalendarDay = workouts.find((workout) => workout.id === dayId);

    setWorkouts((current) =>
      current.map((workout) =>
        workout.id === dayId
          ? {
              ...workout,
              title: adoptedTemplate.name,
              time,
              durationMinutes: adoptedTemplate.durationMinutes,
              type: adoptedTemplate.type,
              muscles: [...adoptedTemplate.muscles],
              intensity: adoptedTemplate.difficulty,
              status: "geplant",
              notes: `Ziel: ${adoptedTemplate.goal}`,
              sourceTemplateId: adoptedTemplate.id,
              exercises: adoptedTemplate.exercises.map((exercise) => ({
                ...exercise,
              })),
            }
          : workout,
      ),
    );
    setTemplateToAdopt(undefined);
    Alert.alert(
      "Vorlage übernommen",
      `${adoptedTemplate.name} wurde für ${selectedCalendarDay?.fullDay ?? "den gewählten Tag"} eingeplant.`,
    );
  }

  const completedWorkouts = workouts.filter(
    (workout) => workout.status === "erledigt",
  ).length;
  const plannedWorkouts = workouts.filter(
    (workout) => workout.status === "geplant",
  ).length;
  const totalTrainingTime = workouts
    .filter((workout) => workout.status === "erledigt")
    .reduce((sum, workout) => sum + workout.durationMinutes, 0);
  const progressPercent = Math.min((completedWorkouts / weeklyGoal) * 100, 100);
  const progressWidth = `${progressPercent}%` as `${number}%`;

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
              <Text style={styles.mutedText}>Donnerstag, 13. August</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.addButton} onPress={() => openWorkoutForm()}>
            <Text style={styles.addButtonText}>+ Training</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.heroPanel}>
          <Text style={styles.eyebrow}>Heute</Text>
          <Text style={styles.title}>Hey Arion, Regeneration zählt auch.</Text>
          <Text style={styles.bodyText}>
            {plannedWorkouts > 0
              ? `Noch ${plannedWorkouts} Training(s) sind diese Woche geplant.`
              : "Diese Woche ist alles erledigt oder frei geplant."}
          </Text>
          <View style={styles.progressRow}>
            <Text style={styles.bodyText}>Wochenziel</Text>
            <Text style={styles.metricText}>
              {completedWorkouts} / {weeklyGoal}
            </Text>
          </View>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: progressWidth }]} />
          </View>
        </View>

        <View style={styles.twoColumn}>
          <View style={styles.smallPanel}>
            <Text style={styles.eyebrow}>Streak</Text>
            <Text style={styles.bigNumber}>4</Text>
            <Text style={styles.bodyText}>Wochen am Stück</Text>
          </View>
          <View style={styles.smallPanel}>
            <Text style={styles.eyebrow}>Trainingszeit</Text>
            <Text style={styles.bigNumber}>{totalTrainingTime}</Text>
            <Text style={styles.bodyText}>Minuten erledigt</Text>
          </View>
        </View>

        <SectionTitle label="Wochenkalender" title="Geplante Gym-Woche" />

        <WeeklyCalendar
          workouts={workouts}
          onDeleteWorkout={deleteWorkout}
          onEditWorkout={openWorkoutForm}
          onMarkDone={markWorkoutDone}
          onPlanDay={openWorkoutForm}
        />

        <SectionTitle label="Trainingspläne" title="Workout-Vorlagen" />

        <WorkoutTemplateLibrary onAdoptTemplate={setTemplateToAdopt} />

        <SectionTitle label="Übungen" title="Übungsbibliothek" />

        <ExerciseLibrary />
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
        dayTemplates={workouts}
        selectedDay={selectedDay}
        visible={isFormOpen}
        onClose={closeWorkoutForm}
        onSubmit={saveWorkout}
      />

      <TemplateAdoptionModal
        days={workouts}
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
});
