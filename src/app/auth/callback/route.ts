import { NextResponse, type NextRequest } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { supabaseEnabled, supabaseServer } from "@/lib/supabase/server";

/** Finishes email sign-up/confirmation links from Supabase and signs the parent in. */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  if (!supabaseEnabled) return NextResponse.redirect(`${origin}/login`);

  const db = await supabaseServer();
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;

  let ok = false;
  if (code) ok = !(await db.auth.exchangeCodeForSession(code)).error;
  else if (tokenHash && type) ok = !(await db.auth.verifyOtp({ token_hash: tokenHash, type })).error;

  // New accounts go straight to creating their parent PIN.
  return NextResponse.redirect(ok ? `${origin}/parent/unlock` : `${origin}/login?confirmed=1`);
}
