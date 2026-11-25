import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ApiError, apiMessage } from "./api";
import type { AppApi } from "./api";
import { createTokenStorage } from "./sessionStorage";
import type { Session } from "../types";

export function useSession(api: AppApi) {
  const tokenStorage = useMemo(() => createTokenStorage(api.sessionKey ?? "gymbuddy.session.demo.v1"), [api.sessionKey]);
  const [session, setSession] = useState<Session | null>(null);
  const [checking, setChecking] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [restoreFailed, setRestoreFailed] = useState(false);
  const running = useRef(false);
  const pendingErase = useRef(false);
  const activeToken = useRef<string | null>(null);

  const restore = useCallback(async () => {
    if (running.current) return;
    running.current = true;
    setChecking(true);
    setRestoreFailed(false);
    setError("");
    try {
      if (pendingErase.current) {
        await tokenStorage.clear();
        pendingErase.current = false;
        return;
      }
      const token = await tokenStorage.read();
      if (token) {
        const user = await api.me(token);
        activeToken.current = token;
        setSession({ token, user });
      }
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
  }, [api, tokenStorage]);

  useEffect(() => { void restore(); }, [restore]);

  async function authenticate(request: () => Promise<Session>) {
    if (running.current) return;
    running.current = true;
    setBusy(true);
    setError("");
    try {
      const next = await request();
      await tokenStorage.write(next.token);
      activeToken.current = next.token;
      setSession(next);
    } catch (failure) {
      setError(apiMessage(failure));
    } finally {
      running.current = false;
      setBusy(false);
    }
  }

  const end = useCallback(async (token: string, expired = false) => {
    if (running.current || activeToken.current !== token) return;
    running.current = true;
    activeToken.current = null;
    setSession(null);
    setBusy(true);
    setError(expired ? "Deine Sitzung ist abgelaufen. Bitte erneut anmelden." : "");
    try {
      await tokenStorage.clear();
    } catch {
      pendingErase.current = true;
      setError("Die Sitzung konnte nicht vom Gerät entfernt werden.");
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
  }, [api, tokenStorage]);

  return { session, checking, busy, error, restoreFailed, restore, authenticate, end };
}
