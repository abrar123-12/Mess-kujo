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
  is_banned: boolean;
  banned_at: string | null;
  created_at: string;
}

export interface DashboardListing extends Listing {
  inquiry_count: number;
  nudge_count: number;
}

// অ্যাডমিন → ইউজার নোটিফিকেশন
// target_user_id NULL মানে: সব ইউজারের জন্য (ব্রডকাস্ট)
export interface Notification {
  id: string;
  title: string;
  message: string;
  target_user_id: string | null;
  created_by: string | null;
  created_at: string;
}

// ইন-অ্যাপ চ্যাট: একটা thread (প্রতি লিস্টিং-এ প্রতি ভাড়াটিয়ার ১টা)
export interface Conversation {
  id: string;
  listing_id: string;
  owner_id: string;
  renter_id: string;
  created_at: string;
  last_message_at: string;
}

export interface ChatMessage {
  id: string;
  conversation_id: string;
  sender_id: string;
  body: string;
  created_at: string;
}

// চ্যাট লিস্টের জন্য — লিস্টিং শিরোনাম + অপর পক্ষের নাম + শেষ মেসেজ সহ
export interface ConversationPreview extends Conversation {
  listing_title: string;
  other_name: string | null;
  last_message_body: string | null;
  last_message_sender_id: string | null;
  last_message_created_at: string | null;
  unread_count: number;
  /** true = আমি এই thread-এ মালিক */
  is_owner: boolean;
}

// চ্যাট থেকে ইউজার রিপোর্ট
export interface UserReport {
  id: string;
  reporter_id: string;
  reported_user_id: string;
  conversation_id: string | null;
  reason: string;
  details: string | null;
  status: "pending" | "reviewed" | "dismissed";
  created_at: string;
  reporter?: { name: string | null; phone: string | null } | null;
  reported?: { name: string | null; phone: string | null } | null;
}

// অ্যাডমিনের চ্যাট মনিটরিং — সব thread একসাথে
export interface AdminConversationPreview extends Conversation {
  listing_title: string;
  renter_name: string | null;
  owner_name: string | null;
  last_message_body: string | null;
  message_count: number;
}
