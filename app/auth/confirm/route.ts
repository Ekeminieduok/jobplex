import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const tokenHash = request.nextUrl.searchParams.get("token_hash");
  const type = request.nextUrl.searchParams.get("type");

  const recovery = type === "recovery";

  const failureUrl = new URL("/auth/link-error", request.url);
  failureUrl.searchParams.set(
    "flow",
    recovery ? "recovery" : "confirmation",
  );

  function failureResponse() {
    const response = NextResponse.redirect(failureUrl);

    response.headers.set("Cache-Control", "no-store");
    response.headers.set("Referrer-Policy", "no-referrer");

    return response;
  }

  if (!tokenHash || (type !== "email" && type !== "recovery")) {
    return failureResponse();
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !key) {
    console.error("[Job Plex] Missing email verification configuration");
    return failureResponse();
  }

  const response = NextResponse.redirect(
    new URL(
      recovery ? "/reset-password" : "/dashboard",
      request.url,
    ),
  );

  response.headers.set("Cache-Control", "no-store");
  response.headers.set("Referrer-Policy", "no-referrer");

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },

      setAll(cookiesToSet) {
        for (const { name, value, options } of cookiesToSet) {
          request.cookies.set(name, value);
          response.cookies.set(name, value, options);
        }
      },
    },
  });

  try {
    const { error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type,
    });

    if (error) {
      console.error(
        "[Job Plex] Email verification failed:",
        error.code ?? "unknown",
      );

      const failure = failureResponse();

      for (const cookie of response.cookies.getAll()) {
        failure.cookies.set(cookie);
      }

      return failure;
    }

    return response;
  } catch {
    console.error("[Job Plex] Email verification request failed");
    return failureResponse();
  }
}