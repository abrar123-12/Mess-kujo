export interface ListingPhoto {
  id: string;
  listing_id: string;
  url: string;
  sort_order: number;
}

export interface Listing {
  id: string;
  owner_id: string | null;
  title: string;
  type: string;
  thana: string;
  ward: string;
  address: string | null;
  rent: number;
  phone: string;
  description: string | null;
  status: string;
  is_featured: boolean;
  featured_until: string | null;
  views: number;
  expires_at: string;
  created_at: string;
  listing_photos: ListingPhoto[];
}

export interface Profile {
  id: string;
  email: string | null;
  name: string | null;
  phone: string | null;
  role: string;
  created_at: string;
}

export interface DashboardListing extends Listing {
  inquiry_count: number;
  nudge_count: number;
}
