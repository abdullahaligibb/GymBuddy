import { NutritionTip } from "../types";

export const nutritionTips: NutritionTip[] = [
  {
    id: "protein-pro-mahlzeit",
    title: "Protein gleichmäßig verteilen",
    category: "Protein",
    body: "Plane pro Hauptmahlzeit eine klare Proteinquelle ein, damit Muskelaufbau über den Tag konstant unterstützt wird.",
    tags: ["Muskelaufbau", "Alltag", "Protein"],
  },
  {
    id: "kalorien-aufbau",
    title: "Leichter Kalorienüberschuss",
    category: "Kalorien",
    body: "Für sauberen Aufbau reicht oft ein kleiner Überschuss. Prüfe Gewicht und Leistung wöchentlich statt jeden Tag hektisch zu reagieren.",
    tags: ["Muskelaufbau", "Tracking"],
  },
  {
    id: "pre-workout-carbs",
    title: "Kohlenhydrate vor schweren Einheiten",
    category: "Timing",
    body: "Iss vor Push, Pull oder Legs eine gut verträgliche Kohlenhydratquelle, wenn die letzte Mahlzeit länger zurückliegt.",
    tags: ["Training", "Energie"],
  },
  {
    id: "trinken-regeneration",
    title: "Hydration für Leistung",
    category: "Hydration",
    body: "Starte schwere Einheiten nicht dehydriert. Schon ein leichter Flüssigkeitsmangel kann Kraft und Fokus spürbar drücken.",
    tags: ["Leistung", "Regeneration"],
  },
];
