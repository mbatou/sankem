"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isAdminEmail, isSupabaseConfigured } from "@/lib/auth";

export async function signIn(_prev: { error?: string } | undefined, formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const redirectTo = String(formData.get("redirect") ?? "/admin") || "/admin";

  if (!isSupabaseConfigured()) {
    return {
      error:
        "The server is not configured (missing Supabase environment variables). Set them in your hosting provider and redeploy.",
    };
  }
  if (!email || !password) {
    return { error: "Email and password are required." };
  }
  if (!isAdminEmail(email)) {
    return { error: "This account is not authorized for admin access." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    return { error: "Invalid email or password." };
  }

  // Only redirect within the admin area.
  redirect(redirectTo.startsWith("/admin") ? redirectTo : "/admin");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/admin/login");
}
