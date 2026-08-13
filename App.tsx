import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

type WorkoutStatus = "erledigt" | "geplant" | "ruhe";

type WorkoutDay = {
  day: string;
  date: string;
  title: string;
  time: string;
  duration: string;
  muscles: string[];
  status: WorkoutStatus;
};

type Exercise = {
  name: string;
  muscle: string;
  equipment: string;
  level: string;
};

const week: WorkoutDay[] = [
  {
    day: "Mo",
    date: "10.08.",
    title: "Push Day",
    time: "18:30",
    duration: "75 min",
    muscles: ["Brust", "Schulter", "Trizeps"],
    status: "erledigt",
  },
  {
    day: "Di",
    date: "11.08.",
    title: "Ruhetag",
    time: "-",
    duration: "Mobility optional",
    muscles: ["Regeneration"],
    status: "ruhe",
  },
  {
    day: "Mi",
    date: "12.08.",
    title: "Pull Day",
    time: "19:00",
    duration: "70 min",
    muscles: ["Ruecken", "Bizeps"],
    status: "geplant",
  },
  {
    day: "Fr",
    date: "14.08.",
    title: "Leg Day",
    time: "18:00",
    duration: "80 min",
    muscles: ["Beine", "Waden"],
    status: "geplant",
  },
];

const exercises: Exercise[] = [
  {
    name: "Bankdruecken",
    muscle: "Brust",
    equipment: "Langhantel",
    level: "Mittel",
  },
  {
    name: "Latziehen",
    muscle: "Ruecken",
    equipment: "Kabelzug",
    level: "Einsteiger",
  },
  {
    name: "Kniebeugen",
    muscle: "Beine",
    equipment: "Langhantel",
    level: "Fortgeschritten",
  },
  {
    name: "Seitheben",
    muscle: "Schulter",
    equipment: "Kurzhanteln",
    level: "Einsteiger",
  },
];

const tabs = ["Home", "Kalender", "Uebungen", "Stats"];

function getStatusStyle(status: WorkoutStatus) {
  if (status === "erledigt") {
    return styles.doneCard;
  }

  if (status === "geplant") {
    return styles.plannedCard;
  }

  return styles.restCard;
}

export default function App() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.brand}>Gym Buddy</Text>
            <Text style={styles.mutedText}>Donnerstag, 13. August</Text>
          </View>
          <TouchableOpacity style={styles.addButton}>
            <Text style={styles.addButtonText}>+ Training</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.heroPanel}>
          <Text style={styles.eyebrow}>Heute</Text>
          <Text style={styles.title}>Hey Arion, Regeneration zaehlt auch.</Text>
          <Text style={styles.bodyText}>
            Heute ist kein hartes Training geplant. Freitag steht Leg Day an.
          </Text>
          <View style={styles.progressRow}>
            <Text style={styles.bodyText}>Wochenziel</Text>
            <Text style={styles.metricText}>2 / 3</Text>
          </View>
          <View style={styles.progressTrack}>
            <View style={styles.progressFill} />
          </View>
        </View>

        <View style={styles.twoColumn}>
          <View style={styles.smallPanel}>
            <Text style={styles.eyebrow}>Streak</Text>
            <Text style={styles.bigNumber}>4</Text>
            <Text style={styles.bodyText}>Wochen am Stueck</Text>
          </View>
          <View style={styles.smallPanel}>
            <Text style={styles.eyebrow}>Buddy</Text>
            <View style={styles.petOrb}>
              <Text style={styles.petLetter}>L</Text>
            </View>
            <Text style={styles.bodyText}>Lumo Stufe 3</Text>
          </View>
        </View>

        <SectionTitle label="Wochenkalender" title="Geplante Gym-Woche" />

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.weekRow}
        >
          {week.map((item) => (
            <View
              key={`${item.day}-${item.title}`}
              style={[styles.dayCard, getStatusStyle(item.status)]}
            >
              <View style={styles.dayHeader}>
                <Text style={styles.dayText}>{item.day}</Text>
                <Text style={styles.mutedText}>{item.date}</Text>
              </View>
              <Text style={styles.cardTitle}>{item.title}</Text>
              <Text style={styles.bodyText}>
                {item.time} - {item.duration}
              </Text>
              <View style={styles.chipWrap}>
                {item.muscles.map((muscle) => (
                  <Text style={styles.chip} key={muscle}>
                    {muscle}
                  </Text>
                ))}
              </View>
            </View>
          ))}
        </ScrollView>

        <SectionTitle label="Uebungen" title="Basis-Uebungen" />

        <View style={styles.exerciseList}>
          {exercises.map((exercise) => (
            <View style={styles.exerciseCard} key={exercise.name}>
              <View>
                <Text style={styles.cardTitle}>{exercise.name}</Text>
                <Text style={styles.bodyText}>
                  {exercise.equipment} - {exercise.level}
                </Text>
              </View>
              <Text style={styles.exerciseMuscle}>{exercise.muscle}</Text>
            </View>
          ))}
        </View>
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
  brand: {
    color: "#F4F7F5",
    fontSize: 27,
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
    width: "66%",
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
  weekRow: {
    gap: 12,
    paddingRight: 20,
  },
  dayCard: {
    backgroundColor: "#111716",
    borderRadius: 8,
    borderWidth: 1,
    minHeight: 188,
    padding: 16,
    width: 214,
  },
  doneCard: {
    borderColor: "rgba(124,255,107,0.42)",
  },
  plannedCard: {
    borderColor: "rgba(68,215,255,0.34)",
  },
  restCard: {
    borderColor: "rgba(255,255,255,0.08)",
    opacity: 0.78,
  },
  dayHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 18,
  },
  dayText: {
    color: "#F4F7F5",
    fontSize: 18,
    fontWeight: "900",
  },
  cardTitle: {
    color: "#F4F7F5",
    fontSize: 17,
    fontWeight: "900",
    marginBottom: 7,
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
  exerciseList: {
    gap: 10,
  },
  exerciseCard: {
    alignItems: "center",
    backgroundColor: "#111716",
    borderColor: "rgba(255,255,255,0.08)",
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 16,
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
