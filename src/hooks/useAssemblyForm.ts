import { useState, useEffect } from "react";
import { Assembly, Layer } from "../types/Assembly";
import {
  fetchKBOBMaterials,
  KbobMaterial,
  findBestMaterialMatch,
} from "../services/kbobApi";

interface LayerWithDensity extends Layer {
  customDensity?: number;
}

interface UseAssemblyFormProps {
  assembly?: Assembly;
  onSave: (assembly: Assembly) => void;
}

export const useAssemblyForm = ({ assembly, onSave }: UseAssemblyFormProps) => {
  const [name, setName] = useState(assembly?.name || "");
  const [id, setId] = useState(assembly?.id || "");
  const [category, setCategory] = useState<Assembly["category"]>(
    assembly?.category || "Wall"
  );
  const [layers, setLayers] = useState<LayerWithDensity[]>([]);
  const [newMaterial, setNewMaterial] = useState<KbobMaterial | null>(null);
  const [newThickness, setNewThickness] = useState("");
  const [newDensity, setNewDensity] = useState<number | null>(null);
  const [newEBKPClassification, setNewEBKPClassification] = useState("");
  const [materials, setMaterials] = useState<KbobMaterial[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingLayer, setEditingLayer] = useState<number | null>(null);
  const [showRebar, setShowRebar] = useState(false);
  const [newRebarMaterial, setNewRebarMaterial] = useState<KbobMaterial | null>(
    null
  );
  const [newRebarAmount, setNewRebarAmount] = useState<string>("");
  const [showLinearElements, setShowLinearElements] = useState(false);
  const [newLinearElementMaterial, setNewLinearElementMaterial] =
    useState<KbobMaterial | null>(null);
  const [newLinearElementWidth, setNewLinearElementWidth] = useState("");
  const [newLinearElementHeight, setNewLinearElementHeight] = useState("");
  const [newLinearElementSpacing, setNewLinearElementSpacing] = useState("");

  const totalThicknessMm = layers.reduce(
    (sum, layer) => sum + layer.thickness_mm,
    0
  );

  // Filter steel materials for rebar
  const rebarMaterials = materials.filter(
    (m) =>
      (m.nameDE.toLowerCase().includes("stahl") ||
        m.nameDE.includes("armierung")) &&
      !m.nameDE.toLowerCase().includes("beton")
  );

  // Filter materials suitable for linear elements (e.g., timber, steel)
  const linearElementMaterials = materials.filter(
    (m) =>
      m.nameDE.toLowerCase().includes("holz") ||
      m.nameDE.toLowerCase().includes("stahl") ||
      m.nameDE.toLowerCase().includes("metall")
  );

  useEffect(() => {
    const loadMaterials = async () => {
      setLoading(true);
      setError(null);
      try {
        const fetchedMaterials = await fetchKBOBMaterials();
        setMaterials(fetchedMaterials);

        if (assembly) {
          console.log("Loading assembly:", assembly);
          const convertedAssembly = convertImportedAssembly(
            assembly,
            fetchedMaterials
          );
          console.log("Converted assembly:", convertedAssembly);
          setLayers(convertedAssembly.layers);
        }
      } catch (err) {
        setError("Failed to load materials. Please try again later.");
        console.error("Error loading materials:", err);
      } finally {
        setLoading(false);
      }
    };

    loadMaterials();
  }, [assembly]);

  useEffect(() => {
    if (newMaterial) {
      setNewDensity(newMaterial.density);
    }
  }, [newMaterial]);

  const handleAddLayer = () => {
    const thicknessMm = parseFloat(newThickness);
    if (thicknessMm > 0) {
      const newLayer = {
        material: newMaterial?.nameDE || "Empty Layer",
        thickness_mm: thicknessMm,
        materialData: newMaterial
          ? {
              kbobName: newMaterial.nameDE,
              unit: newMaterial.unit,
              density: newDensity || newMaterial.density,
              userDefinedDensity: newDensity !== newMaterial.density,
              eBKPClassification: newEBKPClassification,
              amortization_years: 40,
              thickness_mm: thicknessMm,
              kg_per_m2:
                (thicknessMm / 1000) *
                (newDensity || newMaterial.density) *
                1000,
              gwp: newMaterial.gwp,
              UBP: newMaterial.ubp,
              PENRE: newMaterial.penr,
              gwp_indicator: newMaterial.gwp,
              UBP_indicator: newMaterial.ubp,
              PENRE_indicator: newMaterial.penr,
              gwp_per_year: newMaterial.gwp / 40,
              UBP_per_year: newMaterial.ubp / 40,
              PENRE_per_year: newMaterial.penr / 40,
            }
          : undefined,
        ...(showRebar &&
          newRebarMaterial &&
          newRebarAmount && {
            rebar: {
              material: newRebarMaterial.nameDE,
              kgPerCubicMeter: parseFloat(newRebarAmount),
              materialData: {
                kbobName: newRebarMaterial.nameDE,
                unit: newRebarMaterial.unit,
                density: newRebarMaterial.density,
                userDefinedDensity: false,
                eBKPClassification: newEBKPClassification,
                amortization_years: 40,
                thickness_mm: thicknessMm,
                kg_per_m2: parseFloat(newRebarAmount),
                gwp: newRebarMaterial.gwp,
                UBP: newRebarMaterial.ubp,
                PENRE: newRebarMaterial.penr,
                gwp_indicator: newRebarMaterial.gwp,
                UBP_indicator: newRebarMaterial.ubp,
                PENRE_indicator: newRebarMaterial.penr,
                gwp_per_year: newRebarMaterial.gwp / 40,
                UBP_per_year: newRebarMaterial.ubp / 40,
                PENRE_per_year: newRebarMaterial.penr / 40,
              },
            },
          }),
        ...(showLinearElements &&
          newLinearElementMaterial &&
          newLinearElementWidth &&
          newLinearElementHeight &&
          newLinearElementSpacing && {
            linearElements: {
              material: newLinearElementMaterial.nameDE,
              width: parseFloat(newLinearElementWidth),
              height: parseFloat(newLinearElementHeight),
              spacing: parseFloat(newLinearElementSpacing),
              kg_per_m2:
                (parseFloat(newLinearElementWidth) / 1000) *
                (parseFloat(newLinearElementHeight) / 1000) *
                (1 / (parseFloat(newLinearElementSpacing) / 1000)) *
                (newLinearElementMaterial.density || 0),
              materialData: {
                kbobName: newLinearElementMaterial.nameDE,
                unit: newLinearElementMaterial.unit,
                density: newLinearElementMaterial.density,
                userDefinedDensity: false,
                eBKPClassification: newEBKPClassification,
                amortization_years: 40,
                thickness_mm: thicknessMm,
                kg_per_m2:
                  (parseFloat(newLinearElementWidth) / 1000) *
                  (parseFloat(newLinearElementHeight) / 1000) *
                  (1 / (parseFloat(newLinearElementSpacing) / 1000)) *
                  (newLinearElementMaterial.density || 0),
                gwp: newLinearElementMaterial.gwp,
                UBP: newLinearElementMaterial.ubp,
                PENRE: newLinearElementMaterial.penr,
                gwp_indicator: newLinearElementMaterial.gwp,
                UBP_indicator: newLinearElementMaterial.ubp,
                PENRE_indicator: newLinearElementMaterial.penr,
                gwp_per_year: newLinearElementMaterial.gwp / 40,
                UBP_per_year: newLinearElementMaterial.ubp / 40,
                PENRE_per_year: newLinearElementMaterial.penr / 40,
              },
            },
          }),
      };

      setLayers([...layers, newLayer]);
      resetForm();
    }
  };

  const handleEditLayer = (index: number) => {
    const layer = layers[index];
    console.log("Editing layer:", layer);
    const currentMaterial =
      findBestMaterialMatch(layer.material, materials) ||
      materials.find((m) => m.nameDE === layer.materialData?.kbobName) ||
      materials.find((m) => m.nameDE === layer.material);

    setEditingLayer(index);
    setNewMaterial(currentMaterial || null);
    setNewThickness(layer.thickness_mm.toString());
    setNewDensity(layer.materialData?.density || null);
    console.log(
      "Setting eBKP classification:",
      layer.materialData?.eBKPClassification
    );
    setNewEBKPClassification(layer.materialData?.eBKPClassification || "");

    if (layer.rebar) {
      setShowRebar(true);
      const rebarMaterial =
        findBestMaterialMatch(layer.rebar.material, materials) ||
        materials.find(
          (m) => m.nameDE === layer.rebar?.materialData?.kbobName
        ) ||
        materials.find((m) => m.nameDE === layer.rebar?.material);
      setNewRebarMaterial(rebarMaterial || null);
      setNewRebarAmount(layer.rebar.kgPerCubicMeter.toString());
    } else {
      setShowRebar(false);
      setNewRebarMaterial(null);
      setNewRebarAmount("");
    }

    // Set up linear elements if present
    if (layer.linearElements) {
      setShowLinearElements(true);
      const linearElementMaterial =
        findBestMaterialMatch(layer.linearElements.material, materials) ||
        materials.find(
          (m) => m.nameDE === layer.linearElements.materialData?.kbobName
        );
      setNewLinearElementMaterial(linearElementMaterial || null);
      setNewLinearElementWidth(layer.linearElements.width.toString());
      setNewLinearElementHeight(layer.linearElements.height.toString());
      setNewLinearElementSpacing(layer.linearElements.spacing.toString());
    } else {
      setShowLinearElements(false);
      setNewLinearElementMaterial(null);
      setNewLinearElementWidth("");
      setNewLinearElementHeight("");
      setNewLinearElementSpacing("");
    }
  };

  const handleSaveLayerEdit = () => {
    if (editingLayer === null) return;

    const thicknessMm = parseFloat(newThickness);
    if (thicknessMm > 0) {
      const updatedLayer = {
        ...layers[editingLayer], // Preserve existing layer data
        material: newMaterial?.nameDE || "Empty Layer",
        thickness_mm: thicknessMm,
        materialData: newMaterial
          ? {
              kbobName: newMaterial.nameDE,
              unit: newMaterial.unit,
              density: newDensity || newMaterial.density,
              userDefinedDensity: newDensity !== newMaterial.density,
              eBKPClassification: newEBKPClassification,
              amortization_years: 40,
              thickness_mm: thicknessMm,
              kg_per_m2:
                (thicknessMm / 1000) * (newDensity || newMaterial.density),
              gwp:
                newMaterial.gwp *
                ((thicknessMm / 1000) * (newDensity || newMaterial.density)),
              UBP:
                newMaterial.ubp *
                ((thicknessMm / 1000) * (newDensity || newMaterial.density)),
              PENRE:
                newMaterial.penr *
                ((thicknessMm / 1000) * (newDensity || newMaterial.density)),
              gwp_indicator: newMaterial.gwp,
              UBP_indicator: newMaterial.ubp,
              PENRE_indicator: newMaterial.penr,
              gwp_per_year:
                (newMaterial.gwp *
                  ((thicknessMm / 1000) *
                    (newDensity || newMaterial.density))) /
                40,
              UBP_per_year:
                (newMaterial.ubp *
                  ((thicknessMm / 1000) *
                    (newDensity || newMaterial.density))) /
                40,
              PENRE_per_year:
                (newMaterial.penr *
                  ((thicknessMm / 1000) *
                    (newDensity || newMaterial.density))) /
                40,
            }
          : undefined,
        ...(showRebar &&
          newRebarMaterial &&
          newRebarAmount && {
            rebar: {
              material: newRebarMaterial.nameDE,
              kgPerCubicMeter: parseFloat(newRebarAmount),
              materialData: {
                kbobName: newRebarMaterial.nameDE,
                unit: newRebarMaterial.unit,
                density: newRebarMaterial.density,
                userDefinedDensity: false,
                eBKPClassification: newEBKPClassification,
                amortization_years: 40,
                thickness_mm: thicknessMm,
                kg_per_m2: parseFloat(newRebarAmount) * (thicknessMm / 1000),
                gwp:
                  newRebarMaterial.gwp *
                  (parseFloat(newRebarAmount) * (thicknessMm / 1000)),
                UBP:
                  newRebarMaterial.ubp *
                  (parseFloat(newRebarAmount) * (thicknessMm / 1000)),
                PENRE:
                  newRebarMaterial.penr *
                  (parseFloat(newRebarAmount) * (thicknessMm / 1000)),
                gwp_indicator: newRebarMaterial.gwp,
                UBP_indicator: newRebarMaterial.ubp,
                PENRE_indicator: newRebarMaterial.penr,
                gwp_per_year:
                  (newRebarMaterial.gwp *
                    (parseFloat(newRebarAmount) * (thicknessMm / 1000))) /
                  40,
                UBP_per_year:
                  (newRebarMaterial.ubp *
                    (parseFloat(newRebarAmount) * (thicknessMm / 1000))) /
                  40,
                PENRE_per_year:
                  (newRebarMaterial.penr *
                    (parseFloat(newRebarAmount) * (thicknessMm / 1000))) /
                  40,
              },
            },
          }),
      };

      const updatedLayers = [...layers];
      updatedLayers[editingLayer] = updatedLayer;
      setLayers(updatedLayers);
    }

    resetForm();
  };

  const resetForm = () => {
    setEditingLayer(null);
    setNewMaterial(null);
    setNewThickness("");
    setNewDensity(null);
    setNewEBKPClassification("");
    setShowRebar(false);
    setNewRebarMaterial(null);
    setNewRebarAmount("");
    setShowLinearElements(false);
    setNewLinearElementMaterial(null);
    setNewLinearElementWidth("");
    setNewLinearElementHeight("");
    setNewLinearElementSpacing("");
  };

  const handleMoveLayer = (index: number, direction: "up" | "down") => {
    const newLayers = [...layers];
    if (direction === "up" && index > 0) {
      [newLayers[index - 1], newLayers[index]] = [
        newLayers[index],
        newLayers[index - 1],
      ];
    } else if (direction === "down" && index < layers.length - 1) {
      [newLayers[index], newLayers[index + 1]] = [
        newLayers[index + 1],
        newLayers[index],
      ];
    }
    setLayers(newLayers);
  };

  const handleRemoveLayer = (index: number) => {
    setLayers(layers.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (layers.length === 0) {
      alert("Please add at least one layer");
      return;
    }

    const totalWidth = totalThicknessMm / 1000;
    if (totalWidth <= 0) {
      alert("Total width must be greater than 0");
      return;
    }

    if (!id.trim()) {
      alert("Please enter an Assembly ID");
      return;
    }

    const assemblyToSave = {
      id: id.trim(),
      name,
      category,
      width: totalWidth,
      layers,
    };

    onSave(assemblyToSave);
  };

  const handleImportAssembly = (importedAssembly: Assembly) => {
    if (!materials.length) {
      setError("Please wait for materials to load before importing");
      return;
    }

    try {
      const convertedAssembly = convertImportedAssembly(
        importedAssembly,
        materials
      );
      setName(convertedAssembly.name);
      setCategory(convertedAssembly.category as Assembly["category"]);
      setLayers(convertedAssembly.layers);
    } catch (err) {
      console.error("Error importing assembly:", err);
      setError("Failed to import assembly. Please check the format.");
    }
  };

  return {
    formState: {
      name,
      id,
      category,
      layers,
      newMaterial,
      newThickness,
      newDensity,
      newEBKPClassification,
      materials,
      loading,
      error,
      editingLayer,
      showRebar,
      newRebarMaterial,
      newRebarAmount,
      totalThicknessMm,
      rebarMaterials,
      showLinearElements,
      newLinearElementMaterial,
      newLinearElementWidth,
      newLinearElementHeight,
      newLinearElementSpacing,
      linearElementMaterials,
    },
    handlers: {
      setName,
      setId,
      setCategory,
      setNewMaterial,
      setNewThickness,
      setNewDensity,
      setNewEBKPClassification,
      setShowRebar,
      setNewRebarMaterial,
      setNewRebarAmount,
      setShowLinearElements,
      setNewLinearElementMaterial,
      setNewLinearElementWidth,
      setNewLinearElementHeight,
      setNewLinearElementSpacing,
      handleAddLayer,
      handleEditLayer,
      handleSaveLayerEdit,
      resetForm,
      handleMoveLayer,
      handleRemoveLayer,
      handleSubmit,
      handleImportAssembly,
    },
  };
};

const convertImportedAssembly = (
  assembly: Assembly,
  kbobMaterials: KbobMaterial[]
): Assembly => {
  console.log("Converting assembly:", assembly);
  const totalWidth = assembly.width * 1000;

  return {
    ...assembly,
    layers: assembly.layers.map((layer) => {
      console.log("Converting layer:", layer);
      const kbobMaterial =
        findBestMaterialMatch(layer.material, kbobMaterials) ||
        kbobMaterials.find((m) => m.nameDE === layer.materialData?.kbobName);
      const layerThicknessMm = layer.thickness_mm;

      const materialData = {
        ...layer.materialData,
        gwp: kbobMaterial?.gwp || layer.materialData?.gwp || 0,
        density: layer.materialData?.userDefinedDensity
          ? layer.materialData.density
          : kbobMaterial?.density || layer.materialData?.density || 0,
        unit: kbobMaterial?.unit || layer.materialData?.unit || "kg",
        kbobName: kbobMaterial?.nameDE || layer.materialData?.kbobName,
        userDefinedDensity: layer.materialData?.userDefinedDensity || false,
        eBKPClassification: layer.materialData?.eBKPClassification || "",
        amortization_years: layer.materialData?.amortization_years || 40,
        thickness_mm:
          layer.thickness_mm ||
          (layer.fraction ? layer.fraction * assembly.width * 1000 : 0),
        kg_per_m2: layer.materialData?.kg_per_m2 || 0,
        UBP: layer.materialData?.UBP || 0,
        PENRE: layer.materialData?.PENRE || 0,
        gwp_indicator: layer.materialData?.gwp_indicator || 0,
        UBP_indicator: layer.materialData?.UBP_indicator || 0,
        PENRE_indicator: layer.materialData?.PENRE_indicator || 0,
        gwp_per_year: layer.materialData?.gwp_per_year || 0,
        UBP_per_year: layer.materialData?.UBP_per_year || 0,
        PENRE_per_year: layer.materialData?.PENRE_per_year || 0,
      };

      console.log("Converted materialData:", materialData);

      return {
        ...layer,
        thickness_mm:
          layer.thickness_mm ||
          (layer.fraction ? layer.fraction * assembly.width * 1000 : 0),
        materialData,
      };
    }),
  };
};
