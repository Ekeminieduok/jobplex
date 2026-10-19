import { createAdminClient } from "@/lib/supabase/admin";
import { refreshStoredSearch } from "@/lib/jobs/stored-search";

export const runtime = "nodejs";
export const maxDuration = 180;

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;

  if (!secret) {
    return Response.json(
      { error: "Refresh service is not configured" },
      { status: 503 },
    );
  }

  if (request.headers.get("authorization") !== `Bearer ${secret}`) {
    return Response.json(
      { error: "Unauthorized" },
      { status: 401 },
    );
  }

  const supabase = createAdminClient();
  const cutoff = new Date(
    Date.now() - 23 * 60 * 60 * 1000,
  ).toISOString();

  const { data: searches, error } = await supabase
    .from("job_searches")
    .select("query")
    .lt("refreshed_at", cutoff)
    .order("refreshed_at", { ascending: true })
    .limit(2);

  if (error) {
    return Response.json(
      { error: "Unable to load searches for refresh" },
      { status: 500 },
    );
  }

  let refreshed = 0;
  let failed = 0;

  for (const search of searches ?? []) {
    try {
      await refreshStoredSearch(search.query);
      refreshed += 1;
    } catch (error) {
      failed += 1;

      console.error(
        "[Job Plex] Scheduled refresh failed:",
        error instanceof Error ? error.message : "Unknown error",
      );
    }
  }

  return Response.json(
    {
      refreshed,
      failed,
      checkedAt: new Date().toISOString(),
    },
    {
      status: failed > 0 ? 503 : 200,
      headers: {
        "Cache-Control": "no-store",
      },
    },
  );

  
}