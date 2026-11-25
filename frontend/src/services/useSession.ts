import { useCallback, useEffect, useRef, useState } from "react";
import { ApiError, apiMessage } from "./api";
import type { AppApi } from "./api";
import { tokenStorage } from "./sessionStorage";
import type { Session } from "../types";

export function useSession(api: AppApi) {
  const [session, setSession] = useState<Session | null>(null);
  const [checking, setChecking] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [restoreFailed, setRestoreFailed] = useState(false);
  const running = useRef(false);

  const restore = useCallback(async () => {
    if (running.current) return;
    running.current = true;
    setChecking(true);
    setRestoreFailed(false);
    setError("");
    try {
      const token = await tokenStorage.read();
      if (token) setSession({ token, user: await api.me(token) });
    } catch (failure) {
      if (failure instanceof ApiError && failure.status === 401) {
        await tokenStorage.clear().catch(() => setRestoreFailed(true));
      } else {
        setRestoreFailed(true);
      }
      setError(apiMessage(failure));
    } finally {
      running.current = false;
      setChecking(false);
    }
  }, [api]);

  useEffect(() => { void restore(); }, [restore]);

  async function authenticate(request: () => Promise<Session>) {
    if (running.current) return;
    running.current = true;
    setBusy(true);
    setError("");
    try {
      const next = await request();
      await tokenStorage.write(next.token);
      setSession(next);
    } catch (failure) {
      setError(apiMessage(failure));
    } finally {
      running.current = false;
      setBusy(false);
    }
  }

  const end = useCallback(async (token: string, expired = false) => {
    if (running.current) return;
    running.current = true;
    setSession(null);
    setBusy(true);
    setError(expired ? "Deine Sitzung ist abgelaufen. Bitte erneut anmelden." : "");
    try {
      await tokenStorage.clear();
    } catch {
      setError("Die Sitzung konnte nicht vom Gerät entfernt werden. Bitte erneut abmelden.");
      setRestoreFailed(true);
    }
    try {
      await api.logout(token);
    } catch {
      // The device session has already been removed.
    } finally {
      running.current = false;
      setBusy(false);
    }
  }, [api]);

  return { session, checking, busy, error, restoreFailed, restore, authenticate, end };
}
