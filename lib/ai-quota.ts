import { createClient } from "@/lib/supabase-server";
import { PROVIDER_BASE_URLS } from "@/lib/constants";
import type { ProviderConfig } from "@/lib/ai";

export type Supabase = Awaited<ReturnType<typeof createClient>>;

export async function getUserAiKey(
  supabase: Supabase
): Promise<ProviderConfig | null> {
  const { data: row } = await supabase
    .from("ai_keys")
    .select("id, provider, model, base_url")
    .maybeSingle();
  if (!row) return null;

  const master = process.env.JIRA_TOKEN_KEY;
  if (!master) return null;

  const { data: apiKey } = await supabase.rpc("decrypt_ai_key", {
    p_id: row.id,
    p_key: master,
  });
  if (!apiKey) return null;

  return {
    baseUrl:
      row.base_url || PROVIDER_BASE_URLS[row.provider] || PROVIDER_BASE_URLS.groq,
    apiKey,
    model: row.model,
  };
}