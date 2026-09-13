"use client";

import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { createUserClient } from "@/lib/supabase/userClient";
import TasksAuthScreen from "../tasks/TasksAuthScreen";
import PlatformShell from "./PlatformShell";

export default function PlatformGate() {
  const [user, setUser] = useState<User | null>(null);
  const [checking, setChecking] = useState(true);

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
    return <TasksAuthScreen onAuthenticated={setUser} />;
  }

  return <PlatformShell user={user} onSignOut={handleSignOut} />;
}
