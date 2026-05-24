import vinDatabase from '../data/vin_database.json';

const { records, meta } = vinDatabase;

export function getDatabaseMeta() {
  return meta;
}

export function getAllRecords() {
  return records;
}

export function findByVinHash(vinHash) {
  if (!vinHash?.trim()) return [];
  const key = vinHash.trim().toLowerCase();
  return records.filter((r) => r.VIN_Hash?.toLowerCase() === key);
}

export function getVehicleSummary(vinHash) {
  const services = findByVinHash(vinHash);
  if (!services.length) return null;

  const latest = services[0];
  const maintenanceCount = services.filter(
    (s) => s.ServiceType?.toLowerCase().includes('maintenance')
  ).length;

  return {
    vinHash: latest.VIN_Hash,
    modelName: latest.ModelName,
    modelYear: latest.ModelYear,
    km: latest.KM,
    dealerCode: latest.DealerCode,
    lastServiceDate: latest.ServiceDate,
    totalServices: services.length,
    maintenanceCount,
    loyaltyPoints: maintenanceCount * 150 + services.length * 50,
    tier: getTier(maintenanceCount),
  };
}

function getTier(maintenanceCount) {
  if (maintenanceCount >= 5) return 'Platinum';
  if (maintenanceCount >= 3) return 'Gold';
  if (maintenanceCount >= 1) return 'Silver';
  return 'Bronze';
}

export function getSampleVinHashes(limit = 5) {
  const seen = new Set();
  const samples = [];
  for (const r of records) {
    if (!r.VIN_Hash || seen.has(r.VIN_Hash)) continue;
    seen.add(r.VIN_Hash);
    samples.push({
      vinHash: r.VIN_Hash,
      model: `${r.ModelName} ${r.ModelYear}`,
    });
    if (samples.length >= limit) break;
  }
  return samples;
}

export function searchRecords(query) {
  const q = query?.trim().toLowerCase();
  if (!q) return [];
  return records.filter(
    (r) =>
      r.VIN_Hash?.toLowerCase().includes(q) ||
      r.ModelName?.toLowerCase().includes(q) ||
      r.DealerCode?.includes(q)
  );
}
