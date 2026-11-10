import { createServerClient } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  const code = request.nextUrl.searchParams.get("code");
  const origin = process.env.APP_ORIGIN ||
    (request.nextUrl.hostname === "localhost" || request.nextUrl.hostname === "127.0.0.1"
      ? request.nextUrl.origin
      : "https://brightharborawards.netlify.app");
  if (!url || !key || !code) return NextResponse.redirect(new URL("/login?error=invalid_link", origin));

  const response = NextResponse.redirect(new URL("/", origin));
  const supabase = createServerClient(url, key, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll(cookiesToSet, headers) {
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        for (const [name, value] of Object.entries(headers)) response.headers.set(name, value);
      },
    },
  });
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) return NextResponse.redirect(new URL("/login?error=invalid_link", origin));
  response.headers.set("Cache-Control", "private, no-store");
  return response;
}
