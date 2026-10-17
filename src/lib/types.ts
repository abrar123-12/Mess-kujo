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
  lat: number | null;
  lng: number | null;
  listing_photos: ListingPhoto[];
}

// nearby_listings RPC রেজাল্ট (distance_km সহ)
export interface NearbyListing extends Listing {
  distance_km: number;
}

export interface Feedback {
  id: string;
  user_id: string | null;
  type: string;
  message: string;
  created_at: string;
  profiles: { name: string | null; phone: string | null } | null;
}

// অ্যাডমিন প্যানেল: যোগাযোগ (inquiry) লগ
export interface Inquiry {
  id: string;
  listing_id: string;
  from_user_id: string | null;
  message: string | null;
  created_at: string;
  listings: { title: string } | null;
  profiles: { name: string | null; phone: string | null } | null;
}

// অ্যাডমিন প্যানেল: ভাড়া-পরবর্তী রেটিং
export interface RentalFeedback {
  id: string;
  listing_id: string;
  rater_id: string | null;
  stars: number;
  comment: string | null;
  created_at: string;
  listings: { title: string } | null;
  profiles: { name: string | null; phone: string | null } | null;
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
