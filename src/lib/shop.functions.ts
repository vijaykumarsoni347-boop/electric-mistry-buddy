import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { db } from "@/integrations/firebase";
import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  serverTimestamp,
  Timestamp
} from "firebase/firestore";

const productSchema = z.object({
  name: z.string().min(1),
  sku: z.string().optional(),
  barcode: z.string().optional(),
  category: z.string().optional(),
  category_id: z.string().optional().nullable(),
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
  product_id: z.string(),
  quantity: z.number().int().min(1),
  retail_price: z.number().min(0),
  wholesale_price: z.number().min(0),
});

const saleSchema = z.object({
  customer_name: z.string().optional(),
  electrician_id: z.string().optional().nullable(),
  payment_mode: z.enum(["cash", "credit", "upi", "other"]).default("cash"),
  amount_paid: z.number().min(0).default(0),
  items: z.array(saleItemSchema).min(1),
});

export const getCategories = createServerFn({ method: "GET" })
  .handler(async () => {
    const categoriesSnapshot = await getDocs(collection(db, "categories"));
    const categories = categoriesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    return categories.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
  });

export const createCategory = createServerFn({ method: "POST" })
  .validator((data) => z.object({ name: z.string().min(1) }).parse(data))
  .handler(async ({ data }) => {
    const categoryData = {
      name: data.name.trim(),
      created_at: serverTimestamp(),
    };
    const docRef = await addDoc(collection(db, "categories"), categoryData);
    return { id: docRef.id, ...categoryData };
  });

export const deleteCategory = createServerFn({ method: "POST" })
  .validator((data) => z.object({ id: z.string() }).parse(data))
  .handler(async ({ data }) => {
    await deleteDoc(doc(db, "categories", data.id));
    return { success: true };
  });

export const getProducts = createServerFn({ method: "GET" })
  .handler(async () => {
    const productsSnapshot = await getDocs(collection(db, "products"));
    const products = productsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    return products.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
  });

export const createProduct = createServerFn({ method: "POST" })
  .validator((data) => productSchema.parse(data))
  .handler(async ({ data }) => {
    const productData = {
      name: data.name,
      sku: data.sku || null,
      barcode: data.barcode?.trim() || null,
      category: data.category || null,
      category_id: data.category_id || null,
      brand: data.brand || null,
      image_url: data.image_url || null,
      stock_quantity: data.stock_quantity,
      cost_price: data.cost_price,
      wholesale_price: data.wholesale_price,
      retail_price: data.retail_price,
      low_stock_threshold: data.low_stock_threshold,
      created_at: serverTimestamp(),
      updated_at: serverTimestamp(),
    };
    const docRef = await addDoc(collection(db, "products"), productData);
    return { id: docRef.id, ...productData };
  });

export const updateProduct = createServerFn({ method: "POST" })
  .validator((data) => productSchema.extend({ id: z.string() }).parse(data))
  .handler(async ({ data }) => {
    const productRef = doc(db, "products", data.id);
    const productData = {
      name: data.name,
      sku: data.sku || null,
      barcode: data.barcode?.trim() || null,
      category: data.category || null,
      category_id: data.category_id || null,
      brand: data.brand || null,
      image_url: data.image_url || null,
      stock_quantity: data.stock_quantity,
      cost_price: data.cost_price,
      wholesale_price: data.wholesale_price,
      retail_price: data.retail_price,
      low_stock_threshold: data.low_stock_threshold,
      updated_at: serverTimestamp(),
    };
    await updateDoc(productRef, productData);
    const updatedDoc = await getDoc(productRef);
    return { id: updatedDoc.id, ...updatedDoc.data() };
  });

export const deleteProduct = createServerFn({ method: "POST" })
  .validator((data) => z.object({ id: z.string() }).parse(data))
  .handler(async ({ data }) => {
    await deleteDoc(doc(db, "products", data.id));
    return { success: true };
  });

export const getElectricians = createServerFn({ method: "GET" })
  .handler(async () => {
    const electriciansSnapshot = await getDocs(collection(db, "electricians"));
    const electricians = electriciansSnapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() }))
      .filter(e => e.is_active !== false);
    return electricians.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
  });

export const createElectrician = createServerFn({ method: "POST" })
  .validator((data) => electricianSchema.parse(data))
  .handler(async ({ data }) => {
    const electricianData = {
      name: data.name,
      phone: data.phone || null,
      email: data.email || null,
      address: data.address || null,
      commission_percent: data.commission_percent,
      is_active: true,
      created_at: serverTimestamp(),
      updated_at: serverTimestamp(),
    };
    const docRef = await addDoc(collection(db, "electricians"), electricianData);
    return { id: docRef.id, ...electricianData };
  });

export const createElectricianAccount = createServerFn({ method: "POST" })
  .validator((data) =>
    electricianSchema
      .extend({
        email: z.string().email(),
        password: z.string().min(6),
      })
      .parse(data)
  )
  .handler(async ({ data }) => {
    // This function would need Firebase Admin SDK to create user accounts
    // For now, we'll create the electrician record without Firebase auth
    const electricianData = {
      name: data.name,
      phone: data.phone || null,
      email: data.email,
      address: data.address || null,
      commission_percent: data.commission_percent,
      is_active: true,
      created_at: serverTimestamp(),
      updated_at: serverTimestamp(),
    };
    const docRef = await addDoc(collection(db, "electricians"), electricianData);
    return { id: docRef.id, ...electricianData };
  });

export const updateElectrician = createServerFn({ method: "POST" })
  .validator((data) =>
    electricianSchema
      .extend({
        id: z.string(),
        is_active: z.boolean().optional(),
      })
      .parse(data)
  )
  .handler(async ({ data }) => {
    const electricianRef = doc(db, "electricians", data.id);
    const electricianData = {
      name: data.name,
      phone: data.phone || null,
      email: data.email || null,
      address: data.address || null,
      commission_percent: data.commission_percent,
      ...(data.is_active !== undefined ? { is_active: data.is_active } : {}),
      updated_at: serverTimestamp(),
    };
    await updateDoc(electricianRef, electricianData);
    const updatedDoc = await getDoc(electricianRef);
    return { id: updatedDoc.id, ...updatedDoc.data() };
  });

export const deleteElectrician = createServerFn({ method: "POST" })
  .validator((data) => z.object({ id: z.string() }).parse(data))
  .handler(async ({ data }) => {
    await deleteDoc(doc(db, "electricians", data.id));
    return { success: true };
  });

export const createSale = createServerFn({ method: "POST" })
  .validator((data) => saleSchema.parse(data))
  .handler(async ({ data }) => {
    const totalRetail = data.items.reduce((sum, item) => sum + item.retail_price * item.quantity, 0);
    const totalWholesale = data.items.reduce((sum, item) => sum + item.wholesale_price * item.quantity, 0);

    const saleData = {
      customer_name: data.customer_name || null,
      electrician_id: data.electrician_id || null,
      total_retail: totalRetail,
      total_wholesale: totalWholesale,
      payment_mode: data.payment_mode,
      amount_paid: data.amount_paid,
      sale_date: serverTimestamp(),
      created_at: serverTimestamp(),
    };

    const saleRef = await addDoc(collection(db, "sales"), saleData);
    const saleId = saleRef.id;

    const saleItems = data.items.map((item) => ({
      sale_id: saleId,
      product_id: item.product_id,
      quantity: item.quantity,
      retail_price: item.retail_price,
      wholesale_price: item.wholesale_price,
    }));

    for (const item of saleItems) {
      await addDoc(collection(db, "sale_items"), item);
    }

    for (const item of data.items) {
      const productRef = doc(db, "products", item.product_id);
      const productDoc = await getDoc(productRef);
      if (!productDoc.exists()) throw new Error("Product not found");

      const currentStock = productDoc.data()?.stock_quantity || 0;
      const newStock = currentStock - item.quantity;
      await updateDoc(productRef, { stock_quantity: newStock, updated_at: serverTimestamp() });
    }

    return { id: saleId };
  });

export const getSales = createServerFn({ method: "POST" })
  .validator((data) =>
    z
      .object({
        start_date: z.string().optional(),
        end_date: z.string().optional(),
        electrician_id: z.string().optional(),
      })
      .parse(data)
  )
  .handler(async ({ data }) => {
    let salesQuery = query(collection(db, "sales"), orderBy("sale_date", "desc"));

    if (data.electrician_id) {
      salesQuery = query(salesQuery, where("electrician_id", "==", data.electrician_id));
    }

    const salesSnapshot = await getDocs(salesQuery);
    const sales = salesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    // Filter by date range on client side (simpler approach)
    let filteredSales = sales;
    if (data.start_date) {
      filteredSales = filteredSales.filter(s => {
        const saleDate = s.sale_date?.toDate?.() || new Date(s.sale_date);
        return saleDate >= new Date(data.start_date);
      });
    }
    if (data.end_date) {
      filteredSales = filteredSales.filter(s => {
        const saleDate = s.sale_date?.toDate?.() || new Date(s.sale_date);
        return saleDate < new Date(data.end_date);
      });
    }

    return filteredSales;
  });

export const recordPayment = createServerFn({ method: "POST" })
  .validator((data) =>
    z
      .object({
        electrician_id: z.string(),
        amount: z.number().min(0),
        payment_mode: z.enum(["cash", "credit", "upi", "other"]).default("cash"),
        notes: z.string().optional(),
      })
      .parse(data)
  )
  .handler(async ({ data }) => {
    const paymentData = {
      electrician_id: data.electrician_id,
      amount: data.amount,
      payment_mode: data.payment_mode,
      notes: data.notes || null,
      payment_date: serverTimestamp(),
      created_at: serverTimestamp(),
    };
    await addDoc(collection(db, "electrician_payments"), paymentData);
    return { success: true };
  });

export const getElectricianLedger = createServerFn({ method: "POST" })
  .validator((data) =>
    z
      .object({
        electrician_id: z.string(),
        start_date: z.string().optional(),
        end_date: z.string().optional(),
      })
      .parse(data)
  )
  .handler(async ({ data }) => {
    const salesQuery = query(
      collection(db, "sales"),
      where("electrician_id", "==", data.electrician_id),
      orderBy("sale_date", "desc")
    );

    const paymentsQuery = query(
      collection(db, "electrician_payments"),
      where("electrician_id", "==", data.electrician_id),
      orderBy("payment_date", "desc")
    );

    const [salesSnapshot, paymentsSnapshot] = await Promise.all([
      getDocs(salesQuery),
      getDocs(paymentsQuery)
    ]);

    let sales = salesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    let payments = paymentsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    // Filter by date range on client side
    if (data.start_date) {
      sales = sales.filter(s => {
        const saleDate = s.sale_date?.toDate?.() || new Date(s.sale_date);
        return saleDate >= new Date(data.start_date);
      });
      payments = payments.filter(p => {
        const paymentDate = p.payment_date?.toDate?.() || new Date(p.payment_date);
        return paymentDate >= new Date(data.start_date);
      });
    }
    if (data.end_date) {
      sales = sales.filter(s => {
        const saleDate = s.sale_date?.toDate?.() || new Date(s.sale_date);
        return saleDate < new Date(data.end_date);
      });
      payments = payments.filter(p => {
        const paymentDate = p.payment_date?.toDate?.() || new Date(p.payment_date);
        return paymentDate < new Date(data.end_date);
      });
    }

    return { sales, payments };
  });

export const getDashboardSummary = createServerFn({ method: "POST" })
  .validator((data) =>
    z
      .object({
        date: z.string().optional(),
      })
      .parse(data)
  )
  .handler(async ({ data }) => {
    const targetDate = data.date || new Date().toISOString().split("T")[0];
    const start = new Date(`${targetDate}T00:00:00+00:00`);
    const end = new Date(`${targetDate}T23:59:59+00:00`);

    const salesQuery = query(
      collection(db, "sales"),
      orderBy("sale_date", "desc")
    );

    const paymentsQuery = query(
      collection(db, "electrician_payments"),
      orderBy("payment_date", "desc")
    );

    const lowStockQuery = query(
      collection(db, "products"),
      where("stock_quantity", "<", 10)
    );

    const [salesSnapshot, paymentsSnapshot, lowStockSnapshot] = await Promise.all([
      getDocs(salesQuery),
      getDocs(paymentsQuery),
      getDocs(lowStockQuery)
    ]);

    const allSales = salesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    const allPayments = paymentsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    const lowStock = lowStockSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    // Filter sales and payments by date
    const sales = allSales.filter(s => {
      const saleDate = s.sale_date?.toDate?.() || new Date(s.sale_date);
      return saleDate >= start && saleDate <= end;
    });

    const payments = allPayments.filter(p => {
      const paymentDate = p.payment_date?.toDate?.() || new Date(p.payment_date);
      return paymentDate >= start && paymentDate <= end;
    });

    const totalRetail = sales.reduce((sum, s) => sum + (s.total_retail || 0), 0);
    const totalWholesale = sales.reduce((sum, s) => sum + (s.total_wholesale || 0), 0);
    const totalMargin = totalRetail - totalWholesale;
    const totalPayments = payments.reduce((sum, p) => sum + (p.amount || 0), 0);

    const electricianMargin: Record<string, { name: string; margin: number }> = {};
    for (const sale of sales) {
      if (sale.electrician_id) {
        const key = sale.electrician_id;
        if (!electricianMargin[key]) {
          electricianMargin[key] = { name: "Electrician", margin: 0 };
        }
        electricianMargin[key].margin += (sale.total_retail || 0) - (sale.total_wholesale || 0);
      }
    }

    return {
      totalSales: sales.length,
      totalRetail,
      totalWholesale,
      totalMargin,
      totalPayments,
      lowStock,
      electricianMargin: Object.values(electricianMargin),
    };
  });

export const getDailySettlement = createServerFn({ method: "POST" })
  .validator((data) =>
    z
      .object({
        date: z.string().optional(),
      })
      .parse(data)
  )
  .handler(async ({ data }) => {
    const targetDate = data.date || new Date().toISOString().split("T")[0];
    const start = new Date(`${targetDate}T00:00:00+00:00`);
    const end = new Date(`${targetDate}T23:59:59+00:00`);

    const electriciansSnapshot = await getDocs(
      query(collection(db, "electricians"), where("is_active", "==", true))
    );
    const electricians = electriciansSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    const salesQuery = query(collection(db, "sales"), orderBy("sale_date", "desc"));
    const paymentsQuery = query(collection(db, "electrician_payments"), orderBy("payment_date", "desc"));

    const [salesSnapshot, paymentsSnapshot] = await Promise.all([
      getDocs(salesQuery),
      getDocs(paymentsQuery)
    ]);

    const allSales = salesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    const allPayments = paymentsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    // Filter by date
    const sales = allSales.filter(s => {
      const saleDate = s.sale_date?.toDate?.() || new Date(s.sale_date);
      return saleDate >= start && saleDate <= end;
    });

    const payments = allPayments.filter(p => {
      const paymentDate = p.payment_date?.toDate?.() || new Date(p.payment_date);
      return paymentDate >= start && paymentDate <= end;
    });

    const settlement = electricians.map((electrician) => {
      const electricianSales = sales.filter((s) => s.electrician_id === electrician.id);
      const electricianPayments = payments.filter((p) => p.electrician_id === electrician.id);
      const totalRetail = electricianSales.reduce((sum, s) => sum + (s.total_retail || 0), 0);
      const totalWholesale = electricianSales.reduce((sum, s) => sum + (s.total_wholesale || 0), 0);
      const margin = totalRetail - totalWholesale;
      const totalPaid = electricianPayments.reduce((sum, p) => sum + (p.amount || 0), 0);

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
