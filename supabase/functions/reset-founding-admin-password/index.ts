import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function json(body: Record<string, unknown>, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function generatePassword(): string {
  const alphabet =
    "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
  const bytes = new Uint8Array(24);
  crypto.getRandomValues(bytes);
  let password = "";
  for (const byte of bytes) {
    password += alphabet[byte % alphabet.length];
  }
  return password;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object";
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return json({ ok: false, code: "method_not_allowed" }, 405);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const anonKey =
    Deno.env.get("SUPABASE_ANON_KEY") ??
    Deno.env.get("SUPABASE_PUBLISHABLE_KEY");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !anonKey || !serviceKey) {
    return json({ ok: false, code: "provisioning_unavailable" }, 500);
  }

  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    return json({ ok: false, code: "forbidden" }, 403);
  }

  let body: unknown;
  try {
    const text = await req.text();
    if (text.length > 8000) {
      return json({ ok: false, code: "invalid_request" }, 400);
    }
    body = JSON.parse(text);
  } catch {
    return json({ ok: false, code: "invalid_request" }, 400);
  }
  if (!isRecord(body) || "password" in body) {
    return json(
      {
        ok: false,
        code: "password" in (body ?? {})
          ? "password_not_accepted"
          : "invalid_request",
      },
      400,
    );
  }

  const provisioningId = body.provisioning_id;
  if (typeof provisioningId !== "string" || !UUID_PATTERN.test(provisioningId)) {
    return json({ ok: false, code: "invalid_request" }, 400);
  }

  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: isOwner, error: ownerError } = await userClient.rpc(
    "is_platform_owner",
  );
  if (ownerError || isOwner !== true) {
    return json({ ok: false, code: "forbidden" }, 403);
  }

  const admin = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: row, error: readError } = await admin.rpc(
    "read_provisioning_for_service",
    { p_provisioning_id: provisioningId },
  );
  if (readError || !isRecord(row)) {
    return json({ ok: false, code: "not_found" }, 404);
  }
  if (row.state !== "linked" || typeof row.auth_user_id !== "string") {
    return json({ ok: false, code: "not_linked" }, 409);
  }

  const password = generatePassword();
  const updated = await admin.auth.admin.updateUserById(row.auth_user_id, {
    password,
  });
  if (updated.error) {
    return json({ ok: false, code: "auth_failed" }, 500);
  }

  const flagged = await admin.rpc("require_founding_admin_password_change", {
    p_provisioning_id: provisioningId,
    p_auth_user_id: row.auth_user_id,
  });
  if (flagged.error) {
    return json({ ok: false, code: "unrelated_user" }, 403);
  }

  if (row.handoff !== "issued") {
    const handed = await admin.rpc("mark_provision_handoff", {
      p_provisioning_id: provisioningId,
    });
    if (handed.error) {
      return json({ ok: false, code: "link_failed" }, 500);
    }
  }

  return json({ ok: true, status: "issued", password });
});
