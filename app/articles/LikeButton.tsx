"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Heart } from "lucide-react";
import { createUserClient } from "@/lib/supabase/userClient";

export default function LikeButton({
  articleId,
  initialCount,
}: {
  articleId: number;
  initialCount: number;
}) {
  const router = useRouter();
  const [liked, setLiked] = useState(false);
  const [count, setCount] = useState(initialCount);
  const [userId, setUserId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function checkOwnLike() {
      const supabase = createUserClient();
      const { data } = await supabase.auth.getUser();
      if (cancelled || !data.user) return;

      setUserId(data.user.id);

      const { data: existing } = await supabase
        .from("likes")
        .select("id")
        .eq("content_type", "article")
        .eq("content_id", articleId)
        .maybeSingle();

      if (!cancelled && existing) setLiked(true);
    }

    checkOwnLike();
    return () => {
      cancelled = true;
    };
  }, [articleId]);

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
    const wasLiked = liked;

    // تحديث تفاؤلي فوري
    setLiked(!wasLiked);
    setCount((c) => (wasLiked ? c - 1 : c + 1));

    const action = wasLiked
      ? supabase.from("likes").delete().eq("user_id", userId).eq("content_type", "article").eq("content_id", articleId)
      : supabase.from("likes").insert({ user_id: userId, content_type: "article", content_id: articleId });

    action.then(({ error }) => {
      if (error) {
        // رجوع دقيق للحالة الأصلية عند فشل المزامنة
        setLiked(wasLiked);
        setCount((c) => (wasLiked ? c + 1 : c - 1));
      }
      setBusy(false);
    });
  }

  return (
    <button type="button" className={`like-button${liked ? " liked" : ""}`} onClick={handleClick} aria-pressed={liked} aria-label={liked ? "إلغاء الإعجاب" : "إعجاب"}>
      <Heart size={16} fill={liked ? "currentColor" : "none"} />
      <span>{count}</span>
    </button>
  );
}
