"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LogIn, UserRound } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

type Profile = { name: string; email: string };

export function OptionalSignIn() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [profile, setProfile] = useState<Profile | null>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("munjez_profile");
      if (saved) setProfile(JSON.parse(saved));
    } catch { /* تبقى التجربة متاحة دون تسجيل */ }
  }, []);

  const signIn = (event: FormEvent) => {
    event.preventDefault();
    const nextProfile = { name: name.trim() || "مُنجِز", email: email.trim() };
    localStorage.setItem("munjez_profile", JSON.stringify(nextProfile));
    setProfile(nextProfile);
    setOpen(false);
    router.push("/tasks");
  };

  if (profile) {
    return <button className="account-button signed-in" onClick={() => router.push("/tasks")}><UserRound size={17} /><span>{profile.name}</span></button>;
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><button className="account-button"><LogIn size={17} /><span>تسجيل الدخول</span></button></DialogTrigger>
      <DialogContent className="account-dialog" dir="rtl">
        <DialogHeader>
          <DialogTitle>ابدأ رحلتك من هنا</DialogTitle>
          <DialogDescription>التسجيل اختياري في هذه النسخة التجريبية. بعده تنتقل مباشرة إلى لوحتك المختصرة.</DialogDescription>
        </DialogHeader>
        <form className="account-form" onSubmit={signIn}>
          <label>الاسم<input value={name} onChange={(event) => setName(event.target.value)} placeholder="كيف نناديك؟" autoComplete="name" /></label>
          <label>البريد الإلكتروني<input value={email} onChange={(event) => setEmail(event.target.value)} placeholder="name@example.com" type="email" autoComplete="email" required /></label>
          <button type="submit">الدخول إلى لوحتي <LogIn size={17} /></button>
          <small>هذه واجهة تجريبية؛ تُحفظ بيانات التجربة على جهازك فقط.</small>
        </form>
      </DialogContent>
    </Dialog>
  );
}
