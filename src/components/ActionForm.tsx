"use client";

import { useActionState, type ReactNode } from "react";

type State = { error?: string } | undefined;

/** Form wrapper for server actions that shows the returned error and disables submit while pending. */
export function ActionForm({
  action,
  submitLabel,
  children,
}: {
  action: (state: State, form: FormData) => Promise<State>;
  submitLabel: string;
  children: ReactNode;
}) {
  const [state, formAction, pending] = useActionState(action, undefined);
  return (
    <form action={formAction} className="form-narrow">
      {children}
      {state?.error && <p className="notice error">{state.error}</p>}
      <button className="btn" type="submit" disabled={pending}>
        {pending ? "Saving…" : submitLabel}
      </button>
    </form>
  );
}
