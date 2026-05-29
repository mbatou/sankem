"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { useSearchParams } from "next/navigation";
import { signIn } from "@/lib/actions/auth";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="btn-primary mt-2 w-full">
      {pending ? "Signing in…" : "Sign in"}
    </button>
  );
}

export function LoginForm() {
  const [state, formAction] = useActionState(signIn, undefined);
  const redirectTo = useSearchParams().get("redirect") ?? "/admin";

  return (
    <form action={formAction} className="mt-8 flex flex-col gap-3">
      <input type="hidden" name="redirect" value={redirectTo} />
      <label className="text-xs uppercase tracking-widest text-paper/50">
        Email
        <input
          name="email"
          type="email"
          autoComplete="username"
          required
          className="mt-1 w-full rounded-sm border border-paper/20 bg-ink-soft px-3 py-2.5 text-paper outline-none focus:border-gold"
        />
      </label>
      <label className="text-xs uppercase tracking-widest text-paper/50">
        Password
        <input
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className="mt-1 w-full rounded-sm border border-paper/20 bg-ink-soft px-3 py-2.5 text-paper outline-none focus:border-gold"
        />
      </label>
      {state?.error && (
        <p role="alert" className="text-sm text-red-400">
          {state.error}
        </p>
      )}
      <SubmitButton />
    </form>
  );
}
