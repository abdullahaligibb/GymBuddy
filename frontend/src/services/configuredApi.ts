import type { AppApi } from "./api";
import { createHttpApi } from "./httpApi";
import { createMockApi } from "./mockApi";

export function configuredApi(config: { mode?: string; baseUrl?: string; contract?: string }): { api?: AppApi; error?: string } {
  const mode = config.mode?.trim() || (config.baseUrl?.trim() ? "server" : "demo");
  if (mode === "demo") return { api: { ...createMockApi(), mode: "demo", sessionKey: "gymbuddy.session.demo.v1" } };
  if (mode !== "server") return { error: "Der App-Modus muss demo oder server sein." };
  if (!config.baseUrl?.trim()) return { error: "Für den Serverbetrieb fehlt die Serveradresse EXPO_PUBLIC_API_URL." };
  if (config.contract && !["legacy", "v1"].includes(config.contract)) return { error: "Der Serververtrag muss legacy oder v1 sein." };
  try { return { api: createHttpApi(config.baseUrl.trim(), { contract: config.contract === "v1" ? "v1" : "legacy" }) }; }
  catch { return { error: "Die konfigurierte Serveradresse ist ungültig. Bitte EXPO_PUBLIC_API_URL prüfen." }; }
}
