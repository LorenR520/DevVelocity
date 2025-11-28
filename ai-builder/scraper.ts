/**
 * DevVelocity Documentation Scraper
 *
 * Purpose:
 *  - Pull cloud provider docs
 *  - Pull automation tool docs
 *  - Normalize → store in Supabase
 *  - Feed into AI Builder context
 *
 * This enables DevVelocity to stay updated WITHOUT human work.
 */

import { createClient } from "@supabase/supabase-js";

interface ProviderDoc {
  provider: string;
  url: string;
}

const PROVIDER_DOCS: ProviderDoc[] = [
  // CLOUD PROVIDERS
  { provider: "aws", url: "https://docs.aws.amazon.com/index.html" },
  { provider: "azure", url: "https://learn.microsoft.com/en-us/azure/" },
  { provider: "gcp", url: "https://cloud.google.com/docs" },
  { provider: "cloudflare", url: "https://developers.cloudflare.com/" },
  { provider: "oracle", url: "https://docs.oracle.com/en/cloud/" },
  { provider: "digitalocean", url: "https://docs.digitalocean.com/" },

  // AUTOMATION / AUTH / BILLING
  { provider: "supabase", url: "https://supabase.com/docs" },
  { provider: "stripe", url: "https://docs.stripe.com/" },
  { provider: "lemon", url: "https://docs.lemonsqueezy.com/" },

  // DEVOPS / PLATFORM
  { provider: "docker", url: "https://docs.docker.com/" },
  { provider: "nginx", url: "https://nginx.org/en/docs/" },
  { provider: "kubernetes", url: "https://kubernetes.io/docs/" },
  { provider: "terraform", url: "https://developer.hashicorp.com/terraform/docs" },
];

export async function runDocScraper(env: any) {
  const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_KEY);

  console.log("🔍 Running documentation scraper...");

  for (const doc of PROVIDER_DOCS) {
    try {
      console.log(`🌐 Fetching: ${doc.provider}`);

      const res = await fetch(doc.url);
      const html = await res.text();

      // Normalize → strip scripts, complex markup, images
      const cleaned = sanitize(html);

      // Store result
      await supabase.from("provider_docs").insert({
        provider: doc.provider,
        url: doc.url,
        content: cleaned,
        fetched_at: new Date().toISOString(),
      });

      console.log(`✅ Stored ${doc.provider} docs (${cleaned.length} chars)`);
    } catch (err) {
      console.error(`❌ Failed to fetch ${doc.provider}:`, err);
    }
  }

  console.log("🚀 Doc scrape completed.");
}

function sanitize(html: string) {
  return (
    html
      // remove script tags
      .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "")
      // remove style tags
      .replace(/<style[\s\S]*?>[\s\S]*?<\/style>/gi, "")
      // remove excessive whitespace
      .replace(/\s+/g, " ")
      // keep minimal readable text
      .trim()
  );
}
