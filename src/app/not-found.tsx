import Link from "next/link";
import { PixelSprite } from "@/components/PixelSprite";

export default function NotFound() {
  return (
    <main className="bg-dots flex min-h-dvh flex-col items-center justify-center px-6 text-center">
      <PixelSprite creature="wispurr" size={88} className="animate-bob" />
      <p className="mt-6 font-pixel text-sm">A wild 404 appeared!</p>
      <p className="mt-3 font-semibold text-ink-mute">This path leads nowhere.</p>
      <Link href="/" className="pixel-btn mt-8" style={{ ["--btn" as string]: "#3d6cf0" }}>
        Run away
      </Link>
    </main>
  );
}
