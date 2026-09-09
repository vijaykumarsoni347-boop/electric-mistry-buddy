import { supabase } from "@/integrations/supabase/client";

export const BUCKET = "product-images";

/** Upload a photo and return the storage path stored in products.image_url */
export async function uploadProductImage(file: File): Promise<string> {
  const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
  const path = `${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    cacheControl: "3600",
    upsert: false,
    contentType: file.type || "image/jpeg",
  });
  if (error) throw new Error(error.message);
  return path;
}

const isHttp = (v: string) => /^https?:\/\//i.test(v);

/** Turn stored image_url values into displayable URLs (signed for storage paths). */
export async function resolveImageUrls(values: string[]): Promise<Record<string, string>> {
  const out: Record<string, string> = {};
  const paths: string[] = [];
  for (const v of values) {
    if (!v) continue;
    if (isHttp(v)) out[v] = v;
    else if (!paths.includes(v)) paths.push(v);
  }
  if (paths.length) {
    const { data } = await supabase.storage.from(BUCKET).createSignedUrls(paths, 60 * 60);
    for (const row of data ?? []) {
      if (row.path && row.signedUrl) out[row.path] = row.signedUrl;
    }
  }
  return out;
}
