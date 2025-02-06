import { useState, useRef, useEffect, useMemo } from "react";
import {
  Container,
  Typography,
  Box,
  Button,
  Card,
  CardContent,
  CardActions,
  Divider,
  Input,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  ToggleButtonGroup,
  ToggleButton,
} from "@mui/material";
import UploadIcon from "@mui/icons-material/Upload";
import DownloadIcon from "@mui/icons-material/Download";
import AssemblyForm from "./components/AssemblyForm";
import {
  Assembly,
  calculateEmissions,
  updateAssemblyWithKbobData,
  LegacyAssembly,
} from "./types/Assembly";
import {
  fetchKBOBMaterials,
  KbobMaterial,
  EBKP_AMORTIZATION,
} from "./services/kbobApi";
import "./App.css";

type SortOption = "name" | "category" | "emissions" | "width" | "id";
type ImpactMetric = "gwp" | "penr" | "ubp";
type DisplayMode = "absolute" | "yearly";

function App() {
  const [assemblies, setAssemblies] = useState<Assembly[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingAssembly, setEditingAssembly] = useState<
    Assembly | undefined
  >();
  const [materials, setMaterials] = useState<KbobMaterial[]>([]);
  const [loading, setLoading] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>("name");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const editFormRef = useRef<HTMLDivElement>(null);
  const [duplicateDialogOpen, setDuplicateDialogOpen] = useState(false);
  const [duplicateAssemblyData, setDuplicateAssemblyData] = useState<{
    original: Assembly | null;
    newName: string;
    newId: string;
  }>({
    original: null,
    newName: "",
    newId: "",
  });
  const [impactMetric, setImpactMetric] = useState<ImpactMetric>("gwp");
  const [displayMode, setDisplayMode] = useState<DisplayMode>("absolute");

  useEffect(() => {
    const loadMaterials = async () => {
      try {
        const fetchedMaterials = await fetchKBOBMaterials();
        setMaterials(fetchedMaterials);
      } catch (error) {
        console.error("Error loading KBOB materials:", error);
      }
    };
    loadMaterials();
  }, []);

  const handleSaveAssembly = (assembly: Assembly) => {
    if (editingAssembly) {
      setAssemblies(
        assemblies.map((a) => (a.id === assembly.id ? assembly : a))
      );
    } else {
      setAssemblies([...assemblies, assembly]);
    }
    setShowForm(false);
    setEditingAssembly(undefined);
  };

  const handleEditAssembly = (assembly: Assembly) => {
    setEditingAssembly(assembly);
    setShowForm(true);
    setTimeout(() => {
      editFormRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 100);
  };

  const handleDeleteAssembly = (id: string) => {
    setAssemblies(assemblies.filter((a) => a.id !== id));
  };

  const handleDuplicateDialogOpen = (assembly: Assembly) => {
    setDuplicateAssemblyData({
      original: assembly,
      newName: `${assembly.name} (Copy)`,
      newId: `${assembly.id}-copy`,
    });
    setDuplicateDialogOpen(true);
  };

  const handleDuplicateDialogClose = () => {
    setDuplicateDialogOpen(false);
    setDuplicateAssemblyData({
      original: null,
      newName: "",
      newId: "",
    });
  };

  const handleDuplicateAssembly = () => {
    if (
      !duplicateAssemblyData.original ||
      !duplicateAssemblyData.newName.trim() ||
      !duplicateAssemblyData.newId.trim()
    ) {
      return;
    }

    // Check if ID already exists
    if (assemblies.some((a) => a.id === duplicateAssemblyData.newId.trim())) {
      alert(
        "An assembly with this ID already exists. Please choose a different ID."
      );
      return;
    }

    // Create a deep copy of the assembly with the new ID and name
    const duplicatedAssembly: Assembly = {
      ...duplicateAssemblyData.original,
      id: duplicateAssemblyData.newId.trim(),
      name: duplicateAssemblyData.newName.trim(),
    };

    setAssemblies([...assemblies, duplicatedAssembly]);
    handleDuplicateDialogClose();
  };

  const handleDownloadAssemblies = () => {
    const assembliesWithEmissions = assemblies.map((assembly) => {
      // Calculate total indicators and per year values
      const totals = assembly.layers.reduce(
        (acc, layer) => {
          // Add base layer values
          if (layer.materialData) {
            acc.gwp += layer.materialData.gwp;
            acc.ubp += layer.materialData.UBP;
            acc.penre += layer.materialData.PENRE;

            const amortizationYears = layer.materialData.eBKPClassification
              ? EBKP_AMORTIZATION[layer.materialData.eBKPClassification] || 40
              : 40;

            acc.gwpYear += layer.materialData.gwp / amortizationYears;
            acc.ubpYear += layer.materialData.UBP / amortizationYears;
            acc.penreYear += layer.materialData.PENRE / amortizationYears;
          }

          // Add rebar values if present
          if (layer.rebar?.materialData) {
            acc.gwp += layer.rebar.materialData.gwp;
            acc.ubp += layer.rebar.materialData.UBP;
            acc.penre += layer.rebar.materialData.PENRE;

            const amortizationYears = layer.materialData?.eBKPClassification
              ? EBKP_AMORTIZATION[layer.materialData.eBKPClassification] || 40
              : 40;

            acc.gwpYear += layer.rebar.materialData.gwp / amortizationYears;
            acc.ubpYear += layer.rebar.materialData.UBP / amortizationYears;
            acc.penreYear += layer.rebar.materialData.PENRE / amortizationYears;
          }

          // Add linear elements values if present
          if (layer.linearElements?.materialData) {
            acc.gwp += layer.linearElements.materialData.gwp;
            acc.ubp += layer.linearElements.materialData.UBP;
            acc.penre += layer.linearElements.materialData.PENRE;

            const amortizationYears = layer.materialData?.eBKPClassification
              ? EBKP_AMORTIZATION[layer.materialData.eBKPClassification] || 40
              : 40;

            acc.gwpYear += layer.linearElements.materialData.gwp / amortizationYears;
            acc.ubpYear += layer.linearElements.materialData.UBP / amortizationYears;
            acc.penreYear += layer.linearElements.materialData.PENRE / amortizationYears;
          }

          return acc;
        },
        { gwp: 0, ubp: 0, penre: 0, gwpYear: 0, ubpYear: 0, penreYear: 0 }
      );

      // Convert layers to match the required format
      const cleanLayers = assembly.layers.map((layer) => {
        const layerData = {
          material: layer.material,
          fraction: layer.thickness_mm / (assembly.width * 1000),
          materialData: layer.materialData
            ? {
                kbobName: layer.materialData.kbobName,
                unit: layer.materialData.unit,
                density: layer.materialData.density,
                userDefinedDensity: layer.materialData.userDefinedDensity,
                eBKPClassification: layer.materialData.eBKPClassification,
                amortization_years: layer.materialData.amortization_years,
                layer_thickness: layer.thickness_mm / 1000,
                kg_per_m2: layer.materialData.kg_per_m2,
                gwp: layer.materialData.gwp,
                UBP: layer.materialData.UBP,
                PENRE: layer.materialData.PENRE,
                gwp_indicator: layer.materialData.gwp_indicator,
                UBP_indicator: layer.materialData.UBP_indicator,
                PENRE_indicator: layer.materialData.PENRE_indicator,
                gwp_per_year: layer.materialData.gwp_per_year,
                UBP_per_year: layer.materialData.UBP_per_year,
                PENRE_per_year: layer.materialData.PENRE_per_year,
              }
            : undefined,
          rebar: layer.rebar
            ? {
                material: layer.rebar.material,
                kgPerCubicMeter: layer.rebar.kgPerCubicMeter,
                materialData: layer.rebar.materialData
                  ? {
                      kbobName: layer.rebar.materialData.kbobName,
                      unit: layer.rebar.materialData.unit,
                      density: layer.rebar.materialData.density,
                      userDefinedDensity:
                        layer.rebar.materialData.userDefinedDensity,
                      eBKPClassification:
                        layer.rebar.materialData.eBKPClassification,
                      amortization_years:
                        layer.rebar.materialData.amortization_years,
                      layer_thickness:
                        layer.rebar.materialData.thickness_mm / 1000,
                      kg_per_m2: layer.rebar.materialData.kg_per_m2,
                      gwp: layer.rebar.materialData.gwp,
                      UBP: layer.rebar.materialData.UBP,
                      PENRE: layer.rebar.materialData.PENRE,
                      gwp_indicator: layer.rebar.materialData.gwp_indicator,
                      UBP_indicator: layer.rebar.materialData.UBP_indicator,
                      PENRE_indicator: layer.rebar.materialData.PENRE_indicator,
                      gwp_per_year: layer.rebar.materialData.gwp_per_year,
                      UBP_per_year: layer.rebar.materialData.UBP_per_year,
                      PENRE_per_year: layer.rebar.materialData.PENRE_per_year,
                    }
                  : undefined,
              }
            : undefined,
          linearElements: layer.linearElements
            ? {
                material: layer.linearElements.material,
                width: layer.linearElements.width,
                height: layer.linearElements.height,
                spacing: layer.linearElements.spacing,
                kg_per_m2: layer.linearElements.kg_per_m2,
                materialData: layer.linearElements.materialData
                  ? {
                      kbobName: layer.linearElements.materialData.kbobName,
                      unit: layer.linearElements.materialData.unit,
                      density: layer.linearElements.materialData.density,
                      userDefinedDensity:
                        layer.linearElements.materialData.userDefinedDensity,
                      eBKPClassification:
                        layer.linearElements.materialData.eBKPClassification,
                      amortization_years:
                        layer.linearElements.materialData.amortization_years,
                      layer_thickness:
                        layer.linearElements.materialData.thickness_mm / 1000,
                      kg_per_m2: layer.linearElements.materialData.kg_per_m2,
                      gwp: layer.linearElements.materialData.gwp,
                      UBP: layer.linearElements.materialData.UBP,
                      PENRE: layer.linearElements.materialData.PENRE,
                      gwp_indicator:
                        layer.linearElements.materialData.gwp_indicator,
                      UBP_indicator:
                        layer.linearElements.materialData.UBP_indicator,
                      PENRE_indicator:
                        layer.linearElements.materialData.PENRE_indicator,
                      gwp_per_year:
                        layer.linearElements.materialData.gwp_per_year,
                      UBP_per_year:
                        layer.linearElements.materialData.UBP_per_year,
                      PENRE_per_year:
                        layer.linearElements.materialData.PENRE_per_year,
                    }
                  : undefined,
              }
            : undefined,
        };

        return layerData;
      });

      return {
        id: assembly.id,
        name: assembly.name,
        category: assembly.category,
        width: assembly.width,
        total_gwp: totals.gwp,
        total_ubp: totals.ubp,
        total_penre: totals.penre,
        total_gwp_per_year: totals.gwpYear,
        total_ubp_per_year: totals.ubpYear,
        total_penre_per_year: totals.penreYear,
        layers: cleanLayers,
      };
    });

    const jsonString = JSON.stringify(assembliesWithEmissions, null, 2);
    const blob = new Blob([jsonString], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "construction-assemblies.json";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setLoading(true);
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const content = e.target?.result as string;
        const importedAssemblies = JSON.parse(content) as LegacyAssembly[];

        // Validate imported assemblies
        if (!Array.isArray(importedAssemblies)) {
          throw new Error("Invalid format: Expected an array of assemblies");
        }

        // Clean and validate each assembly
        const cleanedAssemblies = importedAssemblies.map((assembly) => {
          // Keep only essential assembly data
          const cleanAssembly = {
            id: assembly.id,
            name: assembly.name,
            category: assembly.category,
            width: assembly.width,
            layers: assembly.layers.map((layer) => {
              // Calculate thickness from layer_thickness or fraction
              let thickness_mm = 0;
              if (layer.materialData?.layer_thickness) {
                thickness_mm = layer.materialData.layer_thickness * 1000; // Convert m to mm
              } else if (layer.fraction) {
                thickness_mm = assembly.width * 1000 * layer.fraction;
              }

              console.log("Layer thickness calculation:", {
                material: layer.material,
                layer_thickness: layer.materialData?.layer_thickness,
                fraction: layer.fraction,
                calculated_thickness_mm: thickness_mm,
              });

              // Keep only essential layer data
              const cleanLayer = {
                material: layer.material,
                thickness_mm,
                materialData: layer.materialData
                  ? {
                      kbobName: layer.materialData.kbobName,
                      unit: "kg",
                      density: null,
                      userDefinedDensity: false,
                      eBKPClassification:
                        layer.materialData.eBKPClassification || "",
                    }
                  : undefined,
                rebar: layer.rebar
                  ? {
                      material: layer.rebar.material,
                      kgPerCubicMeter: layer.rebar.kgPerCubicMeter,
                      materialData: layer.rebar.materialData
                        ? {
                            kbobName: layer.rebar.materialData.kbobName,
                            unit: "kg",
                            density: null,
                            userDefinedDensity: false,
                            eBKPClassification:
                              layer.rebar.materialData.eBKPClassification || "",
                          }
                        : undefined,
                    }
                  : undefined,
                linearElements: layer.linearElements
                  ? {
                      material: layer.linearElements.material,
                      width: layer.linearElements.width,
                      height: layer.linearElements.height,
                      spacing: layer.linearElements.spacing,
                      kg_per_m2: 0, // Will be recalculated
                      materialData: layer.linearElements.materialData
                        ? {
                            kbobName:
                              layer.linearElements.materialData.kbobName,
                            unit: "kg",
                            density: null,
                            userDefinedDensity: false,
                            eBKPClassification:
                              layer.linearElements.materialData
                                .eBKPClassification || "",
                          }
                        : undefined,
                    }
                  : undefined,
              };

              if (!cleanLayer.material) {
                throw new Error(
                  `Invalid layer in assembly ${assembly.name}: Missing material`
                );
              }

              return cleanLayer;
            }),
          };

          if (
            !cleanAssembly.id ||
            !cleanAssembly.name ||
            !cleanAssembly.category
          ) {
            throw new Error("Invalid assembly: Missing required properties");
          }

          return cleanAssembly;
        });

        // Update assemblies with fresh KBOB data and calculations
        const updatedAssemblies = await Promise.all(
          cleanedAssemblies.map(async (assembly) => {
            // Convert to LegacyAssembly format with minimal data
            const legacyAssembly: LegacyAssembly = {
              ...assembly,
              total_gwp: 0,
              total_ubp: 0,
              total_penre: 0,
              total_gwp_per_year: 0,
              total_ubp_per_year: 0,
              total_penre_per_year: 0,
              layers: assembly.layers.map((layer) => ({
                ...layer,
                materialData: layer.materialData
                  ? {
                      ...layer.materialData,
                      layer_thickness: layer.thickness_mm / 1000, // Convert mm to m
                      kg_per_m2: 0, // Will be recalculated
                      gwp: 0,
                      UBP: 0,
                      PENRE: 0,
                      gwp_per_year: 0,
                      UBP_per_year: 0,
                      PENRE_per_year: 0,
                      gwp_indicator: 0,
                      UBP_indicator: 0,
                      PENRE_indicator: 0,
                      amortization_years: 40,
                    }
                  : undefined,
              })),
            };
            return updateAssemblyWithKbobData(legacyAssembly, materials);
          })
        );

        // Add imported assemblies to existing ones
        setAssemblies([...assemblies, ...updatedAssemblies]);
      } catch (error) {
        console.error("Error importing assemblies:", error);
        alert("Error importing assemblies. Please check the file format.");
      } finally {
        setLoading(false);
      }
    };
    reader.readAsText(file);

    // Reset file input
    event.target.value = "";
  };

  const sortedAssemblies = useMemo(() => {
    return [...assemblies].sort((a, b) => {
      const multiplier = sortDirection === "asc" ? 1 : -1;

      switch (sortBy) {
        case "name":
          return multiplier * a.name.localeCompare(b.name);
        case "category":
          return multiplier * a.category.localeCompare(b.category);
        case "emissions":
          return multiplier * (calculateEmissions(a) - calculateEmissions(b));
        case "width":
          return multiplier * (a.width - b.width);
        case "id":
          return multiplier * a.id.localeCompare(b.id);
        default:
          return 0;
      }
    });
  }, [assemblies, sortBy, sortDirection]);

  const handleSortChange = (event: SelectChangeEvent<SortOption>) => {
    setSortBy(event.target.value as SortOption);
  };

  const toggleSortDirection = () => {
    setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
  };

  const handleCancelAssembly = () => {
    setShowForm(false);
    setEditingAssembly(undefined);
  };

  const getMetricValue = (
    material: {
      gwp: number | null;
      penr: number | null;
      ubp: number | null;
    },
    eBKPClassification?: string
  ) => {
    const value = (() => {
      switch (impactMetric) {
        case "penr":
          return material.penr;
        case "ubp":
          return material.ubp;
        default:
          return material.gwp;
      }
    })();

    if (displayMode === "yearly" && eBKPClassification) {
      const amortizationYears = EBKP_AMORTIZATION[eBKPClassification] || 40;
      return value ? value / amortizationYears : 0;
    }

    return value || 0;
  };

  const getMetricUnit = (metric: ImpactMetric, isYearly: boolean = false) => {
    const baseUnit = (() => {
      switch (metric) {
        case "penr":
          return "kWh/m²";
        case "ubp":
          return "UBP/m²";
        default:
          return "kg CO₂ eq/m²";
      }
    })();

    return isYearly ? `${baseUnit}*a` : baseUnit;
  };

  return (
    <Container
      maxWidth={false}
      disableGutters
      sx={{
        width: "100vw",
        minHeight: "100vh",
        p: 4,
        boxSizing: "border-box",
      }}
    >
      <Typography variant="h3" component="h1" gutterBottom>
        Construction Assemblies Manager
      </Typography>

      <Box
        sx={{
          mb: 4,
          display: "flex",
          gap: 2,
          alignItems: "center",
          width: "100%",
          flexWrap: "wrap",
        }}
      >
        <Button
          variant="contained"
          onClick={() => {
            setShowForm(true);
            setEditingAssembly(undefined);
          }}
        >
          Add Assembly
        </Button>

        <Button
          variant="outlined"
          onClick={handleImportClick}
          startIcon={loading ? <CircularProgress size={20} /> : <UploadIcon />}
          disabled={loading}
        >
          {loading ? "Importing..." : "Import Assemblies"}
        </Button>

        {assemblies.length > 0 && (
          <>
            <Button
              variant="outlined"
              onClick={handleDownloadAssemblies}
              startIcon={<DownloadIcon />}
            >
              Download Assemblies
            </Button>

            <Box
              sx={{ display: "flex", gap: 1, alignItems: "center", ml: "auto" }}
            >
              <ToggleButtonGroup
                value={displayMode}
                exclusive
                onChange={(e, value) => value && setDisplayMode(value)}
                size="small"
              >
                <ToggleButton value="absolute">Absolute</ToggleButton>
                <ToggleButton value="yearly">Per Year</ToggleButton>
              </ToggleButtonGroup>
              <ToggleButtonGroup
                value={impactMetric}
                exclusive
                onChange={(e, value) => value && setImpactMetric(value)}
                size="small"
              >
                <ToggleButton value="gwp">GWP</ToggleButton>
                <ToggleButton value="penr">PENRE</ToggleButton>
                <ToggleButton value="ubp">UBP</ToggleButton>
              </ToggleButtonGroup>
              <FormControl size="small" sx={{ minWidth: 120 }}>
                <InputLabel>Sort by</InputLabel>
                <Select
                  value={sortBy}
                  label="Sort by"
                  onChange={handleSortChange}
                >
                  <MenuItem value="id">ID</MenuItem>
                  <MenuItem value="name">Name</MenuItem>
                  <MenuItem value="category">Category</MenuItem>
                  <MenuItem value="emissions">Impact</MenuItem>
                  <MenuItem value="width">Width</MenuItem>
                </Select>
              </FormControl>
              <Button
                variant="outlined"
                size="small"
                onClick={toggleSortDirection}
                sx={{ minWidth: 40, px: 1 }}
              >
                {sortDirection === "asc" ? "↑" : "↓"}
              </Button>
            </Box>
          </>
        )}

        <Input
          type="file"
          inputRef={fileInputRef}
          sx={{ display: "none" }}
          onChange={handleFileUpload}
          inputProps={{
            accept: "application/json",
          }}
        />
      </Box>

      {showForm && (
        <Box ref={editFormRef} sx={{ mb: 4, scrollMargin: "1rem" }}>
          <AssemblyForm
            onSave={handleSaveAssembly}
            onCancel={handleCancelAssembly}
            assembly={editingAssembly}
          />
        </Box>
      )}

      <Dialog open={duplicateDialogOpen} onClose={handleDuplicateDialogClose}>
        <DialogTitle>Duplicate Assembly</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="New Assembly Name"
            fullWidth
            variant="outlined"
            value={duplicateAssemblyData.newName}
            onChange={(e) =>
              setDuplicateAssemblyData((prev) => ({
                ...prev,
                newName: e.target.value,
              }))
            }
          />
          <TextField
            margin="dense"
            label="New Assembly ID"
            fullWidth
            variant="outlined"
            value={duplicateAssemblyData.newId}
            onChange={(e) =>
              setDuplicateAssemblyData((prev) => ({
                ...prev,
                newId: e.target.value,
              }))
            }
            helperText="Enter a unique identifier"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDuplicateDialogClose}>Cancel</Button>
          <Button onClick={handleDuplicateAssembly} variant="contained">
            Duplicate
          </Button>
        </DialogActions>
      </Dialog>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "repeat(12, 1fr)",
          gap: 3,
          width: "100%",
        }}
      >
        {sortedAssemblies.map((assembly) => (
          <Box
            key={assembly.id}
            sx={{ gridColumn: { xs: "span 12", sm: "span 6", md: "span 4" } }}
          >
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  {assembly.name}
                </Typography>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  gutterBottom
                  sx={{ display: "block" }}
                >
                  ID: {assembly.id}
                </Typography>
                <Typography color="textSecondary" gutterBottom>
                  {assembly.category}
                </Typography>
                <Typography color="textSecondary" gutterBottom>
                  Total Width:{" "}
                  {assembly.layers
                    .reduce((sum, layer) => sum + layer.thickness_mm, 0)
                    .toFixed(0)}{" "}
                  mm
                </Typography>
                <Divider sx={{ my: 1 }} />
                <Typography variant="subtitle1" color="primary" gutterBottom>
                  {impactMetric.toUpperCase()}:{" "}
                  {getMetricValue(
                    {
                      gwp: calculateEmissions(assembly, "gwp"),
                      penr: calculateEmissions(assembly, "penr"),
                      ubp: calculateEmissions(assembly, "ubp"),
                    },
                    assembly.layers[0]?.materialData?.eBKPClassification
                  ).toFixed(3)}{" "}
                  {getMetricUnit(impactMetric, displayMode === "yearly")}
                </Typography>
                <Typography variant="body2">
                  Layers:
                  {assembly.layers.map((layer, index) => (
                    <Box
                      key={index}
                      component="div"
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "baseline",
                        mb: 1,
                      }}
                    >
                      <span
                        style={{
                          display: "flex",
                          gap: "0.5rem",
                          alignItems: "baseline",
                          flexDirection: "column",
                        }}
                      >
                        <span
                          style={{
                            display: "flex",
                            gap: "0.5rem",
                            alignItems: "baseline",
                          }}
                        >
                          <span>{layer.material}</span>
                          {layer.materialData?.kbobName &&
                            layer.materialData.kbobName !== layer.material && (
                              <Typography
                                variant="caption"
                                color="textSecondary"
                              >
                                → {layer.materialData.kbobName}
                              </Typography>
                            )}
                        </span>
                        <Typography variant="caption" color="text.secondary">
                          {layer.thickness_mm?.toFixed(1)} mm
                          {layer.materialData?.density &&
                            ` - ${layer.materialData.density} kg/m³`}
                          {layer.materialData?.eBKPClassification && (
                            <span style={{ marginLeft: "0.5rem" }}>
                              | {layer.materialData.eBKPClassification} (
                              {EBKP_AMORTIZATION[
                                layer.materialData.eBKPClassification
                              ] || 40}{" "}
                              years)
                            </span>
                          )}
                        </Typography>
                      </span>
                      <Box
                        sx={{
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "flex-end",
                        }}
                      >
                        <span>
                          {layer.materialData
                            ? `${getMetricValue(
                                {
                                  gwp: layer.materialData.gwp,
                                  penr: layer.materialData.PENRE,
                                  ubp: layer.materialData.UBP,
                                },
                                layer.materialData.eBKPClassification
                              ).toFixed(3)} ${getMetricUnit(
                                impactMetric,
                                displayMode === "yearly"
                              )}`
                            : "N/A"}
                        </span>
                        {layer.rebar?.materialData && (
                          <Typography
                            variant="caption"
                            color="primary"
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 0.5,
                            }}
                          >
                            <Box
                              sx={{
                                width: "8px",
                                height: "8px",
                                borderRadius: "50%",
                                bgcolor: "#1976d2",
                              }}
                            />
                            {getMetricValue(
                              {
                                gwp: layer.rebar.materialData.gwp,
                                penr: layer.rebar.materialData.PENRE,
                                ubp: layer.rebar.materialData.UBP,
                              },
                              layer.materialData?.eBKPClassification
                            ).toFixed(3)}{" "}
                            {getMetricUnit(
                              impactMetric,
                              displayMode === "yearly"
                            )}{" "}
                            ({layer.rebar.kgPerCubicMeter} kg/m³)
                          </Typography>
                        )}
                        {layer.linearElements?.materialData && (
                          <Typography
                            variant="caption"
                            color="success.main"
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 0.5,
                            }}
                          >
                            <Box
                              sx={{
                                width: "8px",
                                height: "8px",
                                borderRadius: "2px",
                                bgcolor: "#66bb6a",
                                transform: "rotate(45deg)",
                              }}
                            />
                            {getMetricValue(
                              {
                                gwp: layer.linearElements.materialData.gwp,
                                penr: layer.linearElements.materialData.PENRE,
                                ubp: layer.linearElements.materialData.UBP,
                              },
                              layer.materialData?.eBKPClassification
                            ).toFixed(3)}{" "}
                            {getMetricUnit(
                              impactMetric,
                              displayMode === "yearly"
                            )}{" "}
                            ({layer.linearElements.width}×
                            {layer.linearElements.height} mm @{" "}
                            {layer.linearElements.spacing} mm)
                          </Typography>
                        )}
                      </Box>
                    </Box>
                  ))}
                </Typography>
              </CardContent>
              <CardActions>
                <Button
                  size="small"
                  onClick={() => handleEditAssembly(assembly)}
                >
                  Edit
                </Button>
                <Button
                  size="small"
                  onClick={() => handleDuplicateDialogOpen(assembly)}
                >
                  Duplicate
                </Button>
                <Button
                  size="small"
                  color="error"
                  onClick={() => handleDeleteAssembly(assembly.id)}
                >
                  Delete
                </Button>
              </CardActions>
            </Card>
          </Box>
        ))}
      </Box>
    </Container>
  );
}

export default App;
