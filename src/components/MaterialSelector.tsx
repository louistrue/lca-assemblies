import React from "react";
import {
  Box,
  Typography,
  TextField,
  Autocomplete,
  CircularProgress,
  Slider,
  Button,
  FormControlLabel,
  Switch,
} from "@mui/material";
import SaveIcon from "@mui/icons-material/Save";
import CancelIcon from "@mui/icons-material/Cancel";
import { KbobMaterial } from "../services/kbobApi";

interface MaterialSelectorProps {
  materials: KbobMaterial[];
  loading: boolean;
  error: string | null;
  selectedMaterial: KbobMaterial | null;
  density: number | null;
  thickness: string;
  isEditing: boolean;
  onMaterialChange: (material: KbobMaterial | null) => void;
  onDensityChange: (density: number) => void;
  onThicknessChange: (thickness: string) => void;
  onSave: () => void;
  onCancel: () => void;
  onAdd: () => void;
  eBKPClassification: string;
  onEBKPClassificationChange: (classification: string) => void;
}

const MaterialSelector: React.FC<MaterialSelectorProps> = ({
  materials,
  loading,
  error,
  selectedMaterial,
  density,
  thickness,
  isEditing,
  onMaterialChange,
  onDensityChange,
  onThicknessChange,
  onSave,
  onCancel,
  onAdd,
  eBKPClassification,
  onEBKPClassificationChange,
}) => {
  const [isEmptyLayer, setIsEmptyLayer] = React.useState(false);

  // Initialize empty layer state based on material
  React.useEffect(() => {
    setIsEmptyLayer(!selectedMaterial);
  }, [selectedMaterial]);

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mb: 2 }}>
      {isEditing && (
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            px: 2,
            py: 1,
            bgcolor: "#fff3e0",
            borderRadius: 1,
          }}
        >
          <Typography
            variant="subtitle2"
            color="primary"
            sx={{ fontWeight: "bold" }}
          >
            Editing Layer: {selectedMaterial?.nameDE || "Empty Layer"}
          </Typography>
          <Button
            size="small"
            onClick={onCancel}
            sx={{ textTransform: "none" }}
          >
            Switch to Add Material
          </Button>
        </Box>
      )}

      <Box sx={{ px: 2 }}>
        <FormControlLabel
          control={
            <Switch
              checked={isEmptyLayer}
              onChange={(e) => {
                setIsEmptyLayer(e.target.checked);
                if (e.target.checked) {
                  onMaterialChange(null);
                  onDensityChange(0);
                }
              }}
            />
          }
          label="Empty Layer (for linear elements only)"
        />
      </Box>

      <Box sx={{ display: "flex", gap: 2, px: 2 }}>
        {!isEmptyLayer && (
          <Autocomplete
            size="small"
            sx={{ flex: 1 }}
            options={materials}
            loading={loading}
            value={selectedMaterial}
            onChange={(_, value) => onMaterialChange(value)}
            getOptionLabel={(option) =>
              `${option.nameDE} (${option.density} kg/m³)`
            }
            isOptionEqualToValue={(option, value) => option.id === value.id}
            renderOption={(props, option) => (
              <li {...props} key={option.id}>
                {option.nameDE} ({option.density} kg/m³)
              </li>
            )}
            renderInput={(params) => (
              <TextField
                {...params}
                label={isEditing ? "Edit Material" : "Add Material"}
                error={!!error}
                helperText={error}
                size="small"
                InputProps={{
                  ...params.InputProps,
                  endAdornment: (
                    <>
                      {loading && (
                        <CircularProgress color="inherit" size={20} />
                      )}
                      {params.InputProps.endAdornment}
                    </>
                  ),
                }}
              />
            )}
          />
        )}
        <TextField
          label="Thickness (mm)"
          type="number"
          inputProps={{ step: "1", min: "1" }}
          value={thickness}
          onChange={(e) => onThicknessChange(e.target.value)}
          sx={{ width: "150px" }}
          size="small"
        />
      </Box>

      {selectedMaterial && !isEmptyLayer && (
        <Box sx={{ px: 2 }}>
          <Typography component="div" gutterBottom>
            Density: {density?.toFixed(0)} kg/m³
            {selectedMaterial.densityMin && selectedMaterial.densityMax && (
              <Typography
                component="span"
                variant="caption"
                color="textSecondary"
              >
                {" "}
                (range: {selectedMaterial.densityMin}-
                {selectedMaterial.densityMax} kg/m³)
              </Typography>
            )}
          </Typography>
          {selectedMaterial.densityMin && selectedMaterial.densityMax ? (
            <Slider
              value={density || selectedMaterial.density}
              onChange={(_, value) => onDensityChange(value as number)}
              min={selectedMaterial.densityMin}
              max={selectedMaterial.densityMax}
              step={1}
              valueLabelDisplay="auto"
              valueLabelFormat={(value) => `${value} kg/m³`}
            />
          ) : (
            <Typography variant="caption" component="div" color="textSecondary">
              This material has a fixed density.
            </Typography>
          )}

          <TextField
            fullWidth
            label="eBKP Classification"
            value={eBKPClassification}
            onChange={(e) => onEBKPClassificationChange(e.target.value)}
            margin="normal"
            size="small"
            placeholder="e.g., C 4.1"
          />
        </Box>
      )}

      {isEditing && (
        <Box sx={{ display: "flex", gap: 1, px: 2, mt: 1 }}>
          <Button
            onClick={onSave}
            startIcon={<SaveIcon />}
            variant="contained"
            size="small"
          >
            Save
          </Button>
          <Button
            onClick={onCancel}
            startIcon={<CancelIcon />}
            color="error"
            variant="outlined"
            size="small"
          >
            Cancel
          </Button>
        </Box>
      )}

      {!isEditing && (thickness !== "" || isEmptyLayer) && (
        <Box sx={{ px: 2 }}>
          <Button
            onClick={onAdd}
            variant="contained"
            size="small"
            fullWidth
            sx={{
              height: "40px",
              bgcolor: "#1976d2",
              "&:hover": {
                bgcolor: "#1565c0",
              },
            }}
          >
            Add Layer
          </Button>
        </Box>
      )}
    </Box>
  );
};

export default MaterialSelector;
