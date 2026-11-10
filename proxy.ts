import { createServerClient } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";

export async function proxy(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return NextResponse.next();

  let response = NextResponse.next({ request });
  const supabase = createServerClient(url, key, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll(cookiesToSet, headers) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        for (const [name, value] of Object.entries(headers)) response.headers.set(name, value);
      },
    },
  });

  const { data } = await supabase.auth.getClaims();
  const destination = request.nextUrl.pathname === "/login"
    ? data?.claims ? "/" : null
    : data?.claims ? null : "/login";
  if (!destination) return response;

  const redirect = NextResponse.redirect(new URL(destination, request.url));
  response.cookies.getAll().forEach((cookie) => redirect.cookies.set(cookie));
  for (const name of ["cache-control", "expires", "pragma"]) {
    const value = response.headers.get(name);
    if (value) redirect.headers.set(name, value);
  }
  return redirect;
}

export const config = { matcher: ["/", "/login"] };
