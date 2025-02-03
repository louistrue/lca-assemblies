import Fuse from "fuse.js";

// Cache for KBOB materials
let cachedMaterials: KbobMaterial[] | null = null;
let materialsFuse: Fuse<KbobMaterial> | null = null;

export interface KbobMaterial {
  id: string;
  nameDE: string;
  nameFR: string;
  density: number;
  densityMin?: number;
  densityMax?: number;
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
  nameDE?: string;
  density?: string;
  densityMin?: string;
  densityMax?: string;
  unit?: string;
  gwpTotal?: number;
  ubp21Total?: number;
  primaryEnergyNonRenewableTotal?: number;
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

      // Single request with pageSize=all
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
          const densityRange = parseDensityRange(material.density);

          return {
            id: material.uuid,
            nameDE: material.nameDE || "",
            nameFR: "",
            density: baseDensity,
            ...(densityRange && {
              densityMin: densityRange.min,
              densityMax: densityRange.max,
            }),
            unit: material.unit || "",
            gwp: material.gwpTotal || 0,
            gwpProduction: 0,
            gwpDisposal: 0,
            ubp: material.ubp21Total || 0,
            ubpProduction: 0,
            ubpDisposal: 0,
            penr: material.primaryEnergyNonRenewableTotal || 0,
            penrProduction: 0,
            penrDisposal: 0,
            biogenicCarbon: 0,
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
