import Link from "next/link";
import { Mascot } from "@/components/Mascot";

export default function NotFound() {
  return (
    <main className="game-bg flex min-h-dvh flex-col items-center justify-center px-6 text-center">
      <Mascot creature="wispurr" size={130} className="animate-bob" />
      <p className="text-game mt-6 text-4xl">A wild 404 appeared!</p>
      <p className="mt-2 font-bold text-white/75">This path leads nowhere.</p>
      <Link href="/" className="btn-game btn-yellow mt-8 !px-8 !text-xl">
        Run away
      </Link>
    </main>
  );
}
