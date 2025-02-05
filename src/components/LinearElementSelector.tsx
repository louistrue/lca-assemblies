import React from "react";
import { Box, Typography, TextField, Autocomplete } from "@mui/material";
import { KbobMaterial } from "../services/kbobApi";

interface LinearElementSelectorProps {
  showLinearElements: boolean;
  selectedMaterial: KbobMaterial | null;
  linearElementMaterials: KbobMaterial[];
  selectedLinearElementMaterial: KbobMaterial | null;
  width: string;
  height: string;
  spacing: string;
  loading: boolean;
  onShowLinearElementsChange: (show: boolean) => void;
  onLinearElementMaterialChange: (material: KbobMaterial | null) => void;
  onWidthChange: (width: string) => void;
  onHeightChange: (height: string) => void;
  onSpacingChange: (spacing: string) => void;
}

const LinearElementSelector: React.FC<LinearElementSelectorProps> = ({
  showLinearElements,
  selectedMaterial,
  linearElementMaterials,
  selectedLinearElementMaterial,
  width,
  height,
  spacing,
  loading,
  onShowLinearElementsChange,
  onLinearElementMaterialChange,
  onWidthChange,
  onHeightChange,
  onSpacingChange,
}) => {
  return (
    <>
      <Box
        sx={{
          px: 2,
          py: 1,
          bgcolor: showLinearElements ? "#e8f5e9" : "transparent",
          borderRadius: 1,
          transition: "background-color 0.2s",
        }}
      >
        <Typography
          component="div"
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1,
            cursor: "pointer",
            userSelect: "none",
          }}
          onClick={() => onShowLinearElementsChange(!showLinearElements)}
        >
          <input
            type="checkbox"
            checked={showLinearElements}
            onChange={(e) => onShowLinearElementsChange(e.target.checked)}
          />
          Add linear elements (e.g., timber studs)
        </Typography>
      </Box>

      {showLinearElements && (
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            gap: 2,
            px: 2,
            py: 1,
            bgcolor: "#e8f5e9",
            borderRadius: 1,
            mt: 1,
          }}
        >
          <Autocomplete
            size="small"
            options={linearElementMaterials}
            loading={loading}
            value={selectedLinearElementMaterial}
            onChange={(_, value) => onLinearElementMaterialChange(value)}
            getOptionLabel={(option) => option.nameDE}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Select linear element material"
                helperText="Choose material for studs/posts"
                size="small"
              />
            )}
          />

          <Box sx={{ display: "flex", gap: 2 }}>
            <TextField
              label="Width (mm)"
              type="number"
              value={width}
              onChange={(e) => onWidthChange(e.target.value)}
              inputProps={{ min: "0", step: "1" }}
              size="small"
            />
            <TextField
              label="Height (mm)"
              type="number"
              value={height}
              onChange={(e) => onHeightChange(e.target.value)}
              inputProps={{ min: "0", step: "1" }}
              size="small"
            />
            <TextField
              label="Spacing (mm)"
              type="number"
              value={spacing}
              onChange={(e) => onSpacingChange(e.target.value)}
              inputProps={{ min: "0", step: "1" }}
              size="small"
              helperText="Center-to-center"
            />
          </Box>
        </Box>
      )}
    </>
  );
};

export default LinearElementSelector;
