import { supabase } from "@/integrations/supabase/client";

export const BUCKET = "product-images";

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

/** image_url can be a full http link (old data) or a storage path (new uploads). */
export async function resolveImageUrl(value?: string | null): Promise<string | null> {
  if (!value) return null;
  if (/^https?:\/\//i.test(value)) return value;
  const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(value, 60 * 60 * 24 * 7);
  if (error || !data?.signedUrl) return null;
  return data.signedUrl;
}
