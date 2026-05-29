/**
 * Supabase database types.
 *
 * This file mirrors the schema in supabase/migrations and follows the shape
 * `supabase gen types typescript` produces, so it can be regenerated against a
 * linked project with:  `npm run gen:types`
 *
 * Kept hand-written here so the project is type-safe before a live project is
 * linked. Regenerate after any migration change to stay authoritative.
 */

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type ProductStatus = "draft" | "active" | "archived";
export type OrderStatus = "pending" | "paid" | "fulfilled" | "cancelled";

export interface Database {
  public: {
    Tables: {
      admins: {
        Row: { email: string; created_at: string };
        Insert: { email: string; created_at?: string };
        Update: { email?: string; created_at?: string };
        Relationships: [];
      };
      products: {
        Row: {
          id: string;
          name: string;
          slug: string;
          description: string;
          status: ProductStatus;
          base_price_xof: number;
          featured: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          description?: string;
          status?: ProductStatus;
          base_price_xof: number;
          featured?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["products"]["Insert"]>;
        Relationships: [];
      };
      product_images: {
        Row: {
          id: string;
          product_id: string;
          storage_path: string;
          alt: string;
          position: number;
        };
        Insert: {
          id?: string;
          product_id: string;
          storage_path: string;
          alt?: string;
          position?: number;
        };
        Update: Partial<Database["public"]["Tables"]["product_images"]["Insert"]>;
        Relationships: [];
      };
      product_variants: {
        Row: {
          id: string;
          product_id: string;
          name: string;
          sku: string | null;
          size: string | null;
          color: string | null;
          price_override_xof: number | null;
          stock_qty: number;
        };
        Insert: {
          id?: string;
          product_id: string;
          name: string;
          sku?: string | null;
          size?: string | null;
          color?: string | null;
          price_override_xof?: number | null;
          stock_qty?: number;
        };
        Update: Partial<Database["public"]["Tables"]["product_variants"]["Insert"]>;
        Relationships: [];
      };
      categories: {
        Row: { id: string; name: string; slug: string };
        Insert: { id?: string; name: string; slug: string };
        Update: Partial<Database["public"]["Tables"]["categories"]["Insert"]>;
        Relationships: [];
      };
      product_categories: {
        Row: { product_id: string; category_id: string };
        Insert: { product_id: string; category_id: string };
        Update: Partial<Database["public"]["Tables"]["product_categories"]["Insert"]>;
        Relationships: [];
      };
      orders: {
        Row: {
          id: string;
          order_number: string;
          customer_name: string;
          customer_phone: string;
          customer_email: string | null;
          shipping_address: Json;
          shipping_zone_id: string | null;
          status: OrderStatus;
          subtotal_xof: number;
          shipping_xof: number;
          total_xof: number;
          wave_payment_ref: string | null;
          wave_checkout_url: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          order_number: string;
          customer_name: string;
          customer_phone: string;
          customer_email?: string | null;
          shipping_address?: Json;
          shipping_zone_id?: string | null;
          status?: OrderStatus;
          subtotal_xof: number;
          shipping_xof?: number;
          total_xof: number;
          wave_payment_ref?: string | null;
          wave_checkout_url?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["orders"]["Insert"]>;
        Relationships: [];
      };
      order_items: {
        Row: {
          id: string;
          order_id: string;
          product_id: string | null;
          variant_id: string | null;
          product_name: string;
          variant_name: string | null;
          quantity: number;
          unit_price_xof: number;
          line_total_xof: number;
        };
        Insert: {
          id?: string;
          order_id: string;
          product_id?: string | null;
          variant_id?: string | null;
          product_name: string;
          variant_name?: string | null;
          quantity: number;
          unit_price_xof: number;
          line_total_xof: number;
        };
        Update: Partial<Database["public"]["Tables"]["order_items"]["Insert"]>;
        Relationships: [];
      };
    };
    Views: Record<never, never>;
    Functions: {
      is_admin: { Args: Record<string, never>; Returns: boolean };
      decrement_variant_stock: {
        Args: { p_variant_id: string; p_qty: number };
        Returns: undefined;
      };
    };
    Enums: {
      product_status: ProductStatus;
      order_status: OrderStatus;
    };
    CompositeTypes: Record<never, never>;
  };
}

// Convenience row aliases used across the app.
export type ProductRow = Database["public"]["Tables"]["products"]["Row"];
export type ProductImageRow = Database["public"]["Tables"]["product_images"]["Row"];
export type ProductVariantRow = Database["public"]["Tables"]["product_variants"]["Row"];
export type CategoryRow = Database["public"]["Tables"]["categories"]["Row"];
export type OrderRow = Database["public"]["Tables"]["orders"]["Row"];
export type OrderItemRow = Database["public"]["Tables"]["order_items"]["Row"];
