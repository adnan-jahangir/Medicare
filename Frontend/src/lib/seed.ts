import type { Medicine, Pharmacy, Order } from './types';

export const PHARMACIES: Pharmacy[] = [
  { id: 'ph_1', name: 'GreenLeaf Pharmacy', city: 'New York', rating: 4.8, ownerName: 'Dr. Amelia Cole', monthlyRevenue: 48230 },
  { id: 'ph_2', name: 'CityMed Express', city: 'Brooklyn', rating: 4.6, ownerName: 'Dr. Marcus Reyes', monthlyRevenue: 36120 },
  { id: 'ph_3', name: 'WellPath Drugs', city: 'Queens', rating: 4.7, ownerName: 'Dr. Sara Patel', monthlyRevenue: 41980 },
];

const img = (q: string) =>
  `https://images.unsplash.com/${q}?auto=format&fit=crop&w=600&q=70`;

export const MEDICINES: Medicine[] = [
  { id: 'm1', name: 'Paracetamol', brand: 'Tylenol', strength: '500mg', dosage: '1 tablet every 6 hours', description: 'Effective relief from mild to moderate pain and fever.', category: 'Pain Relief', price: 4.99, stock: 240, image: img('photo-1584308666744-24d5c474f2ae'), prescriptionRequired: false, pharmacyId: 'ph_1' },
  { id: 'm2', name: 'Amoxicillin', brand: 'Amoxil', strength: '250mg', dosage: '1 capsule three times daily', description: 'Broad-spectrum antibiotic for bacterial infections.', category: 'Antibiotics', price: 12.5, stock: 80, image: img('photo-1471864190281-a93a3070b6de'), prescriptionRequired: true, pharmacyId: 'ph_1' },
  { id: 'm3', name: 'Vitamin D3', brand: 'Nature Made', strength: '1000 IU', dosage: '1 softgel daily', description: 'Supports bone health and immune function.', category: 'Vitamins', price: 9.99, stock: 320, image: img('photo-1550572017-edd951b55104'), prescriptionRequired: false, pharmacyId: 'ph_2' },
  { id: 'm4', name: 'Cetirizine', brand: 'Zyrtec', strength: '10mg', dosage: '1 tablet once daily', description: 'Antihistamine for allergy relief — non-drowsy.', category: 'Cold & Flu', price: 7.49, stock: 150, image: img('photo-1607619056574-7b8d3ee536b2'), prescriptionRequired: false, pharmacyId: 'ph_2' },
  { id: 'm5', name: 'Omeprazole', brand: 'Prilosec', strength: '20mg', dosage: '1 capsule before breakfast', description: 'Reduces stomach acid for heartburn and acid reflux.', category: 'Digestive', price: 11.0, stock: 90, image: img('photo-1631549916768-4119b2e5f926'), prescriptionRequired: false, pharmacyId: 'ph_3' },
  { id: 'm6', name: 'Metformin', brand: 'Glucophage', strength: '500mg', dosage: '1 tablet twice daily with meals', description: 'Manages blood sugar in type 2 diabetes.', category: 'Diabetes', price: 8.75, stock: 60, image: img('photo-1626716493137-b67fe9501e76'), prescriptionRequired: true, pharmacyId: 'ph_1' },
  { id: 'm7', name: 'Atorvastatin', brand: 'Lipitor', strength: '20mg', dosage: '1 tablet daily at night', description: 'Lowers cholesterol and reduces cardiovascular risk.', category: 'Heart', price: 14.2, stock: 45, image: img('photo-1587854692152-cbe660dbde88'), prescriptionRequired: true, pharmacyId: 'ph_2' },
  { id: 'm8', name: 'Hydrocortisone Cream', brand: 'Cortizone', strength: '1%', dosage: 'Apply thin layer 2–3x daily', description: 'Topical relief for itching, rashes, and eczema.', category: 'Skin Care', price: 6.5, stock: 120, image: img('photo-1576091160550-2173dba999ef'), prescriptionRequired: false, pharmacyId: 'ph_3' },
  { id: 'm9', name: 'Ibuprofen', brand: 'Advil', strength: '200mg', dosage: '1–2 tablets every 4–6 hours', description: 'NSAID for pain, inflammation, and fever.', category: 'Pain Relief', price: 5.99, stock: 180, image: img('photo-1550572017-edd951b55104'), prescriptionRequired: false, pharmacyId: 'ph_3' },
  { id: 'm10', name: 'Vitamin C', brand: 'Emergen-C', strength: '1000mg', dosage: '1 packet daily in water', description: 'Antioxidant that supports immune health.', category: 'Vitamins', price: 13.99, stock: 0, image: img('photo-1559757175-08d2e0918d20'), prescriptionRequired: false, pharmacyId: 'ph_1' },
  { id: 'm11', name: 'Loratadine', brand: 'Claritin', strength: '10mg', dosage: '1 tablet once daily', description: '24-hour non-drowsy allergy relief.', category: 'Cold & Flu', price: 8.99, stock: 110, image: img('photo-1584308666744-24d5c474f2ae'), prescriptionRequired: false, pharmacyId: 'ph_2' },
  { id: 'm12', name: 'Aspirin', brand: 'Bayer', strength: '81mg', dosage: '1 tablet daily', description: 'Low-dose aspirin for cardiovascular protection.', category: 'Heart', price: 4.5, stock: 200, image: img('photo-1471864190281-a93a3070b6de'), prescriptionRequired: false, pharmacyId: 'ph_3' },
];

// NYC demo coordinates
export const SAMPLE_PICKUP: [number, number] = [-73.9857, 40.7484]; // Empire State
export const SAMPLE_DEST: [number, number] = [-73.9712, 40.7831];  // Upper East Side

export const SAMPLE_ORDERS: Order[] = [
  {
    id: 'ORD-1042',
    customerName: 'Jane Cooper',
    customerEmail: 'jane@example.com',
    pharmacyId: 'ph_1',
    items: [{ medicine: MEDICINES[0], quantity: 2 }, { medicine: MEDICINES[2], quantity: 1 }],
    total: 4.99 * 2 + 9.99,
    status: 'Preparing',
    createdAt: Date.now() - 1000 * 60 * 25,
    updatedAt: Date.now() - 1000 * 60 * 4,
    pickup: SAMPLE_PICKUP,
    destination: SAMPLE_DEST,
    driverProgress: 0.15,
  },
  {
    id: 'ORD-1041',
    customerName: 'Wade Warren',
    customerEmail: 'wade@example.com',
    pharmacyId: 'ph_2',
    items: [{ medicine: MEDICINES[3], quantity: 1 }],
    total: 7.49,
    status: 'Delivered',
    createdAt: Date.now() - 1000 * 60 * 60 * 26,
    updatedAt: Date.now() - 1000 * 60 * 60 * 24,
    pickup: SAMPLE_PICKUP,
    destination: SAMPLE_DEST,
    driverProgress: 1,
  },
];
