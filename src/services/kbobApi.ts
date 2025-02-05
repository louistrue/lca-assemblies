import Fuse from "fuse.js";

// Cache for KBOB materials
let cachedMaterials: KbobMaterial[] | null = null;
let materialsFuse: Fuse<KbobMaterial> | null = null;

export const EBKP_AMORTIZATION: { [key: string]: number } = {
  "B06.01": 60,
  "B06.02": 60,
  "B06.04": 60,
  "B07.02": 60,
  C01: 60,
  "C02.01": 60,
  "C02.02": 60,
  C03: 60,
  "C04.01": 60,
  "C04.04": 60,
  "C04.05": 60,
  "C04.08": 40,
  E01: 60,
  "E02.01": 30,
  "E02.02": 30,
  "E02.03": 40,
  "E02.04": 40,
  "E02.05": 40,
  E03: 30,
  "F01.01": 60,
  "F01.02": 30,
  "F01.03": 40,
  F02: 30,
  G01: 30,
  G02: 30,
  G03: 30,
  G04: 30,
};

export interface KbobMaterial {
  id: string;
  uuid: string;
  nameDE: string;
  nameFR: string;
  density: number;
  unit: string;
  gwp: number;
  gwpProduction: number;
  gwpDisposal: number;
  ubp: number;
  ubpProduction: number;
  ubpDisposal: number;
  penr: number;
  penrProduction: number;
  penrDisposal: number;
  biogenicCarbon: number;
}

interface RawKbobMaterial {
  uuid: string;
  id: string;
  nameDE: string;
  nameFR: string;
  density: string;
  unit: string;
  gwpTotal: number;
  gwpProduction: number;
  gwpDisposal: number;
  ubp21Total: number;
  ubp21Production: number;
  ubp21Disposal: number;
  primaryEnergyNonRenewableTotal: number;
  primaryEnergyNonRenewableProductionTotal: number;
  primaryEnergyNonRenewableDisposal: number;
  biogenicCarbon: number;
}

function parseDensity(densityStr: string | null | undefined): number {
  if (!densityStr) return 0;
  // Handle ranges like "2000-2400" by taking the average
  if (densityStr.includes("-")) {
    const [min, max] = densityStr
      .split("-")
      .map((s) => parseFloat(s.replace(/[^\d.]/g, "")));
    return (min + max) / 2;
  }
  // Handle ">" or "<" prefixes
  const numericValue = parseFloat(densityStr.replace(/[^\d.]/g, ""));
  return isNaN(numericValue) ? 0 : numericValue;
}

function parseDensityRange(
  densityStr: string | null | undefined
): { min: number; max: number } | null {
  if (!densityStr) return null;

  // Only return range for explicit ranges like "2000-2400"
  if (densityStr.includes("-")) {
    const [min, max] = densityStr
      .split("-")
      .map((s) => parseFloat(s.replace(/[^\d.]/g, "")));
    return { min, max };
  }

  return null;
}

const API_URL = "/api/kbob/materials";

export async function fetchKBOBMaterials(): Promise<KbobMaterial[]> {
  // Return cached materials if available
  if (cachedMaterials !== null) {
    console.log(`Returning ${cachedMaterials.length} cached KBOB materials`);
    return cachedMaterials;
  }

  const maxRetries = 3;
  const retryDelay = 1000;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`Fetching KBOB materials (attempt ${attempt}/${maxRetries})`);

      const response = await fetch(`${API_URL}?pageSize=all`, {
        method: "GET",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      let allMaterials: RawKbobMaterial[] = [];

      // Check if we got materials in the response
      if (data && Array.isArray(data)) {
        allMaterials = data;
      } else if (data && Array.isArray(data.materials)) {
        allMaterials = data.materials;
      }

      console.log(`Successfully fetched ${allMaterials.length} materials`);

      const transformedMaterials: KbobMaterial[] = allMaterials
        .map((material: RawKbobMaterial) => {
          const baseDensity = parseDensity(material.density);

          return {
            id: material.id,
            uuid: material.uuid,
            nameDE: material.nameDE || "",
            nameFR: material.nameFR || "",
            density: baseDensity,
            unit: material.unit || "",
            gwp: material.gwpTotal || 0,
            gwpProduction: material.gwpProduction || 0,
            gwpDisposal: material.gwpDisposal || 0,
            ubp: material.ubp21Total || 0,
            ubpProduction: material.ubp21Production || 0,
            ubpDisposal: material.ubp21Disposal || 0,
            penr: material.primaryEnergyNonRenewableTotal || 0,
            penrProduction:
              material.primaryEnergyNonRenewableProductionTotal || 0,
            penrDisposal: material.primaryEnergyNonRenewableDisposal || 0,
            biogenicCarbon: material.biogenicCarbon || 0,
          };
        })
        .filter(
          (material: KbobMaterial) => material.nameDE && material.density > 0
        );

      // Initialize Fuse instance for fuzzy matching
      materialsFuse = new Fuse(transformedMaterials, {
        threshold: 0.6,
        shouldSort: true,
        includeScore: true,
        keys: ["nameDE"],
      });

      // Cache the transformed materials
      cachedMaterials = transformedMaterials;
      return transformedMaterials;
    } catch (error) {
      if (attempt === maxRetries) {
        console.error("Error fetching KBOB materials:", error);
        throw error;
      }
      console.log(`Attempt ${attempt} failed, retrying in ${retryDelay}ms...`);
      await new Promise((resolve) => setTimeout(resolve, retryDelay));
    }
  }

  throw new Error("Failed to fetch KBOB materials after all retries");
}

export function findBestMaterialMatch(
  materialName: string,
  materials: KbobMaterial[]
): KbobMaterial | null {
  if (!materialsFuse) {
    materialsFuse = new Fuse(materials, {
      threshold: 0.6,
      shouldSort: true,
      includeScore: true,
      keys: ["nameDE"],
    });
  }

  // Normalize input by removing parentheses and extra spaces
  const normalizedName = materialName
    .replace(/[()]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  const results = materialsFuse.search(normalizedName);
  console.log(
    `Fuzzy match for "${materialName}":`,
    results.slice(0, 3).map((r) => ({ name: r.item.nameDE, score: r.score }))
  );

  return results.length > 0 ? results[0].item : null;
}

export function clearKBOBMaterialsCache(): void {
  cachedMaterials = null;
  console.log("KBOB materials cache cleared");
}
