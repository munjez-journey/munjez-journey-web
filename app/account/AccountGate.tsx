"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { createUserClient } from "@/lib/supabase/userClient";
import { PageFrame } from "@/components/site-chrome";
import AccountContent from "./AccountContent";

export default function AccountGate() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const supabase = createUserClient();

    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
      setChecking(false);
      if (!data.user) {
        router.push("/tasks?login=1");
      }
    });

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.subscription.unsubscribe();
  }, [router]);

  if (checking || !user) {
    return (
      <PageFrame>
        <p style={{ padding: "80px 0", textAlign: "center", color: "var(--muted)" }}>جارٍ التحقق من الدخول...</p>
      </PageFrame>
    );
  }

  return <AccountContent user={user} />;
}
