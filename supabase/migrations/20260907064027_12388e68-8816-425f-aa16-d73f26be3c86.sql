ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS image_url text,
  ADD COLUMN IF NOT EXISTS cost_price numeric NOT NULL DEFAULT 0;

UPDATE public.products SET cost_price = wholesale_price WHERE cost_price = 0;