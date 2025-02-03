import React from "react";
import { Box, Typography, TextField, Autocomplete } from "@mui/material";
import { KbobMaterial } from "../services/kbobApi";

interface RebarSelectorProps {
  showRebar: boolean;
  selectedMaterial: KbobMaterial | null;
  rebarMaterials: KbobMaterial[];
  selectedRebarMaterial: KbobMaterial | null;
  rebarAmount: string;
  loading: boolean;
  onShowRebarChange: (show: boolean) => void;
  onRebarMaterialChange: (material: KbobMaterial | null) => void;
  onRebarAmountChange: (amount: string) => void;
  onAdd: () => void;
  isEditing: boolean;
}

const RebarSelector: React.FC<RebarSelectorProps> = ({
  showRebar,
  selectedMaterial,
  rebarMaterials,
  selectedRebarMaterial,
  rebarAmount,
  loading,
  onShowRebarChange,
  onRebarMaterialChange,
  onRebarAmountChange,
}) => {
  if (!selectedMaterial?.nameDE.toLowerCase().includes("beton")) {
    return null;
  }

  return (
    <>
      <Box
        sx={{
          px: 2,
          py: 1,
          bgcolor: showRebar ? "#e3f2fd" : "transparent",
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
          onClick={() => onShowRebarChange(!showRebar)}
        >
          <input
            type="checkbox"
            id="rebar-checkbox"
            checked={showRebar}
            onChange={(e) => onShowRebarChange(e.target.checked)}
          />
          Add reinforcement steel
        </Typography>
      </Box>

      {showRebar && (
        <Box
          sx={{
            display: "flex",
            gap: 2,
            alignItems: "flex-start",
            px: 2,
            py: 1,
            bgcolor: "#e3f2fd",
            borderRadius: 1,
            mt: 1,
          }}
        >
          <Autocomplete
            size="small"
            sx={{ flex: 1 }}
            options={rebarMaterials}
            loading={loading}
            value={selectedRebarMaterial}
            onChange={(_, value) => onRebarMaterialChange(value)}
            getOptionLabel={(option) => option.nameDE}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Select reinforcement steel"
                helperText="Choose steel material for reinforcement"
                size="small"
              />
            )}
          />
          {selectedRebarMaterial && (
            <TextField
              label="kg/m³"
              type="number"
              value={rebarAmount}
              onChange={(e) => onRebarAmountChange(e.target.value)}
              inputProps={{ min: "0", step: "1" }}
              sx={{ width: "120px" }}
              size="small"
            />
          )}
        </Box>
      )}
    </>
  );
};

export default RebarSelector;
