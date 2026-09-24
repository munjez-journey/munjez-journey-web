"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { LogIn, UserRound } from "lucide-react";
import type { User } from "@supabase/supabase-js";
import { createUserClient } from "@/lib/supabase/userClient";

export function OptionalSignIn() {
  const [user, setUser] = useState<User | null>(null);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    const supabase = createUserClient();

    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
      setChecked(true);
    });

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.subscription.unsubscribe();
  }, []);

  if (!checked) return null;

  if (user) {
    const displayName = user.user_metadata?.full_name || user.user_metadata?.name || user.email || "حسابي";
    return (
      <Link className="account-button signed-in" href="/tasks">
        <UserRound size={17} />
        <span>{displayName}</span>
      </Link>
    );
  }

  return (
    <Link className="account-button" href="/tasks">
      <LogIn size={17} />
      <span>تسجيل الدخول</span>
    </Link>
  );
}
