create type public.app_role as enum ('owner', 'electrician');

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  role public.app_role not null,
  unique (user_id, role)
);

grant select, insert, delete on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;

create policy "Users can read own roles"
  on public.user_roles
  for select
  to authenticated
  using (auth.uid() = user_id);

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.user_roles
    where user_id = _user_id
      and role = _role
  )
$$;

create policy "Owners can manage roles"
  on public.user_roles
  for all
  to authenticated
  using (public.has_role(auth.uid(), 'owner'::public.app_role))
  with check (public.has_role(auth.uid(), 'owner'::public.app_role));

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  phone text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

grant select, insert, update, delete on public.profiles to authenticated;
grant all on public.profiles to service_role;
alter table public.profiles enable row level security;

create policy "Users can manage own profile"
  on public.profiles
  for all
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

create policy "Owners can view all profiles"
  on public.profiles
  for select
  to authenticated
  using (public.has_role(auth.uid(), 'owner'::public.app_role));

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, name)
  values (new.id, coalesce(new.raw_user_meta_data->>'name', new.email));
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create table public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  sku text,
  category text,
  stock_quantity integer not null default 0,
  wholesale_price numeric(12,2) not null,
  retail_price numeric(12,2) not null,
  low_stock_threshold integer not null default 10,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

grant select, insert, update, delete on public.products to authenticated;
grant all on public.products to service_role;
alter table public.products enable row level security;

create policy "Owners can manage products"
  on public.products
  for all
  to authenticated
  using (public.has_role(auth.uid(), 'owner'::public.app_role))
  with check (public.has_role(auth.uid(), 'owner'::public.app_role));

create policy "Electricians can view products"
  on public.products
  for select
  to authenticated
  using (public.has_role(auth.uid(), 'electrician'::public.app_role));

create table public.electricians (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  name text not null,
  phone text,
  email text,
  address text,
  commission_percent numeric(5,2) not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

grant select, insert, update, delete on public.electricians to authenticated;
grant all on public.electricians to service_role;
alter table public.electricians enable row level security;

create policy "Owners can manage electricians"
  on public.electricians
  for all
  to authenticated
  using (public.has_role(auth.uid(), 'owner'::public.app_role))
  with check (public.has_role(auth.uid(), 'owner'::public.app_role));

create policy "Electricians can view own record"
  on public.electricians
  for select
  to authenticated
  using (public.has_role(auth.uid(), 'electrician'::public.app_role) and user_id = auth.uid());

create or replace function public.get_electrician_id_for_user(_user_id uuid)
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select id from public.electricians where user_id = _user_id limit 1
$$;

create table public.sales (
  id uuid primary key default gen_random_uuid(),
  customer_name text,
  electrician_id uuid references public.electricians(id) on delete set null,
  total_retail numeric(12,2) not null default 0,
  total_wholesale numeric(12,2) not null default 0,
  payment_mode text not null default 'cash',
  amount_paid numeric(12,2) not null default 0,
  status text not null default 'completed',
  sale_date timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

grant select, insert, update, delete on public.sales to authenticated;
grant all on public.sales to service_role;
alter table public.sales enable row level security;

create policy "Owners can manage sales"
  on public.sales
  for all
  to authenticated
  using (public.has_role(auth.uid(), 'owner'::public.app_role))
  with check (public.has_role(auth.uid(), 'owner'::public.app_role));

create policy "Electricians can view own sales"
  on public.sales
  for select
  to authenticated
  using (
    public.has_role(auth.uid(), 'electrician'::public.app_role)
    and electrician_id = public.get_electrician_id_for_user(auth.uid())
  );

create table public.sale_items (
  id uuid primary key default gen_random_uuid(),
  sale_id uuid not null references public.sales(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete restrict,
  quantity integer not null,
  retail_price numeric(12,2) not null,
  wholesale_price numeric(12,2) not null,
  created_at timestamptz not null default now()
);

grant select, insert, update, delete on public.sale_items to authenticated;
grant all on public.sale_items to service_role;
alter table public.sale_items enable row level security;

create policy "Owners can manage sale items"
  on public.sale_items
  for all
  to authenticated
  using (public.has_role(auth.uid(), 'owner'::public.app_role))
  with check (public.has_role(auth.uid(), 'owner'::public.app_role));

create policy "Electricians can view own sale items"
  on public.sale_items
  for select
  to authenticated
  using (
    exists (
      select 1 from public.sales
      where sales.id = sale_items.sale_id
        and sales.electrician_id = public.get_electrician_id_for_user(auth.uid())
    )
  );

create table public.electrician_payments (
  id uuid primary key default gen_random_uuid(),
  electrician_id uuid not null references public.electricians(id) on delete cascade,
  amount numeric(12,2) not null,
  payment_mode text not null default 'cash',
  notes text,
  payment_date timestamptz not null default now(),
  created_at timestamptz not null default now()
);

grant select, insert, update, delete on public.electrician_payments to authenticated;
grant all on public.electrician_payments to service_role;
alter table public.electrician_payments enable row level security;

create policy "Owners can manage electrician payments"
  on public.electrician_payments
  for all
  to authenticated
  using (public.has_role(auth.uid(), 'owner'::public.app_role))
  with check (public.has_role(auth.uid(), 'owner'::public.app_role));

create policy "Electricians can view own payments"
  on public.electrician_payments
  for select
  to authenticated
  using (
    public.has_role(auth.uid(), 'electrician'::public.app_role)
    and electrician_id = public.get_electrician_id_for_user(auth.uid())
  );

create or replace function public.register_user(
  _user_id uuid,
  _role public.app_role,
  _email text
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  if exists (select 1 from public.user_roles where user_id = _user_id) then
    return false;
  end if;

  if _role = 'owner'::public.app_role then
    insert into public.user_roles (user_id, role) values (_user_id, 'owner'::public.app_role);
    return true;
  end if;

  if _role = 'electrician'::public.app_role then
    if exists (
      select 1 from public.electricians
      where email = _email and (user_id is null or user_id = _user_id)
    ) then
      insert into public.user_roles (user_id, role) values (_user_id, 'electrician'::public.app_role);
      update public.electricians
      set user_id = _user_id
      where email = _email and user_id is null;
      return true;
    else
      return false;
    end if;
  end if;

  return false;
end;
$$;

create or replace function public.update_updated_at_column()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger update_profiles_updated_at
  before update on public.profiles
  for each row execute function public.update_updated_at_column();

create trigger update_products_updated_at
  before update on public.products
  for each row execute function public.update_updated_at_column();

create trigger update_electricians_updated_at
  before update on public.electricians
  for each row execute function public.update_updated_at_column();

create trigger update_sales_updated_at
  before update on public.sales
  for each row execute function public.update_updated_at_column();

grant execute on function public.has_role(uuid, public.app_role) to authenticated;
grant execute on function public.get_electrician_id_for_user(uuid) to authenticated;
grant execute on function public.register_user(uuid, public.app_role, text) to authenticated;