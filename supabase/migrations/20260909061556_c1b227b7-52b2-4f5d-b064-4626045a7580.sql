
DROP POLICY IF EXISTS "product images readable" ON storage.objects;
DROP POLICY IF EXISTS "owners manage product images" ON storage.objects;

CREATE POLICY "product images readable"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'product-images');

CREATE POLICY "owners manage product images"
ON storage.objects FOR ALL TO authenticated
USING (bucket_id = 'product-images' AND public.has_role(auth.uid(), 'owner'))
WITH CHECK (bucket_id = 'product-images' AND public.has_role(auth.uid(), 'owner'));
