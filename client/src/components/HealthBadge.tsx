import { useEffect, useState } from "react";
import { api, ApiClientError } from "../services/api";
import type { HealthData } from "../types/api";

interface State {
  loading: boolean;
  data: HealthData | null;
  error: string | null;
}

const initialState: State = { loading: true, data: null, error: null };

export function HealthBadge(): JSX.Element {
  const [state, setState] = useState<State>(initialState);

  useEffect(() => {
    let cancelled = false;
    api
      .getHealth()
      .then((data) => {
        if (!cancelled) setState({ loading: false, data, error: null });
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        const message =
          err instanceof ApiClientError
            ? `${err.code}: ${err.message}`
            : err instanceof Error
              ? err.message
              : "Unknown error";
        setState({ loading: false, data: null, error: message });
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (state.loading) {
    return <span className="badge badge-pending">Checking API…</span>;
  }
  if (state.error || !state.data) {
    return (
      <span className="badge badge-error" title={state.error ?? undefined}>
        API unreachable
      </span>
    );
  }
  const { status, database } = state.data;
  const cls = status === "ok" && database.reachable ? "badge badge-ok" : "badge badge-warn";
  const label =
    status === "ok" && database.reachable
      ? `API ok · DB ok · env: ${state.data.environment}`
      : !database.configured
        ? `API ok · DB not configured · env: ${state.data.environment}`
        : `API ok · DB unreachable · env: ${state.data.environment}`;
  return <span className={cls} title={JSON.stringify(state.data, null, 2)}>{label}</span>;
}
