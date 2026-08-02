import dotenv from 'dotenv';
import connectDB from '../db.js';
import { Pharmacy, Medicine } from '../models.js';

dotenv.config();

// Provided list of medicines (from user)
const medicines = [
  { "medicineName": "Ace", "brandName": "Square", "strength": "500mg", "category": "Pain Relief", "dosage": "1-2 tab", "description": "Paracetamol for fever and mild pain.", "price": 1.2, "imageUrl": "https://placehold.co/400x400?text=Ace" },
  { "medicineName": "Napa", "brandName": "Beximco", "strength": "500mg", "category": "Pain Relief", "dosage": "1-2 tab", "description": "Popular analgesic for headache.", "price": 1.2, "imageUrl": "https://placehold.co/400x400?text=Napa" },
  { "medicineName": "Fast", "brandName": "ACME", "strength": "500mg", "category": "Pain Relief", "dosage": "1-2 tab", "description": "Rapid relief from mild pain.", "price": 1.2, "imageUrl": "https://placehold.co/400x400?text=Fast" },
  { "medicineName": "Renova", "brandName": "Renata", "strength": "500mg", "category": "Pain Relief", "dosage": "1-2 tab", "description": "Standard paracetamol tablet.", "price": 1.2, "imageUrl": "https://placehold.co/400x400?text=Renova" },
  { "medicineName": "Ace Plus", "brandName": "Square", "strength": "500mg+65mg", "category": "Pain Relief", "dosage": "1 tab", "description": "With caffeine for extra relief.", "price": 2.5, "imageUrl": "https://placehold.co/400x400?text=Ace+Plus" },
  { "medicineName": "Napa Extra", "brandName": "Beximco", "strength": "500mg+65mg", "category": "Pain Relief", "dosage": "1 tab", "description": "Stronger pain relief for migraines.", "price": 2.5, "imageUrl": "https://placehold.co/400x400?text=Napa+Extra" },
  { "medicineName": "Flamigyl", "brandName": "ACI", "strength": "400mg", "category": "Pain Relief", "dosage": "1 tab", "description": "Ibuprofen for inflammatory pain.", "price": 2.0, "imageUrl": "https://placehold.co/400x400?text=Flamigyl" },
  { "medicineName": "Etorix", "brandName": "Incepta", "strength": "90mg", "category": "Pain Relief", "dosage": "1 tab", "description": "Etoricoxib for joint pain.", "price": 12.0, "imageUrl": "https://placehold.co/400x400?text=Etorix" },
  { "medicineName": "Xeldrin", "brandName": "Square", "strength": "200mg", "category": "Pain Relief", "dosage": "1 tab", "description": "Celecoxib for arthritis pain.", "price": 10.0, "imageUrl": "https://placehold.co/400x400?text=Xeldrin" },
  { "medicineName": "Naprox", "brandName": "Incepta", "strength": "500mg", "category": "Pain Relief", "dosage": "1 tab", "description": "Naproxen for muscle pain.", "price": 8.0, "imageUrl": "https://placehold.co/400x400?text=Naprox" },
  { "medicineName": "Rolac", "brandName": "Renata", "strength": "10mg", "category": "Pain Relief", "dosage": "1 tab", "description": "Ketorolac for acute pain.", "price": 10.0, "imageUrl": "https://placehold.co/400x400?text=Rolac" },
  { "medicineName": "Torax", "brandName": "Square", "strength": "10mg", "category": "Pain Relief", "dosage": "1 tab", "description": "Strong NSAID for severe pain.", "price": 10.0, "imageUrl": "https://placehold.co/400x400?text=Torax" },
  { "medicineName": "Diclofen", "brandName": "Beximco", "strength": "50mg", "category": "Pain Relief", "dosage": "1 tab", "description": "Diclofenac for tissue injury.", "price": 2.5, "imageUrl": "https://placehold.co/400x400?text=Diclofen" },
  { "medicineName": "Fenobac", "brandName": "ACI", "strength": "10mg", "category": "Pain Relief", "dosage": "1 tab", "description": "Baclofen as muscle relaxant.", "price": 8.0, "imageUrl": "https://placehold.co/400x400?text=Fenobac" },
  { "medicineName": "Flexibac", "brandName": "Incepta", "strength": "10mg", "category": "Pain Relief", "dosage": "1 tab", "description": "Relief for muscle spasms.", "price": 8.0, "imageUrl": "https://placehold.co/400x400?text=Flexibac" },
  { "medicineName": "Voligel", "brandName": "Square", "strength": "1%", "category": "Pain Relief", "dosage": "Topical", "description": "Gel for external muscle pain.", "price": 60.0, "imageUrl": "https://placehold.co/400x400?text=Voligel" },
  { "medicineName": "Clofenac", "brandName": "Renata", "strength": "50mg", "category": "Pain Relief", "dosage": "1 tab", "description": "Long-standing brand for rheumatic pain.", "price": 2.5, "imageUrl": "https://placehold.co/400x400?text=Clofenac" },
  { "medicineName": "A-Fenac", "brandName": "ACME", "strength": "50mg", "category": "Pain Relief", "dosage": "1 tab", "description": "Effective for back pain.", "price": 2.5, "imageUrl": "https://placehold.co/400x400?text=A-Fenac" },
  { "medicineName": "Dynapar", "brandName": "Incepta", "strength": "50mg", "category": "Pain Relief", "dosage": "1 tab", "description": "Fast-acting inflammation relief.", "price": 3.0, "imageUrl": "https://placehold.co/400x400?text=Dynapar" },
  { "medicineName": "Tramadol", "brandName": "Beximco", "strength": "50mg", "category": "Pain Relief", "dosage": "1 tab", "description": "Opioid for moderate pain.", "price": 15.0, "imageUrl": "https://placehold.co/400x400?text=Tramadol" },
  { "medicineName": "Zithrin", "brandName": "Square", "strength": "500mg", "category": "Antibiotics", "dosage": "1 tab daily", "description": "Azithromycin for infections.", "price": 35.0, "imageUrl": "https://placehold.co/400x400?text=Zithrin" },
  { "medicineName": "Azithrocin", "brandName": "Incepta", "strength": "500mg", "category": "Antibiotics", "dosage": "1 tab daily", "description": "Broad-spectrum antibiotic.", "price": 35.0, "imageUrl": "https://placehold.co/400x400?text=Azithrocin" },
  { "medicineName": "Furocef", "brandName": "Renata", "strength": "500mg", "category": "Antibiotics", "dosage": "1 tab 12hrly", "description": "Cefuroxime for ENT infections.", "price": 45.0, "imageUrl": "https://placehold.co/400x400?text=Furocef" },
  { "medicineName": "Ciprocin", "brandName": "Square", "strength": "500mg", "category": "Antibiotics", "dosage": "1 tab 12hrly", "description": "Ciprofloxacin for infections.", "price": 15.0, "imageUrl": "https://placehold.co/400x400?text=Ciprocin" },
  { "medicineName": "Moxacil", "brandName": "Square", "strength": "500mg", "category": "Antibiotics", "dosage": "1 tab 8hrly", "description": "Amoxicillin for chest infection.", "price": 7.0, "imageUrl": "https://placehold.co/400x400?text=Moxacil" },
  { "medicineName": "Fixocard", "brandName": "Incepta", "strength": "200mg", "category": "Antibiotics", "dosage": "1 tab 12hrly", "description": "Cefixime for bacterial fever.", "price": 35.0, "imageUrl": "https://placehold.co/400x400?text=Fixocard" },
  { "medicineName": "Ceftipime", "brandName": "Beximco", "strength": "1gm", "category": "Antibiotics", "dosage": "Injection", "description": "Cefepime for severe infections.", "price": 300.0, "imageUrl": "https://placehold.co/400x400?text=Ceftipime" },
  { "medicineName": "Roxim", "brandName": "ACI", "strength": "500mg", "category": "Antibiotics", "dosage": "1 tab daily", "description": "Roxithromycin for airways.", "price": 12.0, "imageUrl": "https://placehold.co/400x400?text=Roxim" },
  { "medicineName": "Orifix", "brandName": "ACME", "strength": "200mg", "category": "Antibiotics", "dosage": "1 tab 12hrly", "description": "Cefixime for typhoid.", "price": 35.0, "imageUrl": "https://placehold.co/400x400?text=Orifix" },
  { "medicineName": "Levoxin", "brandName": "Incepta", "strength": "500mg", "category": "Antibiotics", "dosage": "1 tab daily", "description": "Levofloxacin for lungs/sinus.", "price": 12.0, "imageUrl": "https://placehold.co/400x400?text=Levoxin" },
  { "medicineName": "Avelox", "brandName": "Square", "strength": "400mg", "category": "Antibiotics", "dosage": "1 tab daily", "description": "Moxifloxacin for bronchitis.", "price": 40.0, "imageUrl": "https://placehold.co/400x400?text=Avelox" },
  { "medicineName": "Cef-3", "brandName": "Incepta", "strength": "200mg", "category": "Antibiotics", "dosage": "1 cap daily", "description": "High-quality Cefixime.", "price": 35.0, "imageUrl": "https://placehold.co/400x400?text=Cef-3" },
  { "medicineName": "Meropen", "brandName": "Incepta", "strength": "1gm", "category": "Antibiotics", "dosage": "Injection", "description": "Critical care antibiotic.", "price": 1200.0, "imageUrl": "https://placehold.co/400x400?text=Meropen" },
  { "medicineName": "Flugal", "brandName": "Square", "strength": "150mg", "category": "Antibiotics", "dosage": "Weekly/Daily", "description": "Fluconazole for fungus.", "price": 25.0, "imageUrl": "https://placehold.co/400x400?text=Flugal" },
  { "medicineName": "Metro", "brandName": "Beximco", "strength": "400mg", "category": "Antibiotics", "dosage": "1 tab 8hrly", "description": "Metronidazole for dysentery.", "price": 2.5, "imageUrl": "https://placehold.co/400x400?text=Metro" },
  { "medicineName": "Flagyl", "brandName": "Sanofi", "strength": "400mg", "category": "Antibiotics", "dosage": "1 tab 8hrly", "description": "Classic anti-amoebic.", "price": 2.5, "imageUrl": "https://placehold.co/400x400?text=Flagyl" },
  { "medicineName": "Neopen", "brandName": "Renata", "strength": "500mg", "category": "Antibiotics", "dosage": "1 tab 8hrly", "description": "Amoxicillin capsule.", "price": 7.0, "imageUrl": "https://placehold.co/400x400?text=Neopen" },
  { "medicineName": "Clavoxil", "brandName": "Renata", "strength": "625mg", "category": "Antibiotics", "dosage": "1 tab 12hrly", "description": "Co-Amoxiclav for skin/bone.", "price": 25.0, "imageUrl": "https://placehold.co/400x400?text=Clavoxil" },
  { "medicineName": "Aristomox CV", "brandName": "Aristopharma", "strength": "625mg", "category": "Antibiotics", "dosage": "1 tab 12hrly", "description": "Amoxicillin/Clavulanate.", "price": 32.0, "imageUrl": "https://placehold.co/400x400?text=Aristomox+CV" },
  { "medicineName": "Avloclav", "brandName": "ACI", "strength": "625mg", "category": "Antibiotics", "dosage": "1 tab 12hrly", "description": "Resistant bacteria treatment.", "price": 35.0, "imageUrl": "https://placehold.co/400x400?text=Avloclav" },
  { "medicineName": "Bextram Gold", "brandName": "Beximco", "strength": "A-Z", "category": "Vitamins", "dosage": "1 daily", "description": "Complete daily multivitamin.", "price": 9.0, "imageUrl": "https://placehold.co/400x400?text=Bextram+Gold" },
  { "medicineName": "Filwel Gold", "brandName": "Square", "strength": "A-Z", "category": "Vitamins", "dosage": "1 daily", "description": "Multivitamin for adults.", "price": 9.0, "imageUrl": "https://placehold.co/400x400?text=Filwel+Gold" },
  { "medicineName": "Gevit", "brandName": "Incepta", "strength": "Multivitamin", "category": "Vitamins", "dosage": "1 daily", "description": "Essential vitamin mix.", "price": 7.0, "imageUrl": "https://placehold.co/400x400?text=Gevit" },
  { "medicineName": "Neuro-B", "brandName": "Square", "strength": "B1+B6+B12", "category": "Vitamins", "dosage": "1-3 daily", "description": "Vitamins for nerve health.", "price": 8.0, "imageUrl": "https://placehold.co/400x400?text=Neuro-B" },
  { "medicineName": "Ceevit", "brandName": "Square", "strength": "250mg", "category": "Vitamins", "dosage": "Chewable", "description": "Vitamin C supplement.", "price": 2.0, "imageUrl": "https://placehold.co/400x400?text=Ceevit" },
  { "medicineName": "D-Rise", "brandName": "Incepta", "strength": "20000 IU", "category": "Vitamins", "dosage": "Weekly", "description": "High dose Vitamin D3.", "price": 40.0, "imageUrl": "https://placehold.co/400x400?text=D-Rise" },
  { "medicineName": "Calbo-D", "brandName": "Square", "strength": "500mg+200IU", "category": "Vitamins", "dosage": "1 tab twice", "description": "Calcium with Vitamin D.", "price": 8.0, "imageUrl": "https://placehold.co/400x400?text=Calbo-D" },
  { "medicineName": "Coralcal-D", "brandName": "Incepta", "strength": "500mg+200IU", "category": "Vitamins", "dosage": "1 tab twice", "description": "Coral Calcium with D3.", "price": 12.0, "imageUrl": "https://placehold.co/400x400?text=Coralcal-D" },
  { "medicineName": "E-Cap", "brandName": "Drug Intl", "strength": "400 IU", "category": "Vitamins", "dosage": "1 daily", "description": "Vitamin E for skin/hair.", "price": 7.0, "imageUrl": "https://placehold.co/400x400?text=E-Cap" },
  { "medicineName": "Aristovit-M", "brandName": "ACI", "strength": "Multivitamin", "category": "Vitamins", "dosage": "1 daily", "description": "Essential minerals/vitamins.", "price": 6.0, "imageUrl": "https://placehold.co/400x400?text=Aristovit-M" },
  { "medicineName": "Revital", "brandName": "Incepta", "strength": "A-Z", "category": "Vitamins", "dosage": "1 daily", "description": "Vitality booster vitamins.", "price": 10.0, "imageUrl": "https://placehold.co/400x400?text=Revital" },
  { "medicineName": "Suncovit", "brandName": "Square", "strength": "40000 IU", "category": "Vitamins", "dosage": "Weekly", "description": "Vitamin D for bones.", "price": 70.0, "imageUrl": "https://placehold.co/400x400?text=Suncovit" },
  { "medicineName": "Aristocal D", "brandName": "ACI", "strength": "500mg+200IU", "category": "Vitamins", "dosage": "1 tab twice", "description": "Calcium supplement.", "price": 8.0, "imageUrl": "https://placehold.co/400x400?text=Aristocal+D" },
  { "medicineName": "Zinc", "brandName": "Square", "strength": "20mg", "category": "Vitamins", "dosage": "1 daily", "description": "Zinc for immunity.", "price": 4.0, "imageUrl": "https://placehold.co/400x400?text=Zinc" },
  { "medicineName": "Fefol-Z", "brandName": "GSK", "strength": "Iron+Zinc", "category": "Vitamins", "dosage": "1 daily", "description": "Iron and Zinc capsule.", "price": 5.0, "imageUrl": "https://placehold.co/400x400?text=Fefol-Z" },
  { "medicineName": "I-Vit", "brandName": "Incepta", "strength": "Vit E", "category": "Vitamins", "dosage": "1 daily", "description": "Pure Vitamin E supplement.", "price": 6.0, "imageUrl": "https://placehold.co/400x400?text=I-Vit" },
  { "medicineName": "Nutrivit-C", "brandName": "ACI", "strength": "250mg", "category": "Vitamins", "dosage": "Chewable", "description": "Vitamin C for immunity.", "price": 1.5, "imageUrl": "https://placehold.co/400x400?text=Nutrivit-C" },
  { "medicineName": "Altrum Gold", "brandName": "Ziska", "strength": "A-Z", "category": "Vitamins", "dosage": "1 daily", "description": "Gold standard multivitamins.", "price": 9.5, "imageUrl": "https://placehold.co/400x400?text=Altrum+Gold" },
  { "medicineName": "Sina Gold", "brandName": "Ibn Sina", "strength": "A-Z", "category": "Vitamins", "dosage": "1 daily", "description": "Premium multivitamins.", "price": 11.0, "imageUrl": "https://placehold.co/400x400?text=Sina+Gold" },
  { "medicineName": "Super Gold", "brandName": "General", "strength": "A-Z", "category": "Vitamins", "dosage": "1 daily", "description": "Broad multivitamin complex.", "price": 12.0, "imageUrl": "https://placehold.co/400x400?text=Super+Gold" },
  { "medicineName": "Alatrol", "brandName": "Square", "strength": "10mg", "category": "Cold & Flu", "dosage": "1 daily", "description": "Cetirizine for allergies.", "price": 3.5, "imageUrl": "https://placehold.co/400x400?text=Alatrol" },
  { "medicineName": "Atrizin", "brandName": "Beximco", "strength": "10mg", "category": "Cold & Flu", "dosage": "1 daily", "description": "Antihistamine for sneezing.", "price": 3.5, "imageUrl": "https://placehold.co/400x400?text=Atrizin" },
  { "medicineName": "Fexo", "brandName": "Incepta", "strength": "120mg", "category": "Cold & Flu", "dosage": "1 daily", "description": "Non-drowsy allergy relief.", "price": 9.0, "imageUrl": "https://placehold.co/400x400?text=Fexo" },
  { "medicineName": "Fenadin", "brandName": "Renata", "strength": "120mg", "category": "Cold & Flu", "dosage": "1 daily", "description": "Relieves runny nose.", "price": 9.0, "imageUrl": "https://placehold.co/400x400?text=Fenadin" },
  { "medicineName": "Histacin", "brandName": "ACME", "strength": "4mg", "category": "Cold & Flu", "dosage": "1 thrice daily", "description": "For common cold/itchy eyes.", "price": 0.5, "imageUrl": "https://placehold.co/400x400?text=Histacin" },
  { "medicineName": "Deslor", "brandName": "Incepta", "strength": "5mg", "category": "Cold & Flu", "dosage": "1 daily", "description": "Desloratadine for allergy.", "price": 7.0, "imageUrl": "https://placehold.co/400x400?text=Deslor" },
  { "medicineName": "Bilasten", "brandName": "Square", "strength": "20mg", "category": "Cold & Flu", "dosage": "1 daily", "description": "Modern antihistamine.", "price": 15.0, "imageUrl": "https://placehold.co/400x400?text=Bilasten" },
  { "medicineName": "Adovas", "brandName": "Square", "strength": "Herbal", "category": "Cold & Flu", "dosage": "2 spoonfuls", "description": "Herbal cough syrup.", "price": 80.0, "imageUrl": "https://placehold.co/400x400?text=Adovas" },
  { "medicineName": "Tofen", "brandName": "Beximco", "strength": "1mg", "category": "Cold & Flu", "dosage": "1 twice", "description": "For seasonal cold/asthma.", "price": 5.0, "imageUrl": "https://placehold.co/400x400?text=Tofen" },
  { "medicineName": "Montene", "brandName": "Square", "strength": "10mg", "category": "Cold & Flu", "dosage": "1 at night", "description": "For allergic rhinitis.", "price": 15.0, "imageUrl": "https://placehold.co/400x400?text=Montene" },
  { "medicineName": "Monas", "brandName": "Incepta", "strength": "10mg", "category": "Cold & Flu", "dosage": "1 at night", "description": "Montelukast for breathing.", "price": 16.0, "imageUrl": "https://placehold.co/400x400?text=Monas" },
  { "medicineName": "Tuzer", "brandName": "Beximco", "strength": "10mg", "category": "Cold & Flu", "dosage": "1-3 times", "description": "Relief from dry cough.", "price": 12.0, "imageUrl": "https://placehold.co/400x400?text=Tuzer" },
  { "medicineName": "Axodin", "brandName": "ACI", "strength": "120mg", "category": "Cold & Flu", "dosage": "1 daily", "description": "For hives and hay fever.", "price": 9.0, "imageUrl": "https://placehold.co/400x400?text=Axodin" },
  { "medicineName": "Napa Cold", "brandName": "Beximco", "strength": "Multi", "category": "Cold & Flu", "dosage": "1 tab 8hrly", "description": "Fever, cold, and flu.", "price": 5.0, "imageUrl": "https://placehold.co/400x400?text=Napa+Cold" },
  { "medicineName": "Antazol", "brandName": "Square", "strength": "0.1%", "category": "Cold & Flu", "dosage": "Nasal drop", "description": "Relieves nasal block.", "price": 45.0, "imageUrl": "https://placehold.co/400x400?text=Antazol" },
  { "medicineName": "Prizon", "brandName": "Incepta", "strength": "0.05%", "category": "Cold & Flu", "dosage": "Nasal drop", "description": "Decongestant for stuffy nose.", "price": 40.0, "imageUrl": "https://placehold.co/400x400?text=Prizon" },
  { "medicineName": "Ambrox", "brandName": "Square", "strength": "Syrup", "category": "Cold & Flu", "dosage": "2 spoonfuls", "description": "For chesty/productive cough.", "price": 45.0, "imageUrl": "https://placehold.co/400x400?text=Ambrox" },
  { "medicineName": "Mucospan", "brandName": "Incepta", "strength": "Syrup", "category": "Cold & Flu", "dosage": "1 spoonful thrice", "description": "Helips clear thick mucus.", "price": 50.0, "imageUrl": "https://placehold.co/400x400?text=Mucospan" },
  { "medicineName": "Brofex", "brandName": "ACME", "strength": "Syrup", "category": "Cold & Flu", "dosage": "2 spoonfuls", "description": "Expectorant cough syrup.", "price": 60.0, "imageUrl": "https://placehold.co/400x400?text=Brofex" },
  { "medicineName": "Windel", "brandName": "Beximco", "strength": "Inhaler", "category": "Cold & Flu", "dosage": "As needed", "description": "For breathing difficulty.", "price": 250.0, "imageUrl": "https://placehold.co/400x400?text=Windel" },
  { "medicineName": "Seclo", "brandName": "Square", "strength": "20mg", "category": "Digestive", "dosage": "1-2 daily", "description": "Omeprazole for acidity.", "price": 6.0, "imageUrl": "https://placehold.co/400x400?text=Seclo" },
  { "medicineName": "Losectil", "brandName": "SK+F", "strength": "20mg", "category": "Digestive", "dosage": "1-2 daily", "description": "Relief from gastric pain.", "price": 6.0, "imageUrl": "https://placehold.co/400x400?text=Losectil" },
  { "medicineName": "Sergel", "brandName": "Healthcare", "strength": "20mg", "category": "Digestive", "dosage": "1-2 daily", "description": "Esomeprazole for GERD.", "price": 7.0, "imageUrl": "https://placehold.co/400x400?text=Sergel" },
  { "medicineName": "Pantonix", "brandName": "Incepta", "strength": "20mg", "category": "Digestive", "dosage": "1-2 daily", "description": "Pantoprazole for acid reflux.", "price": 7.0, "imageUrl": "https://placehold.co/400x400?text=Pantonix" },
  { "medicineName": "Maxpro", "brandName": "Renata", "strength": "20mg", "category": "Digestive", "dosage": "1-2 daily", "description": "High efficacy acid reducer.", "price": 7.0, "imageUrl": "https://placehold.co/400x400?text=Maxpro" },
  { "medicineName": "Finix", "brandName": "Opsonin", "strength": "20mg", "category": "Digestive", "dosage": "1-2 daily", "description": "Rabeprazole for stomach ulcer.", "price": 7.0, "imageUrl": "https://placehold.co/400x400?text=Finix" },
  { "medicineName": "Entacyd", "brandName": "Square", "strength": "DS", "category": "Digestive", "dosage": "Chewable", "description": "Antacid for indigestion.", "price": 2.0, "imageUrl": "https://placehold.co/400x400?text=Entacyd" },
  { "medicineName": "Dompy", "brandName": "Square", "strength": "10mg", "category": "Digestive", "dosage": "1 thrice", "description": "Nausea/Vomiting relief.", "price": 4.0, "imageUrl": "https://placehold.co/400x400?text=Dompy" },
  { "medicineName": "Omidon", "brandName": "Incepta", "strength": "10mg", "category": "Digestive", "dosage": "1 thrice", "description": "Domperidone for gastric motility.", "price": 4.0, "imageUrl": "https://placehold.co/400x400?text=Omidon" },
  { "medicineName": "Motigut", "brandName": "Beximco", "strength": "10mg", "category": "Digestive", "dosage": "1 thrice", "description": "Aids digestion and motion.", "price": 4.0, "imageUrl": "https://placehold.co/400x400?text=Motigut" },
  { "medicineName": "Flatameal", "brandName": "Beximco", "strength": "DS", "category": "Digestive", "dosage": "Chewable", "description": "Relieves bloating and gas.", "price": 3.5, "imageUrl": "https://placehold.co/400x400?text=Flatameal" },
  { "medicineName": "Orsaline-N", "brandName": "SMC", "strength": "Sachet", "category": "Digestive", "dosage": "Liquid", "description": "Oral rehydration salt.", "price": 6.0, "imageUrl": "https://placehold.co/400x400?text=Orsaline" },
  { "medicineName": "Emistat", "brandName": "Square", "strength": "8mg", "category": "Digestive", "dosage": "1-2 daily", "description": "Ondansetron for severe nausea.", "price": 10.0, "imageUrl": "https://placehold.co/400x400?text=Emistat" },
  { "medicineName": "Onset", "brandName": "Incepta", "strength": "8mg", "category": "Digestive", "dosage": "1-2 daily", "description": "Prevents vomiting.", "price": 10.0, "imageUrl": "https://placehold.co/400x400?text=Onset" },
  { "medicineName": "Lactul", "brandName": "Incepta", "strength": "Syrup", "category": "Digestive", "dosage": "15ml", "description": "Laxative for constipation.", "price": 180.0, "imageUrl": "https://placehold.co/400x400?text=Lactul" },
  { "medicineName": "Almex", "brandName": "Beximco", "strength": "400mg", "category": "Digestive", "dosage": "1 tab", "description": "For intestinal worm relief.", "price": 20.0, "imageUrl": "https://placehold.co/400x400?text=Almex" },
  { "medicineName": "Gastalfet", "brandName": "Incepta", "strength": "Syrup", "category": "Digestive", "dosage": "10ml", "description": "Sucralfate for gastric lining.", "price": 250.0, "imageUrl": "https://placehold.co/400x400?text=Gastalfet" },
  { "medicineName": "Digesil", "brandName": "ACI", "strength": "DS", "category": "Digestive", "dosage": "1 thrice", "description": "Neutralizes stomach acid.", "price": 2.0, "imageUrl": "https://placehold.co/400x400?text=Digesil" },
  { "medicineName": "Joytrip", "brandName": "Incepta", "strength": "0.3mg", "category": "Digestive", "dosage": "1 tab", "description": "For travel/motion sickness.", "price": 5.0, "imageUrl": "https://placehold.co/400x400?text=Joytrip" },
  { "medicineName": "Plavit", "brandName": "Popular", "strength": "Syrup", "category": "Digestive", "dosage": "10ml", "description": "Vitamin syrup for appetite.", "price": 160.0, "imageUrl": "https://placehold.co/400x400?text=Plavit" },
  { "medicineName": "Metfo", "brandName": "Beximco", "strength": "500mg", "category": "Diabetes", "dosage": "1-3 with meal", "description": "Metformin for blood sugar.", "price": 4.0, "imageUrl": "https://placehold.co/400x400?text=Metfo" },
  { "medicineName": "Gluco-Plus", "brandName": "Incepta", "strength": "500mg", "category": "Diabetes", "dosage": "1-3 with meal", "description": "Controls glucose levels.", "price": 4.0, "imageUrl": "https://placehold.co/400x400?text=Gluco-Plus" },
  { "medicineName": "Diaryl", "brandName": "Square", "strength": "2mg", "category": "Diabetes", "dosage": "1 daily", "description": "Glimepiride for Type 2.", "price": 10.0, "imageUrl": "https://placehold.co/400x400?text=Diaryl" },
  { "medicineName": "Secrin", "brandName": "Incepta", "strength": "2mg", "category": "Diabetes", "dosage": "1 daily", "description": "Aids insulin secretion.", "price": 10.0, "imageUrl": "https://placehold.co/400x400?text=Secrin" },
  { "medicineName": "Linaglip", "brandName": "Square", "strength": "5mg", "category": "Diabetes", "dosage": "1 daily", "description": "Linagliptin for sugar control.", "price": 20.0, "imageUrl": "https://placehold.co/400x400?text=Linaglip" },
  { "medicineName": "Januvia", "brandName": "SK+F", "strength": "100mg", "category": "Diabetes", "dosage": "1 daily", "description": "Sitagliptin premium brand.", "price": 50.0, "imageUrl": "https://placehold.co/400x400?text=Januvia" },
  { "medicineName": "Jardian", "brandName": "SK+F", "strength": "10mg", "category": "Diabetes", "dosage": "1 daily", "description": "Empagliflozin for sugar.", "price": 30.0, "imageUrl": "https://placehold.co/400x400?text=Jardian" },
  { "medicineName": "Galvus Met", "brandName": "Novartis", "strength": "50/500mg", "category": "Diabetes", "dosage": "1 twice", "description": "Vildagliptin + Metformin.", "price": 40.0, "imageUrl": "https://placehold.co/400x400?text=Galvus+Met" },
  { "medicineName": "Sitamet", "brandName": "Incepta", "strength": "50/500mg", "category": "Diabetes", "dosage": "1 twice", "description": "Sitagliptin + Metformin.", "price": 25.0, "imageUrl": "https://placehold.co/400x400?text=Sitamet" },
  { "medicineName": "Glimestix", "brandName": "Renata", "strength": "2mg", "category": "Diabetes", "dosage": "1 daily", "description": "Effective glucose control.", "price": 8.0, "imageUrl": "https://placehold.co/400x400?text=Glimestix" },
  { "medicineName": "Comet", "brandName": "Square", "strength": "850mg", "category": "Diabetes", "dosage": "1 twice", "description": "High dose Metformin.", "price": 6.0, "imageUrl": "https://placehold.co/400x400?text=Comet" },
  { "medicineName": "Informet", "brandName": "Incepta", "strength": "500mg", "category": "Diabetes", "dosage": "1-3 with meal", "description": "Standard metformin brand.", "price": 3.0, "imageUrl": "https://placehold.co/400x400?text=Informet" },
  { "medicineName": "Dimerol", "brandName": "Incepta", "strength": "80mg", "category": "Diabetes", "dosage": "1 daily", "description": "Gliclazide for sugar control.", "price": 12.0, "imageUrl": "https://placehold.co/400x400?text=Dimerol" },
  { "medicineName": "Comprid", "brandName": "Square", "strength": "80mg", "category": "Diabetes", "dosage": "1 daily", "description": "Gliclazide standard tablet.", "price": 10.0, "imageUrl": "https://placehold.co/400x400?text=Comprid" },
  { "medicineName": "Linatab", "brandName": "Incepta", "strength": "5mg", "category": "Diabetes", "dosage": "1 daily", "description": "Linagliptin brand.", "price": 18.0, "imageUrl": "https://placehold.co/400x400?text=Linatab" },
  { "medicineName": "Glipita M", "brandName": "Square", "strength": "50/500mg", "category": "Diabetes", "dosage": "1 twice", "description": "Combination drug for sugar.", "price": 20.0, "imageUrl": "https://placehold.co/400x400?text=Glipita+M" },
  { "medicineName": "Dynaglipt", "brandName": "Square", "strength": "20mg", "category": "Diabetes", "dosage": "1 daily", "description": "Teneligliptin for Type 2.", "price": 25.0, "imageUrl": "https://placehold.co/400x400?text=Dynaglipt" },
  { "medicineName": "Vildaglip", "brandName": "Incepta", "strength": "50mg", "category": "Diabetes", "dosage": "1 daily", "description": "Vildagliptin for glucose.", "price": 20.0, "imageUrl": "https://placehold.co/400x400?text=Vildaglip" },
  { "medicineName": "Trajenta", "brandName": "Radiant", "strength": "5mg", "category": "Diabetes", "dosage": "1 daily", "description": "Premium Linagliptin.", "price": 55.0, "imageUrl": "https://placehold.co/400x400?text=Trajenta" },
  { "medicineName": "Insulet", "brandName": "Aristopharma", "strength": "100 IU", "category": "Diabetes", "dosage": "Injection", "description": "Human insulin for diabetes.", "price": 450.0, "imageUrl": "https://placehold.co/400x400?text=Insulet" },
  { "medicineName": "Angilock", "brandName": "Square", "strength": "50mg", "category": "Heart", "dosage": "1 daily", "description": "Losartan for hypertension.", "price": 8.0, "imageUrl": "https://placehold.co/400x400?text=Angilock" },
  { "medicineName": "Osartil", "brandName": "Incepta", "strength": "50mg", "category": "Heart", "dosage": "1 daily", "description": "Losartan Potassium tablet.", "price": 8.0, "imageUrl": "https://placehold.co/400x400?text=Osartil" },
  { "medicineName": "Camlodin", "brandName": "Square", "strength": "5mg", "category": "Heart", "dosage": "1 daily", "description": "Amlodipine for blood pressure.", "price": 6.0, "imageUrl": "https://placehold.co/400x400?text=Camlodin" },
  { "medicineName": "Amlocal", "brandName": "Beximco", "strength": "5mg", "category": "Heart", "dosage": "1 daily", "description": "Calcium channel blocker.", "price": 6.0, "imageUrl": "https://placehold.co/400x400?text=Amlocal" },
  { "medicineName": "Bisoprol", "brandName": "Incepta", "strength": "5mg", "category": "Heart", "dosage": "1 daily", "description": "Bisoprolol for heart rate.", "price": 10.0, "imageUrl": "https://placehold.co/400x400?text=Bisoprol" },
  { "medicineName": "Biselect", "brandName": "Square", "strength": "5mg", "category": "Heart", "dosage": "1 daily", "description": "Selective beta-blocker.", "price": 10.0, "imageUrl": "https://placehold.co/400x400?text=Biselect" },
  { "medicineName": "Atova", "brandName": "Beximco", "strength": "10mg", "category": "Heart", "dosage": "1 at night", "description": "Atorvastatin for cholesterol.", "price": 12.0, "imageUrl": "https://placehold.co/400x400?text=Atova" },
  { "medicineName": "Rosuva", "brandName": "Square", "strength": "10mg", "category": "Heart", "dosage": "1 at night", "description": "Rosuvastatin for lipid control.", "price": 25.0, "imageUrl": "https://placehold.co/400x400?text=Rosuva" },
  { "medicineName": "Roxeten", "brandName": "Incepta", "strength": "10mg", "category": "Heart", "dosage": "1 at night", "description": "Cholesterol lowering drug.", "price": 20.0, "imageUrl": "https://placehold.co/400x400?text=Roxeten" },
  { "medicineName": "Clopid", "brandName": "Incepta", "strength": "75mg", "category": "Heart", "dosage": "1 daily", "description": "Clopidogrel (Anti-platelet).", "price": 15.0, "imageUrl": "https://placehold.co/400x400?text=Clopid" },
  { "medicineName": "Lopirel", "brandName": "Square", "strength": "75mg", "category": "Heart", "dosage": "1 daily", "description": "Prevents blood clots.", "price": 15.0, "imageUrl": "https://placehold.co/400x400?text=Lopirel" },
  { "medicineName": "Ecosprin", "brandName": "ACME", "strength": "75mg", "category": "Heart", "dosage": "1 daily", "description": "Aspirin for heart protection.", "price": 1.5, "imageUrl": "https://placehold.co/400x400?text=Ecosprin" },
  { "medicineName": "Nitromint", "brandName": "Radiant", "strength": "Spray", "category": "Heart", "dosage": "Sublingual", "description": "For sudden chest pain.", "price": 650.0, "imageUrl": "https://placehold.co/400x400?text=Nitromint" },
  { "medicineName": "Ancor", "brandName": "Aristopharma", "strength": "5mg", "category": "Heart", "dosage": "1 daily", "description": "Amlodipine brand.", "price": 8.0, "imageUrl": "https://placehold.co/400x400?text=Ancor" },
  { "medicineName": "Bisocor", "brandName": "Square", "strength": "2.5mg", "category": "Heart", "dosage": "1 daily", "description": "Low dose Bisoprolol.", "price": 7.0, "imageUrl": "https://placehold.co/400x400?text=Bisocor" },
  { "medicineName": "Losan", "brandName": "Incepta", "strength": "50mg", "category": "Heart", "dosage": "1 daily", "description": "Hypertension control.", "price": 7.0, "imageUrl": "https://placehold.co/400x400?text=Losan" },
  { "medicineName": "Ramipril", "brandName": "Square", "strength": "5mg", "category": "Heart", "dosage": "1 daily", "description": "ACE inhibitor for heart.", "price": 10.0, "imageUrl": "https://placehold.co/400x400?text=Ramipril" },
  { "medicineName": "Carditest", "brandName": "ACI", "strength": "50mg", "category": "Heart", "dosage": "1 daily", "description": "Heart failure/BP medication.", "price": 8.0, "imageUrl": "https://placehold.co/400x400?text=Carditest" },
  { "medicineName": "Cilnipin", "brandName": "Incepta", "strength": "10mg", "category": "Heart", "dosage": "1 daily", "description": "Modern calcium blocker.", "price": 12.0, "imageUrl": "https://placehold.co/400x400?text=Cilnipin" },
  { "medicineName": "Agoxin", "brandName": "Aristopharma", "strength": "0.25mg", "category": "Heart", "dosage": "1 daily", "description": "Digoxin for heart rhythm.", "price": 2.5, "imageUrl": "https://placehold.co/400x400?text=Agoxin" },
  { "medicineName": "Afun", "brandName": "Square", "strength": "1%", "category": "Skin Care", "dosage": "Topical", "description": "Antifungal cream for skin.", "price": 45.0, "imageUrl": "https://placehold.co/400x400?text=Afun" },
  { "medicineName": "Candid", "brandName": "Incepta", "strength": "1%", "category": "Skin Care", "dosage": "Topical", "description": "Clotrimazole for itching.", "price": 40.0, "imageUrl": "https://placehold.co/400x400?text=Candid" },
  { "medicineName": "Dermasol", "brandName": "Square", "strength": "0.05%", "category": "Skin Care", "dosage": "Topical", "description": "Steroid for severe eczema.", "price": 35.0, "imageUrl": "https://placehold.co/400x400?text=Dermasol" },
  { "medicineName": "Betnovate", "brandName": "GSK", "strength": "0.1%", "category": "Skin Care", "dosage": "Topical", "description": "For skin redness/swelling.", "price": 65.0, "imageUrl": "https://placehold.co/400x400?text=Betnovate" },
  { "medicineName": "Lucazol", "brandName": "Incepta", "strength": "1%", "category": "Skin Care", "dosage": "Topical", "description": "Luliconazole for ringworm.", "price": 180.0, "imageUrl": "https://placehold.co/400x400?text=Lucazol" },
  { "medicineName": "Nizoder", "brandName": "Square", "strength": "2%", "category": "Skin Care", "dosage": "Shampoo", "description": "Ketoconazole antidandruff.", "price": 250.0, "imageUrl": "https://placehold.co/400x400?text=Nizoder" },
  { "medicineName": "Scabinil", "brandName": "Incepta", "strength": "5%", "category": "Skin Care", "dosage": "Lotion", "description": "Treatment for scabies.", "price": 65.0, "imageUrl": "https://placehold.co/400x400?text=Scabinil" },
  { "medicineName": "Burnasil", "brandName": "Square", "strength": "1%", "category": "Skin Care", "dosage": "Topical", "description": "For burns and wounds.", "price": 60.0, "imageUrl": "https://placehold.co/400x400?text=Burnasil" },
  { "medicineName": "Derma-V", "brandName": "ACI", "strength": "Petroleum", "category": "Skin Care", "dosage": "Topical", "description": "Pure white vaseline jelly.", "price": 45.0, "imageUrl": "https://placehold.co/400x400?text=Derma-V" },
  { "medicineName": "Mupicin", "brandName": "Incepta", "strength": "2%", "category": "Skin Care", "dosage": "Topical", "description": "Mupirocin antibiotic cream.", "price": 90.0, "imageUrl": "https://placehold.co/400x400?text=Mupicin" },
  { "medicineName": "Permerin", "brandName": "Square", "strength": "5%", "category": "Skin Care", "dosage": "Cream", "description": "Permethrin for parasites.", "price": 70.0, "imageUrl": "https://placehold.co/400x400?text=Permerin" },
  { "medicineName": "Econate", "brandName": "Incepta", "strength": "1%", "category": "Skin Care", "dosage": "Topical", "description": "Econazole fungal cream.", "price": 45.0, "imageUrl": "https://placehold.co/400x400?text=Econate" },
  { "medicineName": "Hexisol", "brandName": "ACI", "strength": "Handrub", "category": "Skin Care", "dosage": "Topical", "description": "Surgical hand disinfectant.", "price": 120.0, "imageUrl": "https://placehold.co/400x400?text=Hexisol" },
  { "medicineName": "Terbin", "brandName": "Square", "strength": "250mg", "category": "Skin Care", "dosage": "1 daily", "description": "Terbinafine antifungal tab.", "price": 25.0, "imageUrl": "https://placehold.co/400x400?text=Terbin" },
  { "medicineName": "Atolimus", "brandName": "Beximco", "strength": "0.03%", "category": "Skin Care", "dosage": "Topical", "description": "Tacrolimus for dermatitis.", "price": 350.0, "imageUrl": "https://placehold.co/400x400?text=Atolimus" },
  { "medicineName": "Quadriderm", "brandName": "MSD", "strength": "Combo", "category": "Skin Care", "dosage": "Topical", "description": "Multipurpose skin cream.", "price": 110.0, "imageUrl": "https://placehold.co/400x400?text=Quadriderm" },
  { "medicineName": "Peg-Sol", "brandName": "Square", "strength": "WaterSol", "category": "Skin Care", "dosage": "Topical", "description": "Polyethylene glycol ointment.", "price": 40.0, "imageUrl": "https://placehold.co/400x400?text=Peg-Sol" },
  { "medicineName": "Silcream", "brandName": "Incepta", "strength": "1%", "category": "Skin Care", "dosage": "Topical", "description": "Silver sulfadiazine for burns.", "price": 65.0, "imageUrl": "https://placehold.co/400x400?text=Silcream" },
  { "medicineName": "Clobeta", "brandName": "Beximco", "strength": "0.05%", "category": "Skin Care", "dosage": "Topical", "description": "Clobetasol for psoriasis.", "price": 35.0, "imageUrl": "https://placehold.co/400x400?text=Clobeta" },
  { "medicineName": "Neosone", "brandName": "Square", "strength": "Combo", "category": "Skin Care", "dosage": "Topical", "description": "For infected skin eczema.", "price": 45.0, "imageUrl": "https://placehold.co/400x400?text=Neosone" }
];

const run = async () => {
  await connectDB();

  // Ensure pharmacy exists
  let pharmacy = await Pharmacy.findOne({ name: 'Central Pharmacy' });
  if (!pharmacy) {
    pharmacy = await Pharmacy.create({ name: 'Central Pharmacy', city: 'Karachi', rating: 4.6 });
    console.log('Created Central Pharmacy', pharmacy._id.toString());
  } else {
    console.log('Using Central Pharmacy', pharmacy._id.toString());
  }

  for (const item of medicines) {
    const name = item.medicineName || item.name;
    if (!name || !item.price) {
      console.log('Skipping invalid item', item);
      continue;
    }

    const exists = await Medicine.findOne({ name, pharmacyId: pharmacy._id });
    if (exists) {
      console.log('Already exists, skipping:', name);
      continue;
    }

    const med = new Medicine({
      pharmacyId: pharmacy._id,
      name,
      brand: item.brandName || item.brand,
      strength: item.strength,
      dosage: item.dosage,
      description: item.description,
      category: item.category,
      price: Number(item.price),
      stock: item.stock || 100,
      image: item.imageUrl || item.image,
      prescriptionRequired: typeof item.prescriptionRequired === 'boolean' ? item.prescriptionRequired : ['Antibiotics','Diabetes','Heart'].includes(item.category),
    });

    await med.save();
    console.log('Inserted:', med.name);
  }

  console.log('Import complete.');
  process.exit();
};

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
