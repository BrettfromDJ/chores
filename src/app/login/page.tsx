import { redirect } from "next/navigation";
import { getFamilyId } from "@/lib/auth/session";
import { dataMode } from "@/lib/data";
import { DEMO_EMAIL, DEMO_PASSWORD } from "@/lib/data/seed";
import { GlowStage } from "@/components/game";
import { Mascot } from "@/components/Mascot";
import { LoginForm } from "./LoginForm";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ confirmed?: string }> }) {
  if (await getFamilyId()) redirect("/");
  const { confirmed } = await searchParams;
  const demo = dataMode === "demo";
  return (
    <main className="game-bg flex min-h-dvh flex-col items-center justify-center overflow-hidden px-5 py-10">
      <GlowStage className="h-48 w-full max-w-sm">
        <div className="relative flex items-end">
          <Mascot creature="sproutle" size={92} className="-mr-4 animate-bob [animation-delay:.4s]" />
          <Mascot creature="embercub" size={130} className="relative z-10 animate-bob" />
          <Mascot creature="splashkit" size={92} className="-ml-4 animate-bob [animation-delay:.8s]" />
        </div>
      </GlowStage>
      <h1 className="text-game mt-2 text-6xl leading-none">
        Poké<span className="text-gold">Quest</span>
      </h1>
      <p className="mt-2 font-display text-xl text-cyan-glow drop-shadow-[0_2px_0_#14124a]">Real chores. Real XP. Real money.</p>

      <div className="panel mt-8 w-full max-w-sm p-5">
        <p className="text-game mb-4 text-xl">Parent sign in</p>
        {confirmed && <p className="mb-4 rounded-xl bg-mint/20 px-3 py-2 text-sm font-bold text-mint">Your email is confirmed. Sign in below.</p>}
        <LoginForm demo={demo} demoEmail={demo ? DEMO_EMAIL : ""} demoPassword={demo ? DEMO_PASSWORD : ""} />
      </div>

      {demo && <p className="mt-6 max-w-sm text-center text-xs font-bold text-white/55">Demo mode: data is saved on this server. Connect Supabase to enable real accounts.</p>}
    </main>
  );
}
