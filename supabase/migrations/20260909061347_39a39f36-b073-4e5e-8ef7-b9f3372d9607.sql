create policy "Owners can upload product images"
on storage.objects for insert to authenticated
with check (bucket_id = 'product-images' and public.has_role(auth.uid(), 'owner'));

create policy "Owners can update product images"
on storage.objects for update to authenticated
using (bucket_id = 'product-images' and public.has_role(auth.uid(), 'owner'))
with check (bucket_id = 'product-images' and public.has_role(auth.uid(), 'owner'));

create policy "Owners can delete product images"
on storage.objects for delete to authenticated
using (bucket_id = 'product-images' and public.has_role(auth.uid(), 'owner'));

create policy "Authenticated can view product images"
on storage.objects for select to authenticated
using (bucket_id = 'product-images');