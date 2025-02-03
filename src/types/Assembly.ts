import { KbobMaterial, findBestMaterialMatch } from "../services/kbobApi";

export interface Layer {
  material: string;
  fraction: number; // Volume fraction
  materialData?: {
    gwp: number | null; // kg CO2 eq/kg
    density: number | null; // kg/m³
    unit: string;
    kbobName?: string; // Store matched KBOB name
    userDefinedDensity?: boolean; // Flag to indicate if density was user-defined
  };
  rebar?: {
    material: string;
    kgPerCubicMeter: number;
    materialData?: {
      gwp: number | null;
      unit: string;
      kbobName?: string;
    };
  };
}

export interface Assembly {
  id: string;
  name: string;
  eBKPClassification: string;
  category: "Wall" | "Floor";
  width: number; // Total width in meters
  layers: Layer[];
}

export interface AssembliesState {
  assemblies: Assembly[];
  loading: boolean;
  error: string | null;
}

export function calculateEmissions(assembly: Assembly): number {
  return assembly.layers.reduce((total, layer) => {
    if (!layer.materialData?.gwp || !layer.materialData?.density) return total;

    // Calculate volume per m² of surface area
    const layerVolume = layer.fraction * assembly.width; // m³/m²

    // Calculate mass per m² of surface area
    const layerMass = layerVolume * layer.materialData.density; // kg/m²

    // Calculate base material emissions
    const baseEmissions = layerMass * layer.materialData.gwp; // kg CO2 eq/m²

    // Calculate rebar emissions if present
    let rebarEmissions = 0;
    if (layer.rebar?.materialData?.gwp) {
      const rebarMass = layerVolume * layer.rebar.kgPerCubicMeter; // kg/m²
      rebarEmissions = rebarMass * layer.rebar.materialData.gwp; // kg CO2 eq/m²
    }

    return total + baseEmissions + rebarEmissions;
  }, 0);
}

export async function updateAssemblyWithKbobData(
  assembly: Assembly,
  materials: KbobMaterial[]
): Promise<Assembly> {
  const updatedLayers = assembly.layers.map((layer) => {
    const kbobMaterial = findBestMaterialMatch(layer.material, materials);
    if (kbobMaterial) {
      return {
        ...layer,
        materialData: {
          gwp: kbobMaterial.gwp,
          density: kbobMaterial.density,
          unit: kbobMaterial.unit,
          kbobName: kbobMaterial.nameDE,
        },
      };
    }
    return layer;
  });

  return {
    ...assembly,
    layers: updatedLayers,
  };
}
