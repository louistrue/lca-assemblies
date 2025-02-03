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
  const [eBKPClassification, setEBKPClassification] = useState(
    assembly?.eBKPClassification || ""
  );
  const [category, setCategory] = useState<Assembly["category"]>(
    assembly?.category || "Wall"
  );
  const [layers, setLayers] = useState<LayerWithDensity[]>([]);
  const [newMaterial, setNewMaterial] = useState<KbobMaterial | null>(null);
  const [newThickness, setNewThickness] = useState("");
  const [newDensity, setNewDensity] = useState<number | null>(null);
  const [materials, setMaterials] = useState<KbobMaterial[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingLayer, setEditingLayer] = useState<number | null>(null);
  const [showRebar, setShowRebar] = useState(false);
  const [newRebarMaterial, setNewRebarMaterial] = useState<KbobMaterial | null>(
    null
  );
  const [newRebarAmount, setNewRebarAmount] = useState<string>("");

  const totalThicknessMm = layers.reduce(
    (sum, layer) => sum + layer.fraction,
    0
  );

  // Filter steel materials for rebar
  const rebarMaterials = materials.filter(
    (m) =>
      (m.nameDE.toLowerCase().includes("stahl") ||
        m.nameDE.includes("armierung")) &&
      !m.nameDE.toLowerCase().includes("beton")
  );

  useEffect(() => {
    const loadMaterials = async () => {
      setLoading(true);
      setError(null);
      try {
        const fetchedMaterials = await fetchKBOBMaterials();
        setMaterials(fetchedMaterials);

        if (assembly) {
          const convertedAssembly = convertImportedAssembly(
            assembly,
            fetchedMaterials
          );
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
    if (newMaterial && newThickness && newDensity) {
      const thicknessMm = parseFloat(newThickness);
      if (thicknessMm > 0) {
        const newLayer = {
          material: newMaterial.nameDE,
          fraction: thicknessMm,
          materialData: {
            gwp: newMaterial.gwp,
            density: newDensity,
            unit: newMaterial.unit,
            kbobName: newMaterial.nameDE,
            userDefinedDensity: newDensity !== newMaterial.density,
          },
          ...(newRebarMaterial &&
            newRebarAmount && {
              rebar: {
                material: newRebarMaterial.nameDE,
                kgPerCubicMeter: parseFloat(newRebarAmount),
                materialData: {
                  gwp: newRebarMaterial.gwp,
                  unit: newRebarMaterial.unit,
                  kbobName: newRebarMaterial.nameDE,
                },
              },
            }),
        };

        setLayers([...layers, newLayer]);
        resetForm();
      }
    }
  };

  const handleEditLayer = (index: number) => {
    const layer = layers[index];
    const currentMaterial =
      findBestMaterialMatch(layer.material, materials) ||
      materials.find((m) => m.nameDE === layer.materialData?.kbobName) ||
      materials.find((m) => m.nameDE === layer.material);

    setEditingLayer(index);
    setNewMaterial(currentMaterial || null);
    setNewThickness(layer.fraction.toString());
    setNewDensity(layer.materialData?.density || null);

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
  };

  const handleSaveLayerEdit = () => {
    if (editingLayer !== null && newMaterial && newThickness && newDensity) {
      const thicknessMm = parseFloat(newThickness);
      if (thicknessMm > 0) {
        const updatedLayers = [...layers];
        updatedLayers[editingLayer] = {
          material: newMaterial.nameDE,
          fraction: thicknessMm,
          materialData: {
            gwp: newMaterial.gwp,
            density: newDensity,
            unit: newMaterial.unit,
            kbobName: newMaterial.nameDE,
            userDefinedDensity: newDensity !== newMaterial.density,
          },
          ...(showRebar &&
            newRebarMaterial &&
            newRebarAmount && {
              rebar: {
                material: newRebarMaterial.nameDE,
                kgPerCubicMeter: parseFloat(newRebarAmount),
                materialData: {
                  gwp: newRebarMaterial.gwp,
                  unit: newRebarMaterial.unit,
                  kbobName: newRebarMaterial.nameDE,
                },
              },
            }),
        };
        setLayers(updatedLayers);
        resetForm();
      }
    }
  };

  const resetForm = () => {
    setEditingLayer(null);
    setNewMaterial(null);
    setNewThickness("");
    setNewDensity(null);
    setShowRebar(false);
    setNewRebarMaterial(null);
    setNewRebarAmount("");
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

    const assemblyToSave = {
      id: assembly?.id || Math.random().toString(36).substr(2, 9),
      name,
      eBKPClassification,
      category,
      width: totalWidth,
      layers: layers.map((layer) => ({
        ...layer,
        fraction: layer.fraction / totalThicknessMm,
      })),
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
      setEBKPClassification(convertedAssembly.eBKPClassification);
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
      eBKPClassification,
      category,
      layers,
      newMaterial,
      newThickness,
      newDensity,
      materials,
      loading,
      error,
      editingLayer,
      showRebar,
      newRebarMaterial,
      newRebarAmount,
      totalThicknessMm,
      rebarMaterials,
    },
    handlers: {
      setName,
      setEBKPClassification,
      setCategory,
      setNewMaterial,
      setNewThickness,
      setNewDensity,
      setShowRebar,
      setNewRebarMaterial,
      setNewRebarAmount,
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
  const totalWidth = assembly.width * 1000;

  return {
    ...assembly,
    layers: assembly.layers.map((layer) => {
      const kbobMaterial =
        findBestMaterialMatch(layer.material, kbobMaterials) ||
        kbobMaterials.find((m) => m.nameDE === layer.materialData?.kbobName);
      const layerThicknessMm = layer.fraction * totalWidth;

      return {
        ...layer,
        fraction: layerThicknessMm,
        materialData: {
          gwp: kbobMaterial?.gwp || layer.materialData?.gwp || 0,
          density: layer.materialData?.userDefinedDensity
            ? layer.materialData.density
            : kbobMaterial?.density || layer.materialData?.density || 0,
          unit: kbobMaterial?.unit || layer.materialData?.unit || "kg",
          kbobName: kbobMaterial?.nameDE || layer.materialData?.kbobName,
          userDefinedDensity: layer.materialData?.userDefinedDensity || false,
        },
      };
    }),
  };
};
