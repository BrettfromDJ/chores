"use client";

import { createContext, useActionState, useContext, useEffect, useState, useTransition } from "react";
import { deleteChild, deleteChore, moveMoney, saveChild, saveChore } from "@/app/actions/parent";
import { CREATURES } from "@/lib/creatures";
import { Mascot } from "@/components/Mascot";
import { Flash } from "./Flash";
import type { Child, Chore } from "@/lib/types";
import { money, parseCents } from "@/lib/money";
import type { ActionResult } from "@/lib/validate";

const ICONS = ["🛏️", "🪥", "🧸", "📚", "🍽️", "👕", "🧹", "🪴", "♻️", "🐶", "🐱", "🧺", "🚿", "🎒", "🥗", "🎹", "🧽", "🗑️", "🚲", "⭐"];
const COLORS = ["#e8423f", "#3d6cf0", "#38b26b", "#8a5cf6", "#f59e0b", "#ec4899", "#0ea5e9", "#1d1a2f"];

function Label({ children }: { children: React.ReactNode }) {
  return <span className="mb-1.5 block text-xs font-medium text-slate-600">{children}</span>;
}

const CloseContext = createContext<() => void>(() => {});

/** Collapses the surrounding <Editable> after a successful save. */
function useCloseOnSuccess(state: ActionResult | null) {
  const close = useContext(CloseContext);
  useEffect(() => {
    if (state?.ok) close();
  }, [state, close]);
}

/* ---------- Chores ---------- */

export function ChoreForm({ chore, kids }: { chore?: Chore; kids: Child[] }) {
  const [state, action, pending] = useActionState(saveChore, null);
  const [icon, setIcon] = useState(chore?.icon ?? "⭐");
  const [pay, setPay] = useState(chore?.amountCents ?? 50);
  useCloseOnSuccess(state);
  return (
    <form action={action} className="space-y-4">
      {chore && <input type="hidden" name="id" value={chore.id} />}
      <input type="hidden" name="icon" value={icon} />
      <div className="grid gap-4 sm:grid-cols-[1fr_150px]">
        <label className="block">
          <Label>Quest name</Label>
          <input name="title" required maxLength={80} defaultValue={chore?.title} placeholder="Make your bed" className="field" />
        </label>
        <label className="block">
          <Label>Pays (XP)</Label>
          <div className="relative">
            <input
              name="xp"
              type="number"
              inputMode="numeric"
              min={1}
              max={100000}
              required
              value={Number.isFinite(pay) ? pay : ""}
              onChange={(e) => setPay(Number(e.target.value))}
              className="field pr-16"
            />
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm font-medium text-emerald-600">{money(pay > 0 ? pay : 0)}</span>
          </div>
        </label>
      </div>
      <div>
        <Label>Icon</Label>
        <div className="flex flex-wrap gap-1.5">
          {ICONS.map((i) => (
            <button
              type="button"
              key={i}
              onClick={() => setIcon(i)}
              className={`flex h-9 w-9 items-center justify-center rounded-lg text-lg transition ${icon === i ? "bg-royal ring-2 ring-royal ring-offset-2" : "bg-indigo-50 hover:bg-indigo-100"}`}
              aria-pressed={icon === i}
            >
              {i}
            </button>
          ))}
        </div>
      </div>
      <label className="block">
        <Label>Details (optional)</Label>
        <input name="description" maxLength={300} defaultValue={chore?.description} placeholder="What does “done” look like?" className="field" />
      </label>
      <div className="grid gap-4 sm:grid-cols-2">
        <fieldset>
          <Label>Repeats</Label>
          <div className="flex gap-2">
            {(["daily", "weekly"] as const).map((f) => (
              <label key={f} className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-lg border border-indigo-100 px-3 py-2 text-sm font-medium capitalize has-[:checked]:border-royal has-[:checked]:bg-royal has-[:checked]:text-white">
                <input type="radio" name="frequency" value={f} defaultChecked={(chore?.frequency ?? "daily") === f} className="sr-only" />
                {f}
              </label>
            ))}
          </div>
        </fieldset>
        <fieldset>
          <Label>Assigned to</Label>
          <div className="flex flex-wrap gap-2">
            {kids.map((k) => (
              <label key={k.id} className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-indigo-100 px-3 py-2 text-sm font-medium has-[:checked]:border-royal has-[:checked]:bg-slate-50">
                <input type="checkbox" name="childIds" value={k.id} defaultChecked={chore ? chore.childIds.includes(k.id) : true} className="accent-royal" />
                <Mascot creature={k.creature} size={18} />
                {k.name}
              </label>
            ))}
          </div>
        </fieldset>
      </div>
      <div className="flex items-center justify-between gap-3 border-t border-indigo-50 pt-4">
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="active" defaultChecked={chore?.active ?? true} className="h-4 w-4 accent-royal" />
          Active
        </label>
        <div className="flex gap-2">
          {chore && <DeleteButton label="Delete" confirm={`Delete “${chore.title}”? History is kept.`} run={() => deleteChore(chore.id)} />}
          <button className="btn-primary" disabled={pending}>
            {pending ? "Saving…" : chore ? "Save" : "Add quest"}
          </button>
        </div>
      </div>
      <Flash result={state} />
    </form>
  );
}

/* ---------- Money ---------- */

/** Pay out cash or add a bonus for one kid. */
export function MoneyForm({ kid, balanceCents }: { kid: Child; balanceCents: number }) {
  const [state, action, pending] = useActionState(moveMoney, null);
  const [kind, setKind] = useState<"payout" | "bonus">("payout");
  const [amount, setAmount] = useState("");
  const cents = parseCents(amount);
  useEffect(() => {
    if (state?.ok) setAmount("");
  }, [state]);
  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="childId" value={kid.id} />
      <input type="hidden" name="kind" value={kind} />
      <div className="flex gap-2">
        {(
          [
            ["payout", "💵 Cash out"],
            ["bonus", "🎁 Add bonus"],
          ] as const
        ).map(([k, label]) => (
          <button
            type="button"
            key={k}
            onClick={() => setKind(k)}
            className={`flex-1 rounded-xl border px-3 py-2 text-sm font-semibold transition ${kind === k ? "border-royal bg-royal text-white" : "border-indigo-100 bg-white text-slate-700"}`}
            aria-pressed={kind === k}
          >
            {label}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-[1fr_1.4fr] gap-2">
        <label className="block">
          <Label>Amount ($)</Label>
          <input name="amount" inputMode="decimal" required placeholder="5.00" value={amount} onChange={(e) => setAmount(e.target.value)} className="field" />
        </label>
        <label className="block">
          <Label>Note (optional)</Label>
          <input name="note" maxLength={120} placeholder={kind === "payout" ? "Ice cream money" : "Birthday money"} className="field" />
        </label>
      </div>
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs text-slate-500">
          {Number.isFinite(cents) && cents > 0
            ? `${kind === "payout" ? "−" : "+"}${cents.toLocaleString("en-US")} XP${kind === "payout" && cents > balanceCents ? " · more than the wallet has" : ""}`
            : `Wallet: ${money(balanceCents)}`}
        </p>
        <button className="btn-primary" disabled={pending || (kind === "payout" && Number.isFinite(cents) && cents > balanceCents)}>
          {pending ? "Saving…" : kind === "payout" ? "Pay out" : "Add money"}
        </button>
      </div>
      <Flash result={state} />
    </form>
  );
}

/* ---------- Kids ---------- */

export function ChildForm({ child }: { child?: Child }) {
  const [state, action, pending] = useActionState(saveChild, null);
  const [creature, setCreature] = useState<string>(child?.creature ?? "embercub");
  const [color, setColor] = useState(child?.color ?? COLORS[0]);
  useCloseOnSuccess(state);
  return (
    <form action={action} className="space-y-4">
      {child && <input type="hidden" name="id" value={child.id} />}
      <input type="hidden" name="creature" value={creature} />
      <input type="hidden" name="color" value={color} />
      <div className="flex items-center gap-4">
        <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl" style={{ background: color }}>
          <Mascot creature={creature} size={52} />
        </span>
        <label className="block flex-1">
          <Label>Name</Label>
          <input name="name" required maxLength={40} defaultValue={child?.name} placeholder="Mia" className="field" />
        </label>
      </div>
      <div>
        <Label>Partner creature</Label>
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
          {CREATURES.map((c) => (
            <button
              type="button"
              key={c.id}
              onClick={() => setCreature(c.id)}
              className={`flex flex-col items-center rounded-xl border p-2 text-xs font-medium transition ${creature === c.id ? "border-royal bg-slate-50" : "border-indigo-100 hover:bg-slate-50"}`}
              aria-pressed={creature === c.id}
            >
              <Mascot creature={c.id} size={36} />
              {c.name}
            </button>
          ))}
        </div>
      </div>
      <div>
        <Label>Color</Label>
        <div className="flex flex-wrap gap-2">
          {COLORS.map((c) => (
            <button
              type="button"
              key={c}
              onClick={() => setColor(c)}
              className={`h-8 w-8 rounded-full transition ${color === c ? "ring-2 ring-royal ring-offset-2" : ""}`}
              style={{ background: c }}
              aria-label={`Color ${c}`}
              aria-pressed={color === c}
            />
          ))}
        </div>
      </div>
      <div className="flex justify-end gap-2 border-t border-indigo-50 pt-4">
        {child && <DeleteButton label="Remove" confirm={`Remove ${child.name}? Their wallet and history are deleted.`} run={() => deleteChild(child.id)} />}
        <button className="btn-primary" disabled={pending}>
          {pending ? "Saving…" : child ? "Save" : "Add kid"}
        </button>
      </div>
      <Flash result={state} />
    </form>
  );
}

/* ---------- Shared ---------- */

function DeleteButton({ label, confirm, run }: { label: string; confirm: string; run: () => Promise<ActionResult> }) {
  const [pending, start] = useTransition();
  const [result, setResult] = useState<ActionResult | null>(null);
  return (
    <>
      <button
        type="button"
        className="btn-danger"
        disabled={pending}
        onClick={() => {
          if (window.confirm(confirm)) start(async () => setResult(await run()));
        }}
      >
        {pending ? "…" : label}
      </button>
      <Flash result={result} />
    </>
  );
}

/** A collapsible editor row. */
export function Editable({ summary, children, defaultOpen = false }: { summary: React.ReactNode; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  const [close] = useState(() => () => setOpen(false));
  return (
    <div className="card overflow-hidden">
      <button type="button" onClick={() => setOpen(!open)} className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-slate-50/60" aria-expanded={open}>
        <div className="min-w-0 flex-1">{summary}</div>
        <span className={`text-slate-400 transition-transform ${open ? "rotate-180" : ""}`}>⌄</span>
      </button>
      {open && (
        <div className="border-t border-indigo-50 p-4">
          <CloseContext.Provider value={close}>{children}</CloseContext.Provider>
        </div>
      )}
    </div>
  );
}
