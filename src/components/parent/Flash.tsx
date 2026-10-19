"use client";

import { useEffect, useState } from "react";
import type { ActionResult } from "@/lib/validate";

/* Tiny global toast so messages survive the form that produced them unmounting. */

type Listener = (r: ActionResult) => void;
const listeners = new Set<Listener>();

export function toast(result: ActionResult) {
  if (result.message) listeners.forEach((l) => l(result));
}

/** Drop-in: forwards a server action result to the toaster. */
export function Flash({ result }: { result: ActionResult | null }) {
  useEffect(() => {
    if (result) toast(result);
  }, [result]);
  return null;
}

export function Toaster() {
  const [shown, setShown] = useState<(ActionResult & { key: number }) | null>(null);
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const listener: Listener = (r) => {
      setShown({ ...r, key: Date.now() });
      clearTimeout(timer);
      timer = setTimeout(() => setShown(null), 3500);
    };
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
      clearTimeout(timer);
    };
  }, []);
  if (!shown?.message) return null;
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-[max(1.25rem,env(safe-area-inset-bottom))] z-50 flex justify-center px-4">
      <p
        key={shown.key}
        role="status"
        className={`animate-slide-up rounded-xl px-4 py-3 text-sm font-medium shadow-lg ${shown.ok ? "bg-royal text-white" : "bg-red-600 text-white"}`}
      >
        {shown.message}
      </p>
    </div>
  );
}
