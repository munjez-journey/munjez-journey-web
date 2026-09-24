"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { createUserClient } from "@/lib/supabase/userClient";
import TaskManager from "@/components/task-manager";
import TasksAuthScreen from "./TasksAuthScreen";
import TasksPreview from "./TasksPreview";

function TasksGateContent() {
  const searchParams = useSearchParams();
  const forceLogin = searchParams.get("login") === "1";

  const [user, setUser] = useState<User | null>(null);
  const [checking, setChecking] = useState(true);
  const [showAuthScreen, setShowAuthScreen] = useState(forceLogin);

  useEffect(() => {
    const supabase = createUserClient();

    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
      setChecking(false);
    });

    const { data: subscription } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
      }
    );

    return () => subscription.subscription.unsubscribe();
  }, []);

  async function handleSignOut() {
    const supabase = createUserClient();
    await supabase.auth.signOut();
    setUser(null);
  }

  if (checking) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-muted-foreground">جارٍ التحقق من الدخول...</p>
      </main>
    );
  }

  if (!user) {
    if (showAuthScreen) {
      return <TasksAuthScreen onAuthenticated={setUser} />;
    }
    return <TasksPreview onRequestAuth={() => setShowAuthScreen(true)} />;
  }

  return (
    <div>
      <div className="flex items-center justify-end gap-3 border-b border-border bg-background px-6 py-3">
        <span className="text-sm text-muted-foreground" dir="ltr">
          {user.email}
        </span>
        <button
          onClick={handleSignOut}
          className="border border-border px-4 py-1.5 text-sm text-foreground transition-opacity hover:opacity-70"
        >
          تسجيل الخروج
        </button>
      </div>
      <TaskManager />
    </div>
  );
}

export default function TasksGate() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-background">
          <p className="text-muted-foreground">جارٍ التحقق من الدخول...</p>
        </main>
      }
    >
      <TasksGateContent />
    </Suspense>
  );
}
