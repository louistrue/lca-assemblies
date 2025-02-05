import { KbobMaterial, findBestMaterialMatch } from "../services/kbobApi";

export interface LinearElement {
  material: string;
  width: number; // mm
  height: number; // mm
  spacing: number; // mm center-to-center
  materialData?: {
    gwp: number | null;
    penr: number | null;
    ubp: number | null;
    unit: string;
    kbobName?: string;
  };
}

export interface MaterialData {
  kbobName?: string;
  unit: string;
  density: number | null;
  userDefinedDensity?: boolean;
  eBKPClassification: string;
  amortization_years: number;
  thickness_mm: number; // in millimeters
  kg_per_m2: number;
  gwp: number;
  UBP: number;
  PENRE: number;
  gwp_indicator: number;
  UBP_indicator: number;
  PENRE_indicator: number;
  gwp_per_year: number;
  UBP_per_year: number;
  PENRE_per_year: number;
}

export interface Layer {
  material: string;
  thickness_mm: number; // in millimeters
  materialData?: MaterialData;
  rebar?: {
    material: string;
    kgPerCubicMeter: number;
    materialData?: MaterialData;
  };
  linearElements?: {
    material: string;
    width: number; // mm
    height: number; // mm
    spacing: number; // mm center-to-center
    kg_per_m2: number;
    materialData?: MaterialData;
  };
}

export interface Assembly {
  id: string;
  name: string;
  category: "Wall" | "Floor";
  width: number; // Total width in meters
  total_gwp: number;
  total_ubp: number;
  total_penre: number;
  total_gwp_per_year: number;
  total_ubp_per_year: number;
  total_penre_per_year: number;
  layers: Layer[];
}

export interface AssembliesState {
  assemblies: Assembly[];
  loading: boolean;
  error: string | null;
}

export const calculateEmissions = (
  assembly: Assembly,
  metric: "gwp" | "penr" | "ubp" = "gwp"
): number => {
  const getMetricValue = (materialData: MaterialData) => {
    switch (metric) {
      case "penr":
        return materialData.PENRE;
      case "ubp":
        return materialData.UBP;
      default:
        return materialData.gwp;
    }
  };

  return assembly.layers.reduce((total, layer) => {
    let layerEmissions = 0;

    // Base material emissions
    if (layer.materialData) {
      layerEmissions += getMetricValue(layer.materialData);
    }

    // Rebar emissions
    if (layer.rebar?.materialData) {
      layerEmissions += getMetricValue(layer.rebar.materialData);
    }

    // Linear elements emissions
    if (layer.linearElements?.materialData) {
      layerEmissions += getMetricValue(layer.linearElements.materialData);
    }

    return total + layerEmissions;
  }, 0);
};

export interface LegacyMaterialData {
  kbobName?: string;
  unit: string;
  density: number | null;
  userDefinedDensity?: boolean;
  eBKPClassification: string;
  amortization_years: number;
  layer_thickness?: number; // in meters
  kg_per_m2: number;
  gwp: number;
  UBP: number;
  PENRE: number;
  gwp_indicator: number;
  UBP_indicator: number;
  PENRE_indicator: number;
  gwp_per_year: number;
  UBP_per_year: number;
  PENRE_per_year: number;
}

export interface LegacyLayer {
  material: string;
  fraction?: number;
  materialData?: LegacyMaterialData;
  rebar?: {
    material: string;
    kgPerCubicMeter: number;
    materialData?: LegacyMaterialData;
  };
  linearElements?: {
    material: string;
    width: number; // mm
    height: number; // mm
    spacing: number; // mm center-to-center
    kg_per_m2: number;
    materialData?: LegacyMaterialData;
  };
}

export interface LegacyAssembly {
  id: string;
  name: string;
  category: "Wall" | "Floor";
  width: number;
  total_gwp: number;
  total_ubp: number;
  total_penre: number;
  total_gwp_per_year: number;
  total_ubp_per_year: number;
  total_penre_per_year: number;
  layers: LegacyLayer[];
}

const convertImportedAssembly = (
  assembly: LegacyAssembly,
  kbobMaterials: KbobMaterial[]
): Assembly => {
  console.log("Converting assembly:", assembly.id, assembly.name);
  console.log("Total width:", assembly.width * 1000, "mm");

  return {
    ...assembly,
    layers: assembly.layers.map((layer: LegacyLayer, index) => {
      console.log(`\nProcessing layer ${index}:`, layer.material);

      // Calculate thickness in mm from either layer_thickness (m) or fraction
      let thickness_mm = 0;
      if (layer.materialData?.layer_thickness) {
        thickness_mm = layer.materialData.layer_thickness * 1000; // Convert m to mm
      } else if (layer.fraction) {
        thickness_mm = assembly.width * 1000 * layer.fraction;
      }

      console.log("Original layer data:", {
        fraction: layer.fraction,
        layer_thickness: layer.materialData?.layer_thickness,
        calculated_thickness_mm: thickness_mm,
        materialData: layer.materialData,
        rebar: layer.rebar,
        linearElements: layer.linearElements,
      });

      const kbobMaterial =
        findBestMaterialMatch(layer.material, kbobMaterials) ||
        kbobMaterials.find((m) => m.nameDE === layer.materialData?.kbobName);

      console.log(
        "Found KBOB material:",
        kbobMaterial
          ? {
              nameDE: kbobMaterial.nameDE,
              density: kbobMaterial.density,
              gwp: kbobMaterial.gwp,
              ubp: kbobMaterial.ubp,
              penr: kbobMaterial.penr,
            }
          : "none"
      );

      // If we have existing materialData, preserve it
      if (layer.materialData) {
        // Keep existing values but update with KBOB data if available
        const updatedMaterialData: MaterialData = {
          kbobName: kbobMaterial?.nameDE || layer.materialData.kbobName,
          unit: kbobMaterial?.unit || layer.materialData.unit,
          density: kbobMaterial?.density || layer.materialData.density || 0,
          userDefinedDensity: false,
          eBKPClassification: layer.materialData.eBKPClassification || "",
          amortization_years: layer.materialData.amortization_years || 40,
          thickness_mm,
          // Calculate kg/m2: thickness in m * density in kg/m3
          kg_per_m2: (thickness_mm / 1000) * (kbobMaterial?.density || 0),
          gwp: 0,
          UBP: 0,
          PENRE: 0,
          gwp_indicator: kbobMaterial?.gwp || 0,
          UBP_indicator: kbobMaterial?.ubp || 0,
          PENRE_indicator: kbobMaterial?.penr || 0,
          gwp_per_year: 0,
          UBP_per_year: 0,
          PENRE_per_year: 0,
        };

        // Calculate impact values
        if (kbobMaterial) {
          const material_kg_per_m2 =
            (thickness_mm / 1000) * kbobMaterial.density;
          updatedMaterialData.kg_per_m2 = material_kg_per_m2;
          updatedMaterialData.gwp = kbobMaterial.gwp * material_kg_per_m2;
          updatedMaterialData.UBP = kbobMaterial.ubp * material_kg_per_m2;
          updatedMaterialData.PENRE = kbobMaterial.penr * material_kg_per_m2;
          updatedMaterialData.gwp_per_year =
            updatedMaterialData.gwp / updatedMaterialData.amortization_years;
          updatedMaterialData.UBP_per_year =
            updatedMaterialData.UBP / updatedMaterialData.amortization_years;
          updatedMaterialData.PENRE_per_year =
            updatedMaterialData.PENRE / updatedMaterialData.amortization_years;
        }

        // Process rebar if present
        let rebarData = undefined;
        if (layer.rebar) {
          const rebarKbobMaterial =
            findBestMaterialMatch(layer.rebar.material, kbobMaterials) ||
            kbobMaterials.find(
              (m) => m.nameDE === layer.rebar?.materialData?.kbobName
            );

          if (rebarKbobMaterial) {
            // Calculate kg/m2 for the rebar based on kgPerCubicMeter and layer thickness
            const rebar_kg_per_m2 =
              layer.rebar.kgPerCubicMeter * (thickness_mm / 1000);

            rebarData = {
              material: layer.rebar.material,
              kgPerCubicMeter: layer.rebar.kgPerCubicMeter,
              materialData: {
                kbobName: rebarKbobMaterial.nameDE,
                unit: rebarKbobMaterial.unit,
                density: rebarKbobMaterial.density,
                userDefinedDensity: false,
                eBKPClassification:
                  layer.materialData?.eBKPClassification || "",
                amortization_years:
                  layer.materialData?.amortization_years || 40,
                thickness_mm,
                kg_per_m2: rebar_kg_per_m2,
                gwp: rebarKbobMaterial.gwp * rebar_kg_per_m2,
                UBP: rebarKbobMaterial.ubp * rebar_kg_per_m2,
                PENRE: rebarKbobMaterial.penr * rebar_kg_per_m2,
                gwp_indicator: rebarKbobMaterial.gwp,
                UBP_indicator: rebarKbobMaterial.ubp,
                PENRE_indicator: rebarKbobMaterial.penr,
                gwp_per_year:
                  (rebarKbobMaterial.gwp * rebar_kg_per_m2) /
                  (layer.materialData?.amortization_years || 40),
                UBP_per_year:
                  (rebarKbobMaterial.ubp * rebar_kg_per_m2) /
                  (layer.materialData?.amortization_years || 40),
                PENRE_per_year:
                  (rebarKbobMaterial.penr * rebar_kg_per_m2) /
                  (layer.materialData?.amortization_years || 40),
              },
            };
          }
        }

        // Process linear elements if present
        let linearElementsData = undefined;
        if (layer.linearElements) {
          const linearElementKbobMaterial =
            findBestMaterialMatch(
              layer.linearElements.material,
              kbobMaterials
            ) ||
            kbobMaterials.find(
              (m) => m.nameDE === layer.linearElements?.materialData?.kbobName
            );

          if (linearElementKbobMaterial) {
            const kg_per_m2 =
              (layer.linearElements.width / 1000) *
              (layer.linearElements.height / 1000) *
              (1 / (layer.linearElements.spacing / 1000)) *
              linearElementKbobMaterial.density;

            linearElementsData = {
              material: layer.linearElements.material,
              width: layer.linearElements.width,
              height: layer.linearElements.height,
              spacing: layer.linearElements.spacing,
              kg_per_m2,
              materialData: {
                ...updatedMaterialData,
                kbobName: linearElementKbobMaterial.nameDE,
                density: linearElementKbobMaterial.density,
                kg_per_m2,
                gwp: linearElementKbobMaterial.gwp * kg_per_m2,
                UBP: linearElementKbobMaterial.ubp * kg_per_m2,
                PENRE: linearElementKbobMaterial.penr * kg_per_m2,
                gwp_per_year:
                  (linearElementKbobMaterial.gwp * kg_per_m2) /
                  updatedMaterialData.amortization_years,
                UBP_per_year:
                  (linearElementKbobMaterial.ubp * kg_per_m2) /
                  updatedMaterialData.amortization_years,
                PENRE_per_year:
                  (linearElementKbobMaterial.penr * kg_per_m2) /
                  updatedMaterialData.amortization_years,
              },
            };
          }
        }

        return {
          material: layer.material,
          thickness_mm,
          materialData: updatedMaterialData,
          rebar: rebarData,
          linearElements: linearElementsData,
        };
      }

      // For new layers without materialData, create full structure
      if (kbobMaterial) {
        const kgPerM2 = (thickness_mm / 1000) * (kbobMaterial.density || 0);

        const materialData: MaterialData = {
          kbobName: kbobMaterial.nameDE,
          unit: kbobMaterial.unit,
          density: kbobMaterial.density,
          userDefinedDensity: false,
          eBKPClassification: "",
          amortization_years: 40,
          thickness_mm,
          kg_per_m2: kgPerM2,
          gwp: kbobMaterial.gwp * kgPerM2,
          UBP: kbobMaterial.ubp * kgPerM2,
          PENRE: kbobMaterial.penr * kgPerM2,
          gwp_indicator: kbobMaterial.gwp,
          UBP_indicator: kbobMaterial.ubp,
          PENRE_indicator: kbobMaterial.penr,
          gwp_per_year: (kbobMaterial.gwp * kgPerM2) / 40,
          UBP_per_year: (kbobMaterial.ubp * kgPerM2) / 40,
          PENRE_per_year: (kbobMaterial.penr * kgPerM2) / 40,
        };

        return {
          material: layer.material,
          thickness_mm,
          materialData,
        };
      }

      console.log("Warning: No KBOB material found for layer", layer.material);
      return {
        material: layer.material,
        thickness_mm,
      };
    }),
  };
};

export async function updateAssemblyWithKbobData(
  assembly: LegacyAssembly,
  materials: KbobMaterial[]
): Promise<Assembly> {
  const updatedAssembly = convertImportedAssembly(assembly, materials);

  // Calculate totals
  const totals = updatedAssembly.layers.reduce(
    (acc, layer) => {
      if (layer.materialData) {
        acc.gwp += layer.materialData.gwp;
        acc.ubp += layer.materialData.UBP;
        acc.penre += layer.materialData.PENRE;
        acc.gwpYear += layer.materialData.gwp_per_year;
        acc.ubpYear += layer.materialData.UBP_per_year;
        acc.penreYear += layer.materialData.PENRE_per_year;
      }
      return acc;
    },
    { gwp: 0, ubp: 0, penre: 0, gwpYear: 0, ubpYear: 0, penreYear: 0 }
  );

  return {
    ...updatedAssembly,
    total_gwp: totals.gwp,
    total_ubp: totals.ubp,
    total_penre: totals.penre,
    total_gwp_per_year: totals.gwpYear,
    total_ubp_per_year: totals.ubpYear,
    total_penre_per_year: totals.penreYear,
  };
}
