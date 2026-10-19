"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { unlockWithPin } from "@/app/actions/auth";

export function PinPad({ setup, next }: { setup: boolean; next: string }) {
  const [state, action, pending] = useActionState(unlockWithPin, null);
  const [pin, setPin] = useState("");
  const [first, setFirst] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const confirming = setup && first !== null;

  useEffect(() => {
    if (state && !state.ok) {
      setPin("");
      setFirst(null);
    }
  }, [state]);

  const press = (d: string) => setPin((p) => (p.length < 8 ? p + d : p));
  const back = () => setPin((p) => p.slice(0, -1));
  const submit = () => {
    if (pin.length < 4) return;
    if (setup && first === null) {
      setFirst(pin);
      setPin("");
      return;
    }
    formRef.current?.requestSubmit();
  };

  return (
    <form ref={formRef} action={action} className="mt-8">
      <input type="hidden" name="pin" value={setup ? (first ?? "") : pin} />
      <input type="hidden" name="confirm" value={pin} />
      <input type="hidden" name="next" value={next} />

      {setup && <p className="mb-3 text-center text-xs font-medium uppercase tracking-wide text-slate-400">{confirming ? "Confirm PIN" : "Choose 4–8 digits"}</p>}
      <div className="flex h-6 items-center justify-center gap-3" aria-live="polite" aria-label={`${pin.length} digits entered`}>
        {Array.from({ length: Math.max(4, pin.length) }, (_, i) => (
          <span key={i} className={`h-3 w-3 rounded-full transition ${i < pin.length ? "scale-110 bg-slate-900" : "bg-slate-200"}`} />
        ))}
      </div>
      <p className="mt-3 h-5 text-center text-sm font-medium text-red-600" role="alert">
        {state && !state.ok ? state.message : ""}
      </p>

      <div className="mt-4 grid grid-cols-3 gap-3">
        {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((d) => (
          <Key key={d} onClick={() => press(d)}>
            {d}
          </Key>
        ))}
        <Key onClick={back} aria-label="Delete">
          ⌫
        </Key>
        <Key onClick={() => press("0")}>0</Key>
        <button
          type="button"
          onClick={submit}
          disabled={pin.length < 4 || pending}
          className="h-16 rounded-2xl bg-slate-900 text-sm font-semibold text-white transition active:scale-95 disabled:opacity-30"
        >
          {pending ? "…" : setup && !confirming ? "Next" : "Enter"}
        </button>
      </div>
    </form>
  );
}

function Key(props: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button type="button" {...props} className="h-16 rounded-2xl bg-white text-2xl font-medium text-slate-900 shadow-sm ring-1 ring-slate-200 transition active:scale-95 active:bg-slate-100" />;
}
