import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { Medicine } from "./types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * High-quality Unsplash fallback — professional medicine/healthcare image.
 * Used when the real pharma company image is broken, 404, or CORS-blocked.
 */
const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&q=80&w=500";

/**
 * Extracts the best available image URL from a medicine object.
 *
 * Priority order:
 *   1. `medicine.image`       – most common key from the DB schema
 *   2. `medicine.image_url`   – user_medicines.json format
 *   3. `medicine.imageUrl`    – frontend / camelCase variant
 *   4. `medicine.ImageURL`    – edge-case PascalCase variant
 *
 * If the resolved path is a relative public-folder path without a leading
 * slash (e.g. `images/medicines/napa.jpg`) it is normalized to `/images/…`.
 *
 * When no image key exists at all, falls back to the Unsplash placeholder.
 */
export function getMedicineImageUrl(medicine: any): string {
  if (!medicine) return FALLBACK_IMAGE;

  const imgPath =
    medicine.image || medicine.image_url || medicine.imageUrl || medicine.ImageURL;

  if (imgPath && typeof imgPath === "string" && imgPath.trim() !== "") {
    // Relative public path without leading slash
    if (imgPath.startsWith("images/")) {
      return `/${imgPath}`;
    }

    // External URL: route through backend proxy to bypass CORS/hotlinking
    if (imgPath.startsWith("http")) {
      const name = encodeURIComponent(medicine.name || "");
      const brand = encodeURIComponent(medicine.brand || "");
      const category = encodeURIComponent(medicine.category || "");
      return `http://localhost:5001/api/images/proxy?url=${encodeURIComponent(imgPath)}&name=${name}&brand=${brand}&category=${category}`;
    }

    return imgPath;
  }

  // No image found — use the Unsplash fallback
  return FALLBACK_IMAGE;
}

/**
 * <img> onError handler.
 *
 * When a real pharma URL fails to load (404, CORS, hotlink block, etc.)
 * this swaps the `src` to the Unsplash fallback so the UI never shows a
 * broken-image icon.
 *
 * `onerror` is set to `null` first to prevent an infinite loop in case
 * the fallback itself ever fails.
 */
export function handleMedicineImgError(
  e: React.SyntheticEvent<HTMLImageElement, Event>,
  _medicine?: any
) {
  const target = e.currentTarget as HTMLImageElement;
  target.onerror = null; // prevent infinite loop
  target.src = FALLBACK_IMAGE;
}
