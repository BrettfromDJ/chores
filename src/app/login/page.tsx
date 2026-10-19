import { redirect } from "next/navigation";
import { getFamilyId } from "@/lib/auth/session";
import { dataMode } from "@/lib/data";
import { DEMO_EMAIL, DEMO_PASSWORD } from "@/lib/data/seed";
import { PixelSprite } from "@/components/PixelSprite";
import { LoginForm } from "./LoginForm";

export default async function LoginPage() {
  if (await getFamilyId()) redirect("/");
  const demo = dataMode === "demo";
  return (
    <main className="bg-dots relative flex min-h-dvh flex-col items-center justify-center px-5 py-10">
      <div className="mb-6 flex items-end gap-2">
        <PixelSprite creature="embercub" size={56} className="animate-bob" />
        <PixelSprite creature="splashkit" size={64} className="animate-bob [animation-delay:.3s]" />
        <PixelSprite creature="sproutle" size={56} className="animate-bob [animation-delay:.6s]" />
      </div>
      <h1 className="font-pixel text-2xl leading-tight text-ink drop-shadow-[3px_3px_0_#ffcc33]">PokéQuest</h1>
      <p className="mt-3 max-w-xs text-center text-[15px] font-semibold text-ink-soft">Real chores. Real XP. Real card rewards.</p>

      <div className="pixel-box mt-8 w-full max-w-sm p-5">
        <p className="pixel-label mb-4 text-ink-mute">Parent sign in</p>
        <LoginForm demo={demo} demoEmail={demo ? DEMO_EMAIL : ""} demoPassword={demo ? DEMO_PASSWORD : ""} />
      </div>

      {demo && (
        <p className="mt-6 max-w-sm text-center text-xs text-ink-mute">
          Demo mode — data is stored on this server in <code>.data/</code>. Connect Supabase to enable real accounts.
        </p>
      )}
    </main>
  );
}
