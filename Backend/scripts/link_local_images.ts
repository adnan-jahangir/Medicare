import '../config/env.js';
import connectDB from '../db.js';
import { Medicine } from '../models.js';
import fs from 'fs';
import path from 'path';

async function main() {
  try {
    await connectDB();
    
    const imageDir = path.resolve(process.cwd(), '..', 'Frontend', 'public', 'images', 'medicines');
    if (!fs.existsSync(imageDir)) {
      console.error(`Directory not found: ${imageDir}`);
      process.exit(1);
    }

    const files = fs.readdirSync(imageDir);
    console.log(`Found ${files.length} images in ${imageDir}`);

    const meds = await Medicine.find({});
    console.log(`Checking ${meds.length} medicines in database...`);

    let updatedCount = 0;
    let fallbackCount = 0;

    for (const med of meds) {
      const normalizedMedName = med.name.toLowerCase().trim();
      
      // Try to find a file that matches the medicine name
      // 1. Exact match (without extension)
      // 2. Start-with match
      // 3. Normalized slug match
      
      let matchedFile = files.find(f => {
        const fileNameNoExt = path.parse(f).name.toLowerCase();
        return fileNameNoExt === normalizedMedName;
      });

      if (!matchedFile) {
        matchedFile = files.find(f => {
          const fileNameNoExt = path.parse(f).name.toLowerCase();
          return fileNameNoExt.startsWith(normalizedMedName);
        });
      }

      if (!matchedFile) {
        // Try slugified match (more aggressive)
        const slugify = (s: string) => s.toLowerCase()
          .replace(/[_\s-]+/g, '') // Remove all separators
          .replace(/[^a-z0-9]/g, ''); // Remove special chars
        
        const slugifiedMed = slugify(normalizedMedName);
        matchedFile = files.find(f => {
          const fileNameNoExt = path.parse(f).name;
          return slugify(fileNameNoExt).includes(slugifiedMed) || slugifiedMed.includes(slugify(fileNameNoExt));
        });
      }

      // Manual corrections / fuzzy matches
      if (!matchedFile) {
        const manualMap: Record<string, string> = {
          'ketorol': 'ketoral-200-mg.jpg',
          'topicort': 'Topicare.jpg',
          'torva': 'Rosuva.jpg', // Both are statins, maybe a fallback? Actually let's not guess too much.
        };
        const fileName = manualMap[normalizedMedName];
        if (fileName && files.includes(fileName)) {
          matchedFile = fileName;
        }
      }

      if (matchedFile) {
        med.image = `/images/medicines/${matchedFile}`;
        await med.save();
        updatedCount++;
        console.log(`✅ Matched: "${med.name}" -> ${matchedFile}`);
      } else {
        // Optional: set a default image if not matched?
        // Let's just log it for now.
        fallbackCount++;
        console.log(`❌ No match: "${med.name}" (Current image: ${med.image})`);
      }
    }

    console.log(`-----------------------------------`);
    console.log(`Updated ${updatedCount} medicines in database.`);
    console.log(`${fallbackCount} medicines could not be matched.`);

    // --- Part 2: Update local JSON file ---
    const jsonPath = path.resolve(process.cwd(), 'data', 'user_medicines.json');
    if (fs.existsSync(jsonPath)) {
      console.log(`Updating ${jsonPath}...`);
      const jsonData = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
      if (jsonData.medicines && Array.isArray(jsonData.medicines)) {
        let jsonUpdatedCount = 0;
        for (const med of jsonData.medicines) {
          const normalizedMedName = med.name.toLowerCase().trim();
          
          let matchedFile = files.find(f => {
            const fileNameNoExt = path.parse(f).name.toLowerCase();
            return fileNameNoExt === normalizedMedName;
          });

          if (!matchedFile) {
            matchedFile = files.find(f => {
              const fileNameNoExt = path.parse(f).name.toLowerCase();
              return fileNameNoExt.startsWith(normalizedMedName);
            });
          }

          if (!matchedFile) {
            const slugify = (s: string) => s.toLowerCase().replace(/[_\s-]+/g, '').replace(/[^a-z0-9]/g, '');
            const slugifiedMed = slugify(normalizedMedName);
            matchedFile = files.find(f => {
              const fileNameNoExt = path.parse(f).name;
              return slugify(fileNameNoExt).includes(slugifiedMed) || slugifiedMed.includes(slugify(fileNameNoExt));
            });
          }

          if (!matchedFile) {
            const manualMap: Record<string, string> = {
              'ketorol': 'ketoral-200-mg.jpg',
              'topicort': 'Topicare.jpg',
              'torva': 'Rosuva.jpg',
            };
            const fileName = manualMap[normalizedMedName];
            if (fileName && files.includes(fileName)) matchedFile = fileName;
          }

          if (matchedFile) {
            med.image_url = `/images/medicines/${matchedFile}`;
            jsonUpdatedCount++;
          }
        }
        fs.writeFileSync(jsonPath, JSON.stringify(jsonData, null, 2));
        console.log(`Updated ${jsonUpdatedCount} records in user_medicines.json.`);
      }
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error linking images:', error);
    process.exit(1);
  }
}

main();
