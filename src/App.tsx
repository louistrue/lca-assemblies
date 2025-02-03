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
} from "@mui/material";
import UploadIcon from "@mui/icons-material/Upload";
import DownloadIcon from "@mui/icons-material/Download";
import AssemblyForm from "./components/AssemblyForm";
import {
  Assembly,
  calculateEmissions,
  updateAssemblyWithKbobData,
} from "./types/Assembly";
import { fetchKBOBMaterials, KbobMaterial } from "./services/kbobApi";
import "./App.css";

type SortOption = "name" | "category" | "emissions" | "width" | "eBKP";

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

  const handleDownloadAssemblies = () => {
    const assembliesWithEmissions = assemblies.map((assembly) => {
      // Get clean layers
      const cleanLayers = assembly.layers.map((layer) => layer);

      return {
        id: assembly.id,
        name: assembly.name,
        eBKPClassification: assembly.eBKPClassification,
        category: assembly.category,
        width: assembly.width,
        emissions: calculateEmissions(assembly),
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
        const importedAssemblies = JSON.parse(content) as Assembly[];

        // Validate imported assemblies
        if (!Array.isArray(importedAssemblies)) {
          throw new Error("Invalid format: Expected an array of assemblies");
        }

        // Validate each assembly has required properties
        importedAssemblies.forEach((assembly, index) => {
          if (
            !assembly.id ||
            !assembly.name ||
            !assembly.layers ||
            !Array.isArray(assembly.layers)
          ) {
            throw new Error(
              `Invalid assembly at index ${index}: Missing required properties`
            );
          }

          // Ensure each layer has required properties
          assembly.layers.forEach((layer, layerIndex) => {
            if (!layer.material || typeof layer.fraction !== "number") {
              throw new Error(
                `Invalid layer at index ${layerIndex} in assembly ${assembly.name}`
              );
            }
          });
        });

        // Update assemblies with KBOB data
        const updatedAssemblies = await Promise.all(
          importedAssemblies.map((assembly) =>
            updateAssemblyWithKbobData(assembly, materials)
          )
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
        case "eBKP":
          return (
            multiplier *
            a.eBKPClassification.localeCompare(b.eBKPClassification)
          );
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
              <FormControl size="small" sx={{ minWidth: 120 }}>
                <InputLabel>Sort by</InputLabel>
                <Select
                  value={sortBy}
                  label="Sort by"
                  onChange={handleSortChange}
                >
                  <MenuItem value="name">Name</MenuItem>
                  <MenuItem value="category">Category</MenuItem>
                  <MenuItem value="emissions">Emissions</MenuItem>
                  <MenuItem value="width">Width</MenuItem>
                  <MenuItem value="eBKP">eBKP</MenuItem>
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
                <Typography color="textSecondary" gutterBottom>
                  {assembly.category} - {assembly.eBKPClassification}
                </Typography>
                <Typography color="textSecondary" gutterBottom>
                  Total Width: {(assembly.width * 1000).toFixed(0)} mm
                </Typography>
                <Divider sx={{ my: 1 }} />
                <Typography variant="subtitle1" color="primary" gutterBottom>
                  Emissions: {calculateEmissions(assembly).toFixed(2)} kg CO₂
                  eq/m²
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
                        }}
                      >
                        <span>{layer.material}</span>
                        {layer.materialData?.kbobName &&
                          layer.materialData.kbobName !== layer.material && (
                            <Typography variant="caption" color="textSecondary">
                              → {layer.materialData.kbobName}
                            </Typography>
                          )}
                        <span>
                          ({(layer.fraction * assembly.width * 1000).toFixed(0)}{" "}
                          mm)
                        </span>
                      </span>
                      <span>
                        {layer.materialData?.gwp != null &&
                        layer.materialData?.density != null
                          ? `${(
                              layer.materialData.gwp *
                              layer.materialData.density *
                              layer.fraction *
                              assembly.width
                            ).toFixed(2)} kg CO₂ eq/m²`
                          : "N/A"}
                      </span>
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
