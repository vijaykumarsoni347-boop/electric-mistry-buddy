import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const productSchema = z.object({
  name: z.string().min(1),
  sku: z.string().optional(),
  category: z.string().optional(),
  category_id: z.string().uuid().optional().nullable(),
  brand: z.string().optional(),
  image_url: z.string().url().optional().or(z.literal("")),
  stock_quantity: z.number().int().min(0),
  cost_price: z.number().min(0).optional().default(0),
  wholesale_price: z.number().min(0),
  retail_price: z.number().min(0),
  low_stock_threshold: z.number().int().min(0).optional().default(10),
});

const electricianSchema = z.object({
  name: z.string().min(1),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  address: z.string().optional(),
  commission_percent: z.number().min(0).max(100).optional().default(0),
});

const saleItemSchema = z.object({
  product_id: z.string().uuid(),
  quantity: z.number().int().min(1),
  retail_price: z.number().min(0),
  wholesale_price: z.number().min(0),
});

const saleSchema = z.object({
  customer_name: z.string().optional(),
  electrician_id: z.string().uuid().optional().nullable(),
  payment_mode: z.enum(["cash", "credit", "upi", "other"]).default("cash"),
  amount_paid: z.number().min(0).default(0),
  items: z.array(saleItemSchema).min(1),
});

export const getCategories = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase.from("categories").select("*").order("name");
    if (error) throw new Error(error.message);
    return data || [];
  });

export const createCategory = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => z.object({ name: z.string().min(1) }).parse(data))
  .handler(async ({ data, context }) => {
    const { data: cat, error } = await context.supabase
      .from("categories")
      .insert({ name: data.name.trim() })
      .select()
      .single();
    if (error) throw new Error(error.message.includes("duplicate") ? "Yeh category pehle se hai" : error.message);
    return cat;
  });

export const deleteCategory = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("categories").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { success: true };
  });

export const getProducts = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("products")
      .select("*")
      .order("name");
    if (error) throw new Error(error.message);
    return data || [];
  });

export const createProduct = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => productSchema.parse(data))
  .handler(async ({ data, context }) => {
    const { data: product, error } = await context.supabase
      .from("products")
      .insert({
        name: data.name,
        sku: data.sku || null,
        category: data.category || null,
        category_id: data.category_id || null,
        brand: data.brand || null,
        image_url: data.image_url || null,
        stock_quantity: data.stock_quantity,
        cost_price: data.cost_price,
        wholesale_price: data.wholesale_price,
        retail_price: data.retail_price,
        low_stock_threshold: data.low_stock_threshold,
      })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return product;
  });

export const updateProduct = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => productSchema.extend({ id: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    const { data: product, error } = await context.supabase
      .from("products")
      .update({
        name: data.name,
        sku: data.sku || null,
        category: data.category || null,
        category_id: data.category_id || null,
        brand: data.brand || null,
        stock_quantity: data.stock_quantity,
        wholesale_price: data.wholesale_price,
        retail_price: data.retail_price,
        low_stock_threshold: data.low_stock_threshold,
      })
      .eq("id", data.id)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return product;
  });

export const deleteProduct = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("products").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { success: true };
  });

export const getElectricians = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("electricians")
      .select("*")
      .eq("is_active", true)
      .order("name");
    if (error) throw new Error(error.message);
    return data || [];
  });

export const createElectrician = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => electricianSchema.parse(data))
  .handler(async ({ data, context }) => {
    const { data: electrician, error } = await context.supabase
      .from("electricians")
      .insert({
        name: data.name,
        phone: data.phone || null,
        email: data.email || null,
        address: data.address || null,
        commission_percent: data.commission_percent,
      })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return electrician;
  });

export const createElectricianAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) =>
    electricianSchema
      .extend({
        email: z.string().email(),
        password: z.string().min(6),
      })
      .parse(data)
  )
  .handler(async ({ data, context }) => {
    const { data: isOwner, error: roleError } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "owner",
    });
    if (roleError) throw new Error(roleError.message);
    if (!isOwner) throw new Error("Sirf owner mistri account bana sakta hai");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email: data.email,
      password: data.password,
      email_confirm: true,
      user_metadata: { name: data.name },
    });
    if (createError) throw new Error(createError.message);

    const userId = newUser.user.id;

    const { error: roleInsertError } = await supabaseAdmin
      .from("user_roles")
      .insert({ user_id: userId, role: "electrician" });
    if (roleInsertError) {
      await supabaseAdmin.auth.admin.deleteUser(userId);
      throw new Error(roleInsertError.message);
    }

    const { data: electrician, error: electricianError } = await supabaseAdmin
      .from("electricians")
      .insert({
        user_id: userId,
        name: data.name,
        phone: data.phone || null,
        email: data.email,
        address: data.address || null,
        commission_percent: data.commission_percent,
      })
      .select()
      .single();
    if (electricianError) {
      await supabaseAdmin.from("user_roles").delete().eq("user_id", userId);
      await supabaseAdmin.auth.admin.deleteUser(userId);
      throw new Error(electricianError.message);
    }

    return electrician;
  });

export const updateElectrician = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) =>
    electricianSchema
      .extend({
        id: z.string().uuid(),
        is_active: z.boolean().optional(),
      })
      .parse(data)
  )
  .handler(async ({ data, context }) => {
    const { data: electrician, error } = await context.supabase
      .from("electricians")
      .update({
        name: data.name,
        phone: data.phone || null,
        email: data.email || null,
        address: data.address || null,
        commission_percent: data.commission_percent,
        ...(data.is_active !== undefined ? { is_active: data.is_active } : {}),
      })
      .eq("id", data.id)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return electrician;
  });

export const deleteElectrician = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("electricians").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { success: true };
  });

export const createSale = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => saleSchema.parse(data))
  .handler(async ({ data, context }) => {
    const totalRetail = data.items.reduce((sum, item) => sum + item.retail_price * item.quantity, 0);
    const totalWholesale = data.items.reduce((sum, item) => sum + item.wholesale_price * item.quantity, 0);

    const { data: sale, error: saleError } = await context.supabase
      .from("sales")
      .insert({
        customer_name: data.customer_name || null,
        electrician_id: data.electrician_id || null,
        total_retail: totalRetail,
        total_wholesale: totalWholesale,
        payment_mode: data.payment_mode,
        amount_paid: data.amount_paid,
      })
      .select()
      .single();

    if (saleError) throw new Error(saleError.message);

    const saleItems = data.items.map((item) => ({
      sale_id: sale.id,
      product_id: item.product_id,
      quantity: item.quantity,
      retail_price: item.retail_price,
      wholesale_price: item.wholesale_price,
    }));

    const { error: itemsError } = await context.supabase.from("sale_items").insert(saleItems);
    if (itemsError) {
      await context.supabase.from("sales").delete().eq("id", sale.id);
      throw new Error(itemsError.message);
    }

    for (const item of data.items) {
      const { data: product, error: productError } = await context.supabase
        .from("products")
        .select("stock_quantity")
        .eq("id", item.product_id)
        .single();
      if (productError) throw new Error(productError.message);

      const newStock = (product?.stock_quantity || 0) - item.quantity;
      const { error: stockError } = await context.supabase
        .from("products")
        .update({ stock_quantity: newStock })
        .eq("id", item.product_id);
      if (stockError) throw new Error(stockError.message);
    }

    return { id: sale.id };
  });

export const getSales = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) =>
    z
      .object({
        start_date: z.string().optional(),
        end_date: z.string().optional(),
        electrician_id: z.string().uuid().optional(),
      })
      .parse(data)
  )
  .handler(async ({ data, context }) => {
    let query = context.supabase
      .from("sales")
      .select("*, sale_items(*, products(name)), electricians(name, phone)")
      .order("sale_date", { ascending: false });

    if (data.start_date) query = query.gte("sale_date", data.start_date);
    if (data.end_date) query = query.lt("sale_date", data.end_date);
    if (data.electrician_id) query = query.eq("electrician_id", data.electrician_id);

    const { data: sales, error } = await query;
    if (error) throw new Error(error.message);
    return sales || [];
  });

export const recordPayment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) =>
    z
      .object({
        electrician_id: z.string().uuid(),
        amount: z.number().min(0),
        payment_mode: z.enum(["cash", "credit", "upi", "other"]).default("cash"),
        notes: z.string().optional(),
      })
      .parse(data)
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("electrician_payments").insert({
      electrician_id: data.electrician_id,
      amount: data.amount,
      payment_mode: data.payment_mode,
      notes: data.notes || null,
    });
    if (error) throw new Error(error.message);
    return { success: true };
  });

export const getElectricianLedger = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) =>
    z
      .object({
        electrician_id: z.string().uuid(),
        start_date: z.string().optional(),
        end_date: z.string().optional(),
      })
      .parse(data)
  )
  .handler(async ({ data, context }) => {
    let salesQuery = context.supabase
      .from("sales")
      .select("*, sale_items(*, products(name))")
      .eq("electrician_id", data.electrician_id)
      .order("sale_date", { ascending: false });

    let paymentsQuery = context.supabase
      .from("electrician_payments")
      .select("*")
      .eq("electrician_id", data.electrician_id)
      .order("payment_date", { ascending: false });

    if (data.start_date) {
      salesQuery = salesQuery.gte("sale_date", data.start_date);
      paymentsQuery = paymentsQuery.gte("payment_date", data.start_date);
    }
    if (data.end_date) {
      salesQuery = salesQuery.lt("sale_date", data.end_date);
      paymentsQuery = paymentsQuery.lt("payment_date", data.end_date);
    }

    const [{ data: sales, error: salesError }, { data: payments, error: paymentsError }] =
      await Promise.all([salesQuery, paymentsQuery]);

    if (salesError) throw new Error(salesError.message);
    if (paymentsError) throw new Error(paymentsError.message);

    return { sales: sales || [], payments: payments || [] };
  });

export const getDashboardSummary = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) =>
    z
      .object({
        date: z.string().optional(),
      })
      .parse(data)
  )
  .handler(async ({ data, context }) => {
    const targetDate = data.date || new Date().toISOString().split("T")[0];
    const start = `${targetDate}T00:00:00+00:00`;
    const end = `${targetDate}T23:59:59+00:00`;

    const { data: sales, error: salesError } = await context.supabase
      .from("sales")
      .select("*, electricians(name)")
      .gte("sale_date", start)
      .lte("sale_date", end);

    if (salesError) throw new Error(salesError.message);

    const { data: payments, error: paymentsError } = await context.supabase
      .from("electrician_payments")
      .select("*")
      .gte("payment_date", start)
      .lte("payment_date", end);

    if (paymentsError) throw new Error(paymentsError.message);

    const { data: lowStock, error: stockError } = await context.supabase
      .from("products")
      .select("*")
      .lt("stock_quantity", 10);

    if (stockError) throw new Error(stockError.message);

    const totalRetail = (sales || []).reduce((sum, s) => sum + s.total_retail, 0);
    const totalWholesale = (sales || []).reduce((sum, s) => sum + s.total_wholesale, 0);
    const totalMargin = totalRetail - totalWholesale;
    const totalPayments = (payments || []).reduce((sum, p) => sum + p.amount, 0);

    const electricianMargin: Record<string, { name: string; margin: number }> = {};
    for (const sale of sales || []) {
      if (sale.electrician_id && sale.electricians) {
        const key = sale.electrician_id;
        if (!electricianMargin[key]) {
          electricianMargin[key] = { name: sale.electricians.name, margin: 0 };
        }
        electricianMargin[key].margin += sale.total_retail - sale.total_wholesale;
      }
    }

    return {
      totalSales: sales?.length || 0,
      totalRetail,
      totalWholesale,
      totalMargin,
      totalPayments,
      lowStock: lowStock || [],
      electricianMargin: Object.values(electricianMargin),
    };
  });

export const getDailySettlement = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) =>
    z
      .object({
        date: z.string().optional(),
      })
      .parse(data)
  )
  .handler(async ({ data, context }) => {
    const targetDate = data.date || new Date().toISOString().split("T")[0];
    const start = `${targetDate}T00:00:00+00:00`;
    const end = `${targetDate}T23:59:59+00:00`;

    const { data: electricians, error: electriciansError } = await context.supabase
      .from("electricians")
      .select("*")
      .eq("is_active", true);

    if (electriciansError) throw new Error(electriciansError.message);

    const { data: sales, error: salesError } = await context.supabase
      .from("sales")
      .select("*")
      .gte("sale_date", start)
      .lte("sale_date", end);

    if (salesError) throw new Error(salesError.message);

    const { data: payments, error: paymentsError } = await context.supabase
      .from("electrician_payments")
      .select("*")
      .gte("payment_date", start)
      .lte("payment_date", end);

    if (paymentsError) throw new Error(paymentsError.message);

    const settlement = (electricians || []).map((electrician) => {
      const electricianSales = (sales || []).filter((s) => s.electrician_id === electrician.id);
      const electricianPayments = (payments || []).filter((p) => p.electrician_id === electrician.id);
      const totalRetail = electricianSales.reduce((sum, s) => sum + s.total_retail, 0);
      const totalWholesale = electricianSales.reduce((sum, s) => sum + s.total_wholesale, 0);
      const margin = totalRetail - totalWholesale;
      const totalPaid = electricianPayments.reduce((sum, p) => sum + p.amount, 0);

      return {
        electrician,
        totalRetail,
        totalWholesale,
        margin,
        totalPaid,
        balance: margin - totalPaid,
        salesCount: electricianSales.length,
      };
    });

    return settlement;
  });
