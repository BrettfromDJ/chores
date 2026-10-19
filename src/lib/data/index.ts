import "server-only";
import { supabaseEnabled } from "../supabase/server";
import { demoRepo } from "./demo";
import { supabaseRepo } from "./supabase";

export const repo = supabaseEnabled ? supabaseRepo : demoRepo;
export const dataMode: "demo" | "supabase" = supabaseEnabled ? "supabase" : "demo";
