import { supabase } from "@/integrations/supabase/client";

export type MarketplaceListing = {
  id: string;
  title: string;
  description: string;
  category: string;
  size: string;
  city: string;
  item_value: number;
  price_per_day: number;
  condition: string;
  cleaning_method: string;
  cleaning_instructions: string;
  owner_id: string;
  status: string;
  created_at: string;
  photos: string[];
};

export const inr = (value: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);

export const friendlyError = (message: string) => {
  if (message.includes("Invalid login credentials")) return "That email and password don't match.";
  if (message.includes("User already registered")) return "An account already exists for this email. Sign in instead.";
  if (message.includes("VERIFY_REQUIRED")) return "Your identity check must be approved before accepting a request.";
  if (message.includes("Those dates are not available")) return "Those dates have just been reserved. Choose another range.";
  if (message.includes("Start date must be at least 2 days")) return "Choose a start date at least two days from today.";
  if (message.includes("Complete your profile")) return "Add your name, phone number and city in your profile first.";
  if (message.includes("Email not confirmed")) return "Confirm your email from the message we sent, then sign in.";
  return message || "Something went wrong. Please try again.";
};

export async function fetchListings(query?: { id?: string; ownerId?: string }) {
  let request = supabase
    .from("listings")
    .select("id,title,description,category,size,city,item_value,price_per_day,condition,cleaning_method,cleaning_instructions,owner_id,status,created_at")
    .order("created_at", { ascending: false });

  if (query?.id) request = request.eq("id", query.id);
  else if (query?.ownerId) request = request.eq("owner_id", query.ownerId);
  else request = request.eq("status", "active");

  const { data, error } = await request;
  if (error) throw error;
  const rows = data ?? [];
  const listings = await Promise.all(rows.map(async (listing) => {
    const { data: photos, error: photoError } = await supabase
      .from("listing_photos")
      .select("path,position")
      .eq("listing_id", listing.id)
      .order("position", { ascending: true });
    if (photoError) throw photoError;
    const signedPhotos = await Promise.all(
      (photos ?? []).map(async ({ path }) => {
        const { data: signed } = await supabase.storage.from("listing-photos").createSignedUrl(path, 60 * 60);
        return signed?.signedUrl ?? "";
      }),
    );
    return { ...listing, photos: signedPhotos.filter(Boolean) } as MarketplaceListing;
  }));
  return listings;
}

export const marketplaceError = (error: unknown) =>
  friendlyError(error instanceof Error ? error.message : "");