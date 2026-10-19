"use client";

import { createContext, useActionState, useContext, useEffect, useState, useTransition } from "react";
import { deleteChild, deleteChore, deleteReward, saveChild, saveChore, saveReward, setDelivered } from "@/app/actions/parent";
import { CREATURES } from "@/lib/creatures";
import { Mascot } from "@/components/Mascot";
import { CardArt } from "@/components/CardArt";
import { Flash } from "./Flash";
import type { Child, Chore, Reward } from "@/lib/types";
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
  useCloseOnSuccess(state);
  return (
    <form action={action} className="space-y-4">
      {chore && <input type="hidden" name="id" value={chore.id} />}
      <input type="hidden" name="icon" value={icon} />
      <div className="grid gap-4 sm:grid-cols-[1fr_120px]">
        <label className="block">
          <Label>Quest name</Label>
          <input name="title" required maxLength={80} defaultValue={chore?.title} placeholder="Make your bed" className="field" />
        </label>
        <label className="block">
          <Label>XP reward</Label>
          <input name="xp" type="number" inputMode="numeric" min={1} max={1000} required defaultValue={chore?.xp ?? 10} className="field" />
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

/* ---------- Rewards ---------- */

export function RewardForm({ reward, kids, defaultChildId, nextOrder }: { reward?: Reward; kids: Child[]; defaultChildId?: string; nextOrder?: number }) {
  const [state, action, pending] = useActionState(saveReward, null);
  const [image, setImage] = useState(reward?.imageUrl ?? "art:embercub");
  const [title, setTitle] = useState(reward?.title ?? "");
  const [cost, setCost] = useState(reward?.xpCost ?? 200);
  const locked = !reward || reward.status === "locked";
  const custom = !image.startsWith("art:");
  useCloseOnSuccess(state);

  return (
    <form action={action} className="grid gap-5 sm:grid-cols-[140px_1fr]">
      {reward && <input type="hidden" name="id" value={reward.id} />}
      <input type="hidden" name="imageUrl" value={image} />
      <div className="mx-auto w-32 sm:w-full">
        <CardArt imageUrl={image || "art:embercub"} title={title || "Reward"} xpCost={cost} holo />
      </div>
      <div className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <Label>Reward</Label>
            <input name="title" required maxLength={80} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Booster pack" className="field" />
          </label>
          <label className="block">
            <Label>For</Label>
            <select name="childId" defaultValue={reward?.childId ?? defaultChildId ?? kids[0]?.id} disabled={!locked} className="field">
              {kids.map((k) => (
                <option key={k.id} value={k.id}>
                  {k.name}
                </option>
              ))}
            </select>
            {!locked && <input type="hidden" name="childId" value={reward!.childId} />}
          </label>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <label className="block">
            <Label>XP cost</Label>
            <input
              name="xpCost"
              type="number"
              inputMode="numeric"
              min={1}
              max={100000}
              required
              value={cost}
              onChange={(e) => setCost(Number(e.target.value))}
              readOnly={!locked}
              className="field read-only:bg-slate-50"
            />
          </label>
          <label className="block">
            <Label>Order</Label>
            <input name="sortOrder" type="number" min={0} max={1000} required defaultValue={reward?.sortOrder ?? nextOrder ?? 1} readOnly={!locked} className="field read-only:bg-slate-50" />
          </label>
        </div>
        <label className="block">
          <Label>Description (optional)</Label>
          <input name="description" maxLength={300} defaultValue={reward?.description} placeholder="Which card, where to buy it…" className="field" />
        </label>
        <div>
          <Label>Picture</Label>
          <div className="flex flex-wrap items-center gap-1.5">
            {CREATURES.map((c) => (
              <button
                type="button"
                key={c.id}
                onClick={() => setImage(`art:${c.id}`)}
                className={`rounded-lg p-1 transition ${image === `art:${c.id}` ? "bg-royal" : "bg-indigo-50 hover:bg-indigo-100"}`}
                aria-label={`${c.name} card art`}
                aria-pressed={image === `art:${c.id}`}
              >
                <Mascot creature={c.id} size={28} />
              </button>
            ))}
          </div>
          <input
            type="url"
            placeholder="…or paste a photo link (https://…)"
            value={custom ? image : ""}
            onChange={(e) => setImage(e.target.value || "art:embercub")}
            className="field mt-2 text-sm"
          />
        </div>
        {!locked && <p className="text-xs text-slate-500">This reward is unlocked, so its cost and owner can&apos;t change.</p>}
        <div className="flex justify-end gap-2 border-t border-indigo-50 pt-4">
          {reward && locked && <DeleteButton label="Delete" confirm={`Delete “${reward.title}”?`} run={() => deleteReward(reward.id)} />}
          <button className="btn-primary" disabled={pending}>
            {pending ? "Saving…" : reward ? "Save" : "Add reward"}
          </button>
        </div>
      </div>
      <Flash result={state} />
    </form>
  );
}

export function DeliveredToggle({ reward }: { reward: Reward }) {
  const [result, setResult] = useState<ActionResult | null>(null);
  const [pending, start] = useTransition();
  const delivered = reward.status === "delivered";
  return (
    <>
      <button
        className={delivered ? "btn-ghost" : "btn bg-amber-400 text-slate-900 hover:bg-amber-300"}
        disabled={pending}
        onClick={() => start(async () => setResult(await setDelivered(reward.id, !delivered)))}
      >
        {pending ? "…" : delivered ? "✓ Handed over" : "Mark handed over"}
      </button>
      <Flash result={result} />
    </>
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
        {child && <DeleteButton label="Remove" confirm={`Remove ${child.name}? Their XP, history and rewards are deleted.`} run={() => deleteChild(child.id)} />}
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
