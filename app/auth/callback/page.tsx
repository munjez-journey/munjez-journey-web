"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createUserClient } from "@/lib/supabase/userClient";

function AuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState("");

  useEffect(() => {
    const next = searchParams.get("next") || "/tasks";
    const supabase = createUserClient();
    let cancelled = false;

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session && !cancelled) {
        router.replace(next);
      }
    });

    supabase.auth.getSession().then(({ data, error: sessionError }) => {
      if (cancelled) return;
      if (sessionError) {
        setError("تعذّر إتمام تسجيل الدخول بواسطة Google. حاول مرة أخرى.");
        return;
      }
      if (data.session) {
        router.replace(next);
      }
    });

    const timeout = setTimeout(() => {
      if (!cancelled) {
        setError("استغرق تسجيل الدخول وقتاً أطول من المتوقع. حاول مرة أخرى.");
      }
    }, 10000);

    return () => {
      cancelled = true;
      clearTimeout(timeout);
      subscription.subscription.unsubscribe();
    };
  }, [router, searchParams]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background px-6 text-center">
      {error ? (
        <>
          <p className="text-sm text-destructive" role="alert">{error}</p>
          <a href="/tasks" className="text-sm text-foreground underline">
            العودة لصفحة الدخول
          </a>
        </>
      ) : (
        <p className="text-sm text-muted-foreground">جارٍ إتمام تسجيل الدخول...</p>
      )}
    </main>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-background px-6">
          <p className="text-sm text-muted-foreground">جارٍ إتمام تسجيل الدخول...</p>
        </main>
      }
    >
      <AuthCallbackContent />
    </Suspense>
  );
}
