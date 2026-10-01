import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const loginUrl = request.nextUrl.clone();
  loginUrl.pathname = "/admin/login";
  loginUrl.search = "";

  const isLoginPage = request.nextUrl.pathname === "/admin/login";

  // محاولتان بالضبط: أي فشل غير واضح (شبكة/timeout) لا يُعامَل كـ "غير مصرَّح".
  // لا نُعيد التوجيه لصفحة الدخول إلا بردّ صريح: لا جلسة، أو الحساب ليس أدمن.
  // عند فشل التحقق مرتين نُمرّر الطلب، وlayout.tsx يعرض رسالة "تعذر التحقق"
  // مع زر إعادة المحاولة (والبيانات نفسها محمية بـ RLS في Supabase).
  let user = null;
  let userVerdict: "ok" | "no-session" | "unknown" = "unknown";
  for (let attempt = 0; attempt < 2 && userVerdict === "unknown"; attempt++) {
    try {
      const { data, error } = await supabase.auth.getUser();
      if (data.user) {
        user = data.user;
        userVerdict = "ok";
      } else if (!error || error.name === "AuthSessionMissingError" || error.status === 401 || error.status === 403) {
        userVerdict = "no-session";
      }
    } catch {
      // خطأ شبكة — نعيد المحاولة
    }
  }

  if (userVerdict === "no-session" && !isLoginPage) {
    return NextResponse.redirect(loginUrl);
  }

  if (user && !isLoginPage) {
    let isAdmin: boolean | null = null; // null = لم نتأكد
    for (let attempt = 0; attempt < 2 && isAdmin === null; attempt++) {
      try {
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .maybeSingle();
        if (!profileError) {
          isAdmin = profile?.role === "admin"; // لا صفّ = ليس أدمن (ردّ صريح)
        }
      } catch {
        // خطأ شبكة — نعيد المحاولة
      }
    }

    if (isAdmin === false) {
      loginUrl.search = "?error=unauthorized";
      return NextResponse.redirect(loginUrl);
    }
  }

  return response;
}

export const config = {
  matcher: ["/admin/:path*"],
};
