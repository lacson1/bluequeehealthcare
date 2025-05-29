#!/bin/bash

BASE_URL="http://localhost:5000/api/medicines"

# Additional pediatric medications
curl -s -X POST "$BASE_URL" -H "Content-Type: application/json" -d '{"name":"Amoxicillin Suspension 125mg/5ml","description":"Pediatric antibiotic suspension","quantity":80,"unit":"bottles","lowStockThreshold":24,"supplier":"GSK Nigeria","expiryDate":"2027-03-15"}'
curl -s -X POST "$BASE_URL" -H "Content-Type: application/json" -d '{"name":"Cotrimoxazole Suspension","description":"Pediatric antibiotic for infections","quantity":70,"unit":"bottles","lowStockThreshold":21,"supplier":"Roche Nigeria","expiryDate":"2027-02-20"}'
curl -s -X POST "$BASE_URL" -H "Content-Type: application/json" -d '{"name":"Iron Drops 15mg/ml","description":"Pediatric iron supplement","quantity":60,"unit":"bottles","lowStockThreshold":18,"supplier":"Akorn Nigeria","expiryDate":"2027-08-30"}'
curl -s -X POST "$BASE_URL" -H "Content-Type: application/json" -d '{"name":"Vitamin D Drops 400IU/ml","description":"Pediatric vitamin D supplement","quantity":50,"unit":"bottles","lowStockThreshold":15,"supplier":"Carlson Nigeria","expiryDate":"2027-12-31"}'
curl -s -X POST "$BASE_URL" -H "Content-Type: application/json" -d '{"name":"Gripe Water","description":"Herbal remedy for infant colic","quantity":90,"unit":"bottles","lowStockThreshold":25,"supplier":"Woodwards Nigeria","expiryDate":"2028-06-30"}'

# More tropical disease medications
curl -s -X POST "$BASE_URL" -H "Content-Type: application/json" -d '{"name":"Artemether/Lumefantrine","description":"Antimalarial combination therapy","quantity":120,"unit":"tablets","lowStockThreshold":35,"supplier":"Novartis Nigeria","expiryDate":"2027-01-30"}'
curl -s -X POST "$BASE_URL" -H "Content-Type: application/json" -d '{"name":"Pyrimethamine 25mg","description":"Antimalarial for prophylaxis","quantity":80,"unit":"tablets","lowStockThreshold":24,"supplier":"GSK Nigeria","expiryDate":"2026-11-20"}'
curl -s -X POST "$BASE_URL" -H "Content-Type: application/json" -d '{"name":"Sulfadoxine/Pyrimethamine","description":"Antimalarial combination","quantity":100,"unit":"tablets","lowStockThreshold":30,"supplier":"Roche Nigeria","expiryDate":"2027-04-15"}'
curl -s -X POST "$BASE_URL" -H "Content-Type: application/json" -d '{"name":"Ivermectin 6mg","description":"Antiparasitic for river blindness","quantity":90,"unit":"tablets","lowStockThreshold":25,"supplier":"Merck Nigeria","expiryDate":"2027-02-28"}'
curl -s -X POST "$BASE_URL" -H "Content-Type: application/json" -d '{"name":"Pentamidine 300mg","description":"Antiprotozoal for pneumonia","quantity":20,"unit":"vials","lowStockThreshold":6,"supplier":"Sanofi Nigeria","expiryDate":"2026-10-25"}'

# Contraceptives and family planning
curl -s -X POST "$BASE_URL" -H "Content-Type: application/json" -d '{"name":"Combined Oral Contraceptive","description":"Birth control pills","quantity":150,"unit":"packs","lowStockThreshold":45,"supplier":"Bayer Nigeria","expiryDate":"2027-09-30"}'
curl -s -X POST "$BASE_URL" -H "Content-Type: application/json" -d '{"name":"Progestin-only Pills","description":"Mini-pill contraceptive","quantity":100,"unit":"packs","lowStockThreshold":30,"supplier":"Organon Nigeria","expiryDate":"2027-06-15"}'
curl -s -X POST "$BASE_URL" -H "Content-Type: application/json" -d '{"name":"Emergency Contraceptive","description":"Morning-after pill","quantity":80,"unit":"tablets","lowStockThreshold":24,"supplier":"HRA Pharma","expiryDate":"2027-03-20"}'
curl -s -X POST "$BASE_URL" -H "Content-Type: application/json" -d '{"name":"Medroxyprogesterone Injection","description":"3-month contraceptive injection","quantity":40,"unit":"vials","lowStockThreshold":12,"supplier":"Pfizer Nigeria","expiryDate":"2026-12-31"}'

# Additional wound care and topicals
curl -s -X POST "$BASE_URL" -H "Content-Type: application/json" -d '{"name":"Silver Sulfadiazine 1%","description":"Topical antimicrobial for burns","quantity":50,"unit":"tubes","lowStockThreshold":15,"supplier":"Smith & Nephew","expiryDate":"2027-01-25"}'
curl -s -X POST "$BASE_URL" -H "Content-Type: application/json" -d '{"name":"Hydrocolloid Dressings","description":"Advanced wound dressings","quantity":100,"unit":"pieces","lowStockThreshold":30,"supplier":"ConvaTec Nigeria","expiryDate":"2028-12-31"}'
curl -s -X POST "$BASE_URL" -H "Content-Type: application/json" -d '{"name":"Povidone Iodine 10%","description":"Antiseptic solution","quantity":80,"unit":"bottles","lowStockThreshold":24,"supplier":"Mundipharma Nigeria","expiryDate":"2027-08-15"}'
curl -s -X POST "$BASE_URL" -H "Content-Type: application/json" -d '{"name":"Chlorhexidine 4%","description":"Antiseptic skin cleanser","quantity":70,"unit":"bottles","lowStockThreshold":21,"supplier":"Molnlycke Nigeria","expiryDate":"2027-05-20"}'

# More specialized medications
curl -s -X POST "$BASE_URL" -H "Content-Type: application/json" -d '{"name":"Baclofen 10mg","description":"Muscle relaxant for spasticity","quantity":60,"unit":"tablets","lowStockThreshold":18,"supplier":"Novartis Nigeria","expiryDate":"2027-02-15"}'
curl -s -X POST "$BASE_URL" -H "Content-Type: application/json" -d '{"name":"Tizanidine 4mg","description":"Muscle relaxant","quantity":70,"unit":"tablets","lowStockThreshold":21,"supplier":"Acorda Nigeria","expiryDate":"2026-11-30"}'
curl -s -X POST "$BASE_URL" -H "Content-Type: application/json" -d '{"name":"Gabapentin 300mg","description":"Anticonvulsant for neuropathic pain","quantity":90,"unit":"capsules","lowStockThreshold":27,"supplier":"Pfizer Nigeria","expiryDate":"2027-04-10"}'
curl -s -X POST "$BASE_URL" -H "Content-Type: application/json" -d '{"name":"Pregabalin 150mg","description":"Anticonvulsant for neuropathic pain","quantity":80,"unit":"capsules","lowStockThreshold":24,"supplier":"Pfizer Nigeria","expiryDate":"2027-01-18"}'

# Anti-fungal medications
curl -s -X POST "$BASE_URL" -H "Content-Type: application/json" -d '{"name":"Fluconazole 150mg","description":"Antifungal for candidiasis","quantity":100,"unit":"capsules","lowStockThreshold":30,"supplier":"Pfizer Nigeria","expiryDate":"2027-03-25"}'
curl -s -X POST "$BASE_URL" -H "Content-Type: application/json" -d '{"name":"Itraconazole 100mg","description":"Broad-spectrum antifungal","quantity":80,"unit":"capsules","lowStockThreshold":24,"supplier":"Janssen Nigeria","expiryDate":"2026-12-20"}'
curl -s -X POST "$BASE_URL" -H "Content-Type: application/json" -d '{"name":"Terbinafine 250mg","description":"Antifungal for nail infections","quantity":70,"unit":"tablets","lowStockThreshold":21,"supplier":"Novartis Nigeria","expiryDate":"2027-02-28"}'
curl -s -X POST "$BASE_URL" -H "Content-Type: application/json" -d '{"name":"Nystatin Suspension","description":"Antifungal for oral thrush","quantity":60,"unit":"bottles","lowStockThreshold":18,"supplier":"Bristol Myers Squibb","expiryDate":"2027-06-30"}'

# Additional emergency medications
curl -s -X POST "$BASE_URL" -H "Content-Type: application/json" -d '{"name":"Activated Charcoal 25g","description":"Antidote for poisoning","quantity":40,"unit":"bottles","lowStockThreshold":12,"supplier":"Actavis Nigeria","expiryDate":"2028-12-31"}'
curl -s -X POST "$BASE_URL" -H "Content-Type: application/json" -d '{"name":"Calcium Gluconate 10%","description":"Antidote for calcium channel blocker toxicity","quantity":30,"unit":"ampoules","lowStockThreshold":9,"supplier":"Fresenius Nigeria","expiryDate":"2027-01-15"}'
curl -s -X POST "$BASE_URL" -H "Content-Type: application/json" -d '{"name":"Sodium Bicarbonate 8.4%","description":"Alkalinizing agent for acidosis","quantity":35,"unit":"vials","lowStockThreshold":10,"supplier":"Hospira Nigeria","expiryDate":"2027-04-20"}'

# Herbal and traditional medications
curl -s -X POST "$BASE_URL" -H "Content-Type: application/json" -d '{"name":"Artemisia Extract","description":"Traditional antimalarial herb","quantity":60,"unit":"bottles","lowStockThreshold":18,"supplier":"Phyto Nigeria","expiryDate":"2027-08-30"}'
curl -s -X POST "$BASE_URL" -H "Content-Type: application/json" -d '{"name":"Ginger Root Extract","description":"Natural antiemetic","quantity":80,"unit":"capsules","lowStockThreshold":24,"supplier":"Herbs Nigeria","expiryDate":"2027-12-31"}'
curl -s -X POST "$BASE_URL" -H "Content-Type: application/json" -d '{"name":"Turmeric Capsules","description":"Anti-inflammatory supplement","quantity":90,"unit":"capsules","lowStockThreshold":25,"supplier":"Nature Plus Nigeria","expiryDate":"2027-10-15"}'

# Additional diagnostic aids
curl -s -X POST "$BASE_URL" -H "Content-Type: application/json" -d '{"name":"Glucose Test Strips","description":"Blood glucose monitoring strips","quantity":500,"unit":"strips","lowStockThreshold":150,"supplier":"Roche Nigeria","expiryDate":"2027-06-30"}'
curl -s -X POST "$BASE_URL" -H "Content-Type: application/json" -d '{"name":"Urine Dipsticks","description":"Urinalysis test strips","quantity":200,"unit":"strips","lowStockThreshold":60,"supplier":"Siemens Nigeria","expiryDate":"2027-09-30"}'
curl -s -X POST "$BASE_URL" -H "Content-Type: application/json" -d '{"name":"Pregnancy Test Kits","description":"HCG pregnancy detection","quantity":100,"unit":"kits","lowStockThreshold":30,"supplier":"Clearblue Nigeria","expiryDate":"2027-12-31"}'

echo "Added pediatric, tropical disease, contraceptive, wound care, specialized, antifungal, emergency, herbal, and diagnostic medications..."