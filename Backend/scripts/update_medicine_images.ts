import '../config/env.js';
import connectDB from '../db.js';
import { Medicine } from '../models.js';
import fs from 'fs';
import path from 'path';

const CATEGORIES_COLORS: Record<string, string> = {
  'Pain Relief': 'f43f5e',
  'Antibiotics': '0d9488',
  'Vitamins': 'ea580c',
  'Cold & Flu': '2563eb',
  'Digestive': '8b5cf6',
  'Diabetes': '0284c7',
  'Heart': 'dc2626',
  'Skin Care': 'db2777',
};

async function main() {
  await connectDB();
  const meds = await Medicine.find({});
  
  const destDir = path.resolve(process.cwd(), '..', 'Frontend', 'public', 'images', 'medicines');
  if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true });
    console.log('Created directory:', destDir);
  }

  // Pre-download placeholder buffers for each category to minimize network calls
  const buffers: Record<string, Buffer> = {};
  for (const category of Object.keys(CATEGORIES_COLORS)) {
    const color = CATEGORIES_COLORS[category];
    const url = `https://placehold.co/300x300/png?text=${encodeURIComponent(category)}&bg=${color}&fg=ffffff`;
    try {
      console.log(`Downloading dummy image for category: ${category}...`);
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const arrayBuffer = await res.arrayBuffer();
      buffers[category] = Buffer.from(arrayBuffer);
    } catch (err) {
      console.warn(`Failed to download online dummy for ${category}, generating fallback SVG...`);
      const fallbackSvg = `
        <svg xmlns="http://www.w3.org/2000/svg" width="300" height="300">
          <rect width="300" height="300" fill="#${color}"/>
          <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#ffffff" font-family="Arial" font-size="24" font-weight="bold">${category}</text>
        </svg>
      `;
      buffers[category] = Buffer.from(fallbackSvg);
    }
  }

  // Fallback for general categories
  const defaultColor = '64748b';
  try {
    const res = await fetch(`https://placehold.co/300x300/png?text=Medicine&bg=${defaultColor}&fg=ffffff`);
    if (res.ok) {
      const arrayBuffer = await res.arrayBuffer();
      buffers['General'] = Buffer.from(arrayBuffer);
    } else {
      throw new Error();
    }
  } catch (err) {
    const fallbackSvg = `
      <svg xmlns="http://www.w3.org/2000/svg" width="300" height="300">
        <rect width="300" height="300" fill="#${defaultColor}"/>
        <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#ffffff" font-family="Arial" font-size="24" font-weight="bold">Medicine</text>
      </svg>
    `;
    buffers['General'] = Buffer.from(fallbackSvg);
  }

  let updated = 0;
  for (const med of meds) {
    const category = med.category || 'General';
    const name = med.name || 'Medicine';
    
    // Clean name for slug
    const slugName = name.toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '')
      .replace(/-+/g, '-');
    
    const fileName = `${slugName}.jpg`;
    const filePath = path.join(destDir, fileName);
    const dbImageUrl = `/images/medicines/${fileName}`;

    // Get the right buffer
    const buf = buffers[category] || buffers['General'];
    
    fs.writeFileSync(filePath, buf);
    
    med.image = dbImageUrl;
    await med.save();
    updated++;
    console.log(`Updated database URL & created file for: ${name} -> ${dbImageUrl}`);
  }

  console.log(`Successfully updated database and generated dummy files for ${updated} medicines.`);
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
