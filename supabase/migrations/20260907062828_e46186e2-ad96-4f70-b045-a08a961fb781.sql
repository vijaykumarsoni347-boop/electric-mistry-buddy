CREATE TABLE public.categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX categories_name_lower_key ON public.categories (lower(name));

GRANT SELECT, INSERT, UPDATE, DELETE ON public.categories TO authenticated;
GRANT ALL ON public.categories TO service_role;

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners can manage categories" ON public.categories FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'owner'::public.app_role))
  WITH CHECK (public.has_role(auth.uid(), 'owner'::public.app_role));

CREATE POLICY "Electricians can view categories" ON public.categories FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'electrician'::public.app_role));

CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON public.categories
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.products ADD COLUMN category_id uuid REFERENCES public.categories(id) ON DELETE SET NULL;
ALTER TABLE public.products ADD COLUMN brand text;

INSERT INTO public.categories (name)
SELECT DISTINCT trim(category) FROM public.products
WHERE category IS NOT NULL AND trim(category) <> ''
ON CONFLICT DO NOTHING;

UPDATE public.products p SET category_id = c.id
FROM public.categories c WHERE lower(trim(p.category)) = lower(c.name);