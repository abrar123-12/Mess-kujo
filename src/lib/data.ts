// চট্টগ্রাম সিটি — ১৬টি মেট্রো থানা (শুধু সিটি, উপজেলা নয়)
export const THANAS = [
  "Kotwali",
  "Panchlaish",
  "Chawkbazar",
  "Bakalia",
  "Chandgaon",
  "Bayezid",
  "Khulshi",
  "Double Mooring",
  "Halishahar",
  "Pahartali",
  "Akbar Shah",
  "EPZ",
  "Bandar",
  "Patenga",
  "Karnaphuli",
  "Sadarghat",
] as const;

// চট্টগ্রাম সিটি কর্পোরেশন — ৪১টি ওয়ার্ড (শুধু নাম, নম্বর ছাড়া)
export const WARDS = [
  "South Pahartali",
  "Jalalabad",
  "Panchlaish",
  "Chandgaon",
  "Mohra",
  "East Sholashahar",
  "West Sholashahar",
  "Sholokbahar",
  "North Pahartali",
  "North Kattali",
  "South Kattali",
  "Saraipara",
  "Pahartali",
  "Lalkhan Bazar",
  "Bagmaniram",
  "Chawkbazar",
  "West Bakalia",
  "East Bakalia",
  "South Bakalia",
  "Dewan Bazar",
  "Jamal Khan",
  "Enayet Bazar",
  "North Pathantooly",
  "North Agrabad",
  "Rampur",
  "North Halishahar",
  "South Agrabad",
  "Pathantooly",
  "West Madarbari",
  "East Madarbari",
  "Alkaran",
  "Andarkilla",
  "Firingee Bazar",
  "Patharghata",
  "Boxirhat",
  "Gosaildanga",
  "North Middle Halishahar",
  "South Middle Halishahar",
  "South Halishahar",
  "North Patenga",
  "South Patenga",
] as const;

export const LISTING_TYPES = [
  { value: "mess_seat", label: "মেস সিট" },
  { value: "sublet", label: "সাবলেট" },
  { value: "room", label: "রুম" },
] as const;

export type ListingTypeValue = (typeof LISTING_TYPES)[number]["value"];

export function typeLabel(t: string): string {
  return LISTING_TYPES.find((x) => x.value === t)?.label ?? t;
}

export function statusLabel(s: string): string {
  if (s === "active") return "চালু";
  if (s === "rented") return "ভাড়া হয়ে গেছে";
  if (s === "expired") return "মেয়াদ শেষ";
  return s;
}
