"use client";

import { useEffect, useRef, useState } from "react";

export interface LatLng {
  lat: number;
  lng: number;
}

const CTG: LatLng = { lat: 22.3569, lng: 91.7832 };

export default function LocationPicker({
  value,
  onChange,
}: {
  value: LatLng | null;
  onChange: (v: LatLng | null) => void;
}) {
  const mapDiv = useRef<HTMLDivElement>(null);
  const mapRef = useRef<import("leaflet").Map | null>(null);
  const markerRef = useRef<import("leaflet").Marker | null>(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  const [ready, setReady] = useState(false);
  const [locating, setLocating] = useState(false);
  const [geoError, setGeoError] = useState("");

  // ম্যাপ একবারই তৈরি হবে
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const L = await import("leaflet");
      await import("leaflet/dist/leaflet.css");
      if (cancelled || !mapDiv.current || mapRef.current) return;

      const map = L.map(mapDiv.current).setView([CTG.lat, CTG.lng], 12);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
      }).addTo(map);

      // ম্যাপে ক্লিক → মার্কার বসবে
      map.on("click", (e: L.LeafletMouseEvent) => {
        onChangeRef.current({
          lat: Number(e.latlng.lat.toFixed(6)),
          lng: Number(e.latlng.lng.toFixed(6)),
        });
      });

      mapRef.current = map;
      setReady(true);
    })();
    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
  }, []);

  // value বদলালে মার্কার আপডেট (divIcon — কোনো ইমেজ ফাইল লাগে না)
  useEffect(() => {
    if (!ready || !mapRef.current) return;
    (async () => {
      const L = await import("leaflet");
      const map = mapRef.current!;
      if (value) {
        if (!markerRef.current) {
          const icon = L.divIcon({
            className: "",
            html: `<div style="font-size:32px;line-height:1;filter:drop-shadow(0 2px 2px rgba(0,0,0,.4))">📍</div>`,
            iconSize: [32, 32],
            iconAnchor: [16, 30],
          });
          const m = L.marker([value.lat, value.lng], {
            icon,
            draggable: true,
          }).addTo(map);
          // টেনে সরালে লোকেশন আপডেট
          m.on("dragend", () => {
            const ll = m.getLatLng();
            onChangeRef.current({
              lat: Number(ll.lat.toFixed(6)),
              lng: Number(ll.lng.toFixed(6)),
            });
          });
          markerRef.current = m;
        } else {
          markerRef.current.setLatLng([value.lat, value.lng]);
        }
        map.setView([value.lat, value.lng], Math.max(map.getZoom(), 14));
      } else if (markerRef.current) {
        markerRef.current.remove();
        markerRef.current = null;
      }
    })();
  }, [ready, value]);

  const useMyLocation = () => {
    setGeoError("");
    if (!navigator.geolocation) {
      setGeoError("আপনার ব্রাউজার লোকেশন সাপোর্ট করে না");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocating(false);
        onChange({
          lat: Number(pos.coords.latitude.toFixed(6)),
          lng: Number(pos.coords.longitude.toFixed(6)),
        });
      },
      () => {
        setLocating(false);
        setGeoError("😕 লোকেশন পাওয়া যায়নি — ব্রাউজারে লোকেশন পারমিশন দিন");
      },
      { timeout: 12000 }
    );
  };

  return (
    <div>
      <div
        ref={mapDiv}
        className="relative z-0 h-64 w-full rounded-lg border border-slate-300"
      />
      <p className="mt-1 text-xs text-slate-500">
        💡 ম্যাপে ট্যাপ করে লোকেশন বসান, চাইলে পিন টেনে সরাতে পারবেন
      </p>
      <div className="mt-2 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={useMyLocation}
          disabled={locating}
          className="btn-secondary !px-3 !py-1.5 text-sm"
        >
          {locating ? "খুঁজছি..." : "📍 আমার বর্তমান লোকেশন"}
        </button>
        {value && (
          <button
            type="button"
            onClick={() => onChange(null)}
            className="btn-secondary !px-3 !py-1.5 text-sm"
          >
            ✖️ লোকেশন মুছুন
          </button>
        )}
      </div>
      {geoError && (
        <p className="mt-2 rounded-lg bg-red-50 p-2 text-sm text-red-700">
          {geoError}
        </p>
      )}
      {value && (
        <p className="mt-2 text-xs text-emerald-700">
          ✅ লোকেশন সেট: {value.lat}, {value.lng}
        </p>
      )}
    </div>
  );
}
