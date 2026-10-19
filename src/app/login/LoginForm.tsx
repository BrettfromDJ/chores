"use client";

import { useActionState, useState } from "react";
import { signIn, signUp } from "@/app/actions/auth";

export function LoginForm({ demo, demoEmail, demoPassword }: { demo: boolean; demoEmail: string; demoPassword: string }) {
  const [mode, setMode] = useState<"in" | "up">("in");
  const [inState, inAction, inPending] = useActionState(signIn, null);
  const [upState, upAction, upPending] = useActionState(signUp, null);
  const state = mode === "in" ? inState : upState;
  const pending = inPending || upPending;

  return (
    <form action={mode === "in" ? inAction : upAction} className="space-y-3">
      {mode === "up" && (
        <label className="block">
          <span className="mb-1 block text-sm font-bold">Family name</span>
          <input name="familyName" required maxLength={60} placeholder="The Rivera Family" className="field font-sans" />
        </label>
      )}
      <label className="block">
        <span className="mb-1 block text-sm font-bold">Email</span>
        <input name="email" type="email" required autoComplete="email" defaultValue={demoEmail} className="field font-sans" />
      </label>
      <label className="block">
        <span className="mb-1 block text-sm font-bold">Password</span>
        <input
          name="password"
          type="password"
          required
          autoComplete={mode === "in" ? "current-password" : "new-password"}
          defaultValue={demoPassword}
          className="field font-sans"
        />
      </label>

      {state?.message && (
        <p className={`rounded-md px-3 py-2 text-sm font-semibold ${state.ok ? "bg-leaf/15 text-leaf-dark" : "bg-berry/10 text-berry-dark"}`} role="status">
          {state.message}
        </p>
      )}

      <button type="submit" disabled={pending} className="pixel-btn w-[calc(100%-8px)] !py-4" style={{ ["--btn" as string]: "#e8423f" }}>
        {pending ? "Loading…" : mode === "in" ? "Press Start" : "Create family"}
      </button>

      {demo ? (
        <p className="pt-1 text-center text-xs text-ink-mute">
          Demo account is pre-filled · Parent PIN <b className="font-pixel text-[10px] text-ink">1234</b>
        </p>
      ) : (
        <button type="button" onClick={() => setMode(mode === "in" ? "up" : "in")} className="w-full pt-1 text-center text-sm font-bold text-sky-dark underline-offset-2 hover:underline">
          {mode === "in" ? "New here? Create a family account" : "Have an account? Sign in"}
        </button>
      )}
    </form>
  );
}
