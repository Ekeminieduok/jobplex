import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;

  const failureUrl = new URL("/login", request.url);
  failureUrl.searchParams.set("auth_error", "callback_failed");

  function failedResponse() {
    const response = NextResponse.redirect(failureUrl);
    response.headers.set("Cache-Control", "no-store");
    return response;
  }

  if (params.has("error")) {
    return failedResponse();
  }

  const code = params.get("code");

  if (!code) {
    return failedResponse();
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return failedResponse();
  }

  const response = NextResponse.redirect(
    new URL("/dashboard", request.url),
  );
  response.headers.set("Cache-Control", "no-store");

  const supabase = createServerClient(
    supabaseUrl,
    supabaseKey,
    {
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
    },
  );

  try {
    const { error } =
      await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      console.error(
        "[Job Plex] Auth callback failed:",
        error.code ?? "unknown",
      );

      const failure = failedResponse();

      // Preserve any cookie cleanup performed during the exchange.
      for (const cookie of response.cookies.getAll()) {
        failure.cookies.set(cookie);
      }

      return failure;
    }

    return response;
  } catch {
    console.error("[Job Plex] Auth callback request failed");
    return failedResponse();
  }
}