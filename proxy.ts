import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

function publishableKey(): string | null {
  return process.env.SUPABASE_PUBLISHABLE_KEY ?? process.env.SUPABASE_ANON_KEY ?? null;
}

function copyCookies(from: NextResponse, to: NextResponse): NextResponse {
  from.cookies.getAll().forEach((cookie) => {
    to.cookies.set(cookie);
  });
  return to;
}

/** Odświeża sesję Supabase i puszcza dalej tylko zalogowanych. */
export async function proxy(request: NextRequest) {
  const url = process.env.SUPABASE_URL;
  const key = publishableKey();
  let response = NextResponse.next({ request });
  const path = request.nextUrl.pathname;
  const isPublic = path === "/login" || path === "/api/health" || path === "/api/auth/login";

  if (!url || !key) {
    if (isPublic) return response;
    if (path.startsWith("/api")) {
      return NextResponse.json({ error: "Brak konfiguracji Supabase." }, { status: 503 });
    }
    const login = request.nextUrl.clone();
    login.pathname = "/login";
    login.search = "error=konfiguracja";
    return NextResponse.redirect(login);
  }

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, headers) {
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value);
        });
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
        Object.entries(headers ?? {}).forEach(([header, value]) => {
          response.headers.set(header, value);
        });
      },
    },
  });

  const { data } = await supabase.auth.getUser();
  const user = data.user;

  if (!user && !isPublic) {
    if (path.startsWith("/api")) {
      return copyCookies(response, NextResponse.json({ error: "Zaloguj się." }, { status: 401 }));
    }
    const login = request.nextUrl.clone();
    login.pathname = "/login";
    return copyCookies(response, NextResponse.redirect(login));
  }

  if (user && path === "/login") {
    const home = request.nextUrl.clone();
    home.pathname = "/";
    home.search = "";
    return copyCookies(response, NextResponse.redirect(home));
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
