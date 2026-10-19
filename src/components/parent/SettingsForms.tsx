"use client";

import { useActionState, useTransition, useState } from "react";
import { changePin, resetDemo } from "@/app/actions/parent";
import { Flash } from "./Flash";
import type { ActionResult } from "@/lib/validate";

export function PinForm() {
  const [state, action, pending] = useActionState(changePin, null);
  return (
    <form action={action} className="grid gap-3 sm:grid-cols-3">
      <input name="current" type="password" inputMode="numeric" autoComplete="off" placeholder="Current PIN" className="field" required />
      <input name="next" type="password" inputMode="numeric" autoComplete="off" placeholder="New PIN" pattern="\d{4,8}" className="field" required />
      <input name="confirm" type="password" inputMode="numeric" autoComplete="off" placeholder="Confirm" className="field" required />
      <div className="sm:col-span-3">
        <button className="btn-primary" disabled={pending}>
          {pending ? "Saving…" : "Update PIN"}
        </button>
      </div>
      <Flash result={state} />
    </form>
  );
}

export function ResetDemoButton() {
  const [pending, start] = useTransition();
  const [result, setResult] = useState<ActionResult | null>(null);
  return (
    <>
      <button
        className="btn-ghost shrink-0"
        disabled={pending}
        onClick={() => {
          if (confirm("Reset all demo data?")) start(async () => setResult(await resetDemo()));
        }}
      >
        {pending ? "Resetting…" : "Reset demo"}
      </button>
      <Flash result={result} />
    </>
  );
}
