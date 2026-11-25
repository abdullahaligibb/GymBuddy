import type { NutritionTip } from "../types";

export function filterNutritionTips(tips: readonly NutritionTip[], search: string, category: string): NutritionTip[] {
  const term = search.trim().toLocaleLowerCase("de-DE");
  return tips.filter((tip) =>
    (category === "Alle" || tip.category === category) &&
    (!term || [tip.title, tip.body, ...tip.tags].join(" ").toLocaleLowerCase("de-DE").includes(term))
  );
}
