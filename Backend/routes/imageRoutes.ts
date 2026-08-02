import express from 'express';
import fs from 'fs';
import fsPromises from 'fs/promises';
import path from 'path';
import crypto from 'crypto';

const router = express.Router();

const CACHE_DIR = path.resolve(process.cwd(), 'cache', 'images');
const ALLOWED_HOSTS = process.env.ALLOWED_IMAGE_HOSTS
  ? process.env.ALLOWED_IMAGE_HOSTS.split(',').map((s) => s.trim().toLowerCase()).filter(Boolean)
  : null;

async function ensureCacheDir() {
  try {
    await fsPromises.mkdir(CACHE_DIR, { recursive: true });
  } catch (err) {
    // ignore
  }
}

function guessExtFromContentType(ct: string) {
  if (!ct) return '';
  ct = ct.toLowerCase();
  if (ct.includes('jpeg')) return 'jpg';
  if (ct.includes('png')) return 'png';
  if (ct.includes('webp')) return 'webp';
  if (ct.includes('gif')) return 'gif';
  if (ct.includes('svg')) return 'svg';
  return '';
}

router.get('/proxy', async (req, res) => {
  const url = (req.query.url as string) || '';
  if (!url) return res.status(400).json({ message: 'url query parameter is required' });

  // Collect fallback params for SVG generation if the remote fetch fails
  const fallbackName = (req.query.name as string) || 'Medicine';
  const fallbackCategory = (req.query.category as string) || 'General';
  const fallbackBrand = (req.query.brand as string) || '';
  const fallbackStrength = (req.query.strength as string) || '';
  const fallbackDosage = (req.query.dosage as string) || 'Tablet';

  const buildFallbackUrl = () => {
    const params = new URLSearchParams({
      name: fallbackName,
      category: fallbackCategory,
      brand: fallbackBrand,
      strength: fallbackStrength,
      dosage: fallbackDosage,
    });
    return `/api/images/generate?${params.toString()}`;
  };

  let parsed: URL;
  try {
    parsed = new URL(url);
    if (!/^https?:$/.test(parsed.protocol)) throw new Error('invalid protocol');
  } catch (err) {
    return res.redirect(buildFallbackUrl());
  }

  if (ALLOWED_HOSTS && ALLOWED_HOSTS.length > 0) {
    const host = parsed.hostname.toLowerCase();
    const ok = ALLOWED_HOSTS.some((h) => host === h || host.endsWith('.' + h));
    if (!ok) return res.redirect(buildFallbackUrl());
  }

  await ensureCacheDir();

  const hash = crypto.createHash('sha256').update(url).digest('hex');

  // Check cache
  try {
    const files = await fsPromises.readdir(CACHE_DIR);
    const cached = files.find((f) => f.startsWith(hash));
    if (cached) {
      const filePath = path.join(CACHE_DIR, cached);
      res.setHeader('Cache-Control', 'public, max-age=86400');
      return res.sendFile(filePath);
    }
  } catch (err) {
    // proceed to fetch
  }

  // Fetch remote resource
  let response: any;
  try {
    response = await fetch(url, {
      method: 'GET',
      redirect: 'follow',
      signal: AbortSignal.timeout(8000),
    } as any);
  } catch (err) {
    return res.redirect(buildFallbackUrl());
  }

  if (!response.ok) {
    return res.redirect(buildFallbackUrl());
  }

  const contentType = response.headers.get('content-type') || '';
  if (!contentType.startsWith('image/')) {
    return res.redirect(buildFallbackUrl());
  }

  const ext = guessExtFromContentType(contentType) || path.extname(parsed.pathname).replace('.', '') || 'jpg';
  const filename = `${hash}.${ext}`;
  const filePath = path.join(CACHE_DIR, filename);

  try {
    const arrayBuffer = await response.arrayBuffer();
    await fsPromises.writeFile(filePath, Buffer.from(arrayBuffer));
  } catch (err) {
    return res.redirect(buildFallbackUrl());
  }

  res.setHeader('Cache-Control', 'public, max-age=86400');
  return res.sendFile(filePath);
});


router.get('/generate', (req, res) => {
  const name = (req.query.name as string) || 'Medicine';
  const category = (req.query.category as string) || 'General';
  const brand = (req.query.brand as string) || '';
  const strength = (req.query.strength as string) || '';
  const dosage = (req.query.dosage as string) || 'Tablet';

  // Choose premium modern color gradients based on category
  let gradientStart = '#6366f1';
  let gradientEnd = '#4f46e5';

  const cat = category.toLowerCase();
  if (cat.includes('pain')) {
    gradientStart = '#f43f5e'; // Rose
    gradientEnd = '#fb7185';
  } else if (cat.includes('antibio')) {
    gradientStart = '#0d9488'; // Teal
    gradientEnd = '#2dd4bf';
  } else if (cat.includes('vitam')) {
    gradientStart = '#ea580c'; // Orange/Amber
    gradientEnd = '#facc15';
  } else if (cat.includes('cold') || cat.includes('flu')) {
    gradientStart = '#2563eb'; // Royal Blue
    gradientEnd = '#60a5fa';
  } else if (cat.includes('digest')) {
    gradientStart = '#8b5cf6'; // Violet/Purple
    gradientEnd = '#c084fc';
  } else if (cat.includes('diabet')) {
    gradientStart = '#0284c7'; // Sky Blue
    gradientEnd = '#38bdf8';
  } else if (cat.includes('heart')) {
    gradientStart = '#dc2626'; // Deep Red
    gradientEnd = '#f87171';
  } else if (cat.includes('skin') || cat.includes('cream')) {
    gradientStart = '#db2777'; // Pink
    gradientEnd = '#fbcfe8';
  }

  // Draw appropriate medicine icons based on dosage form
  let iconSvg = '';
  const dosageLower = dosage.toLowerCase();
  if (dosageLower.includes('syrup') || dosageLower.includes('drop') || dosageLower.includes('liquid')) {
    // Medical Bottle / Syrup bottle drawing
    iconSvg = `
      <g stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" fill="none">
        <path d="M12 2v4M8 4h8" />
        <path d="M6 10h12v12a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V10z" />
        <path d="M6 14h12" stroke-dasharray="2 2" />
        <circle cx="12" cy="17" r="2" fill="currentColor" />
      </g>
    `;
  } else if (dosageLower.includes('cream') || dosageLower.includes('gel') || dosageLower.includes('ointment') || dosageLower.includes('topical')) {
    // Squeeze tube drawing
    iconSvg = `
      <g stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" fill="none">
        <path d="M16 2H8l1 15h6z" />
        <path d="M8 17h8v4a1 1 0 0 1-1 1h-6a1 1 0 0 1-1-1v-4z" />
        <path d="M10 7h4" />
      </g>
    `;
  } else {
    // Capsule / Pill rotated drawing (default)
    iconSvg = `
      <g stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" fill="none">
        <rect x="7" y="11" width="10" height="6" rx="3" transform="rotate(-45 12 14)" />
        <path d="M9 11l6 6" />
        <circle cx="9" cy="8" r="0.75" fill="currentColor" />
        <circle cx="15" cy="16" r="0.75" fill="currentColor" />
      </g>
    `;
  }

  // Generate SVG with premium gradients, styling, and typography
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 300" width="100%" height="100%">
      <defs>
        <linearGradient id="bg-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:${gradientStart};stop-opacity:1" />
          <stop offset="100%" style="stop-color:${gradientEnd};stop-opacity:1" />
        </linearGradient>
        <filter id="shadow-effect" x="-10%" y="-10%" width="120%" height="120%">
          <feDropShadow dx="0" dy="8" stdDeviation="12" flood-color="#000000" flood-opacity="0.18" />
        </filter>
        <filter id="soft-glow" x="-10%" y="-10%" width="120%" height="120%">
          <feGaussianBlur stdDeviation="6" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>
      
      <!-- Gradient Background -->
      <rect width="300" height="300" rx="0" fill="url(#bg-grad)" />
      
      <!-- Soft Decorative Overlay Elements -->
      <circle cx="270" cy="30" r="80" fill="#ffffff" opacity="0.08" filter="url(#soft-glow)" />
      <circle cx="30" cy="270" r="100" fill="#ffffff" opacity="0.05" />
      
      <!-- Premium Frosted Glass Container -->
      <rect x="25" y="25" width="250" height="250" rx="20" fill="#ffffff" fill-opacity="0.12" stroke="#ffffff" stroke-opacity="0.25" stroke-width="1.2" filter="url(#shadow-effect)" />
      
      <!-- Stylized Medicine Icon Wrapper -->
      <g transform="translate(150, 100)">
        <!-- Small 3D Package Outline -->
        <rect x="-30" y="-35" width="60" height="70" rx="10" fill="#ffffff" fill-opacity="0.92" />
        <rect x="-30" y="-35" width="60" height="18" rx="10" fill="${gradientStart}" fill-opacity="0.8" />
        <!-- Top corners smoothing -->
        <rect x="-30" y="-25" width="60" height="10" fill="${gradientStart}" fill-opacity="0.8" />
        
        <!-- Animated / Soft Icon -->
        <g transform="translate(0, 10) scale(1.4)" color="${gradientStart}">
          ${iconSvg}
        </g>
        
        <!-- Small Red RX Stamp for Prescription-required classes -->
        ${(cat.includes('antibio') || cat.includes('diabet') || cat.includes('heart')) ? `
          <rect x="-22" y="-27" width="12" height="8" rx="2" fill="#ef4444" />
          <text x="-16" y="-21" fill="#ffffff" font-family="system-ui, -apple-system, sans-serif" font-size="6" font-weight="bold" text-anchor="middle">Rx</text>
        ` : ''}
      </g>

      <!-- Category Text (Subtle Tracking) -->
      <text x="150" y="60" fill="#ffffff" fill-opacity="0.8" font-family="system-ui, -apple-system, sans-serif" font-size="9" font-weight="700" letter-spacing="1.5" text-anchor="middle">${category.toUpperCase()}</text>
      
      <!-- Medicine Bold Title -->
      <text x="150" y="190" fill="#ffffff" font-family="system-ui, -apple-system, sans-serif" font-size="16" font-weight="800" text-anchor="middle" filter="url(#soft-glow)">${name}</text>
      
      <!-- Brand & Strength Subtitle -->
      <text x="150" y="212" fill="#ffffff" fill-opacity="0.85" font-family="system-ui, -apple-system, sans-serif" font-size="11" font-weight="500" text-anchor="middle">${brand} ${strength ? `• ${strength}` : ''}</text>
      
      <!-- Dosage Badge -->
      <g transform="translate(150, 238)">
        <rect x="-35" y="-8" width="70" height="16" rx="8" fill="#ffffff" fill-opacity="0.18" stroke="#ffffff" stroke-opacity="0.25" stroke-width="0.8" />
        <text x="0" y="3" fill="#ffffff" font-family="system-ui, -apple-system, sans-serif" font-size="9" font-weight="600" text-anchor="middle">${dosage}</text>
      </g>
    </svg>
  `;

  res.setHeader('Content-Type', 'image/svg+xml');
  res.setHeader('Cache-Control', 'public, max-age=86400');
  return res.send(svg);
});

export default router;

