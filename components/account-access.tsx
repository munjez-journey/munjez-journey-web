"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { LogIn, UserRound } from "lucide-react";
import type { User } from "@supabase/supabase-js";
import { createUserClient } from "@/lib/supabase/userClient";

export function OptionalSignIn() {
  const [user, setUser] = useState<User | null>(null);
  const [profileDisplayName, setProfileDisplayName] = useState<string | null>(null);
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

  useEffect(() => {
    if (!user) {
      setProfileDisplayName(null);
      return;
    }

    let cancelled = false;
    const supabase = createUserClient();

    supabase
      .from("profiles")
      .select("display_name")
      .eq("id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (!cancelled) setProfileDisplayName(data?.display_name ?? null);
      });

    return () => {
      cancelled = true;
    };
  }, [user]);

  if (!checked) return null;

  if (user) {
    const displayName =
      profileDisplayName || user.user_metadata?.full_name || user.user_metadata?.name || user.email || "حسابي";
    return (
      <Link className="account-button signed-in" href="/account">
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
