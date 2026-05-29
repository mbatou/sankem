import { Suspense } from "react";
import type { Metadata } from "next";
import { LoginForm } from "./login-form";
import { brand } from "@/config/brand";

export const metadata: Metadata = { title: "Admin sign in", robots: { index: false } };

export default function LoginPage() {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-ink px-5">
      <div className="w-full max-w-sm">
        <h1 className="font-serif text-3xl">{brand.name}</h1>
        <p className="mt-1 text-sm text-paper/50">Admin</p>
        <Suspense>
          <LoginForm />
        </Suspense>
      </div>
    </main>
  );
}
