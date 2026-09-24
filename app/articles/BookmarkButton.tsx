"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Bookmark } from "lucide-react";
import { createUserClient } from "@/lib/supabase/userClient";
import type { LikeContentType } from "./LikeButton";

export default function BookmarkButton({
  contentType,
  contentId,
}: {
  contentType: LikeContentType;
  contentId: number;
}) {
  const router = useRouter();
  const [bookmarked, setBookmarked] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function checkOwnBookmark() {
      const supabase = createUserClient();
      const { data } = await supabase.auth.getUser();
      if (cancelled || !data.user) return;

      setUserId(data.user.id);

      const { data: existing } = await supabase
        .from("bookmarks")
        .select("id")
        .eq("content_type", contentType)
        .eq("content_id", contentId)
        .maybeSingle();

      if (!cancelled && existing) setBookmarked(true);
    }

    checkOwnBookmark();
    return () => {
      cancelled = true;
    };
  }, [contentType, contentId]);

  function handleClick(event: React.MouseEvent) {
    event.preventDefault();
    event.stopPropagation();

    if (!userId) {
      router.push("/tasks?login=1");
      return;
    }

    if (busy) return;
    setBusy(true);

    const supabase = createUserClient();
    const wasBookmarked = bookmarked;

    // تحديث تفاؤلي فوري
    setBookmarked(!wasBookmarked);

    const action = wasBookmarked
      ? supabase.from("bookmarks").delete().eq("user_id", userId).eq("content_type", contentType).eq("content_id", contentId)
      : supabase.from("bookmarks").insert({ user_id: userId, content_type: contentType, content_id: contentId });

    action.then(({ error }) => {
      if (error) {
        // رجوع دقيق للحالة الأصلية عند فشل المزامنة
        setBookmarked(wasBookmarked);
      }
      setBusy(false);
    });
  }

  return (
    <button type="button" className={`bookmark-button${bookmarked ? " bookmarked" : ""}`} onClick={handleClick} aria-pressed={bookmarked} aria-label={bookmarked ? "إلغاء الحفظ" : "حفظ"}>
      <Bookmark size={16} fill={bookmarked ? "currentColor" : "none"} />
    </button>
  );
}
