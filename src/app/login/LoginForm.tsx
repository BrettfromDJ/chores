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
          <span className="mb-1 block text-sm font-extrabold text-white/85">Family name</span>
          <input name="familyName" required maxLength={60} placeholder="The Rivera Family" className="game-input" />
        </label>
      )}
      <label className="block">
        <span className="mb-1 block text-sm font-extrabold text-white/85">Email</span>
        <input name="email" type="email" required autoComplete="email" defaultValue={demoEmail} className="game-input" />
      </label>
      <label className="block">
        <span className="mb-1 block text-sm font-extrabold text-white/85">Password</span>
        <input
          name="password"
          type="password"
          required
          autoComplete={mode === "in" ? "current-password" : "new-password"}
          defaultValue={demoPassword}
          className="game-input"
        />
      </label>

      {state?.message && (
        <p className={`rounded-xl px-3 py-2 text-sm font-bold ${state.ok ? "bg-mint/20 text-mint" : "bg-pink-500/20 text-pink-200"}`} role="status">
          {state.message}
        </p>
      )}

      <button type="submit" disabled={pending} className="btn-game btn-yellow mt-2 w-full !py-4 !text-2xl">
        {pending ? "Loading…" : mode === "in" ? "Let's go!" : "Create family"}
      </button>

      {demo ? (
        <p className="pt-1 text-center text-xs font-bold text-white/60">
          Demo account is pre-filled · Parent PIN <b className="font-display text-sm text-gold">1234</b>
        </p>
      ) : (
        <button type="button" onClick={() => setMode(mode === "in" ? "up" : "in")} className="w-full pt-1 text-center text-sm font-extrabold text-cyan-glow underline-offset-2 hover:underline">
          {mode === "in" ? "New here? Create a family account" : "Have an account? Sign in"}
        </button>
      )}
    </form>
  );
}
