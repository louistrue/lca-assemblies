import React from "react";
import { Box, Typography, IconButton } from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";
import { Layer } from "../types/Assembly";

interface SectionViewProps {
  layers: Layer[];
  totalThicknessMm: number;
  editingLayerIndex: number | null;
  onEditLayer: (index: number) => void;
  onRemoveLayer: (index: number) => void;
  onMoveLayer: (index: number, direction: "up" | "down") => void;
}

const SectionView: React.FC<SectionViewProps> = ({
  layers,
  totalThicknessMm,
  editingLayerIndex,
  onEditLayer,
  onRemoveLayer,
  onMoveLayer,
}) => {
  return (
    <Box
      sx={{
        border: "1px solid #ccc",
        borderRadius: 1,
        p: 1,
        mb: 2,
        minHeight: "200px",
        display: "flex",
        flexDirection: "column",
        gap: 1,
      }}
    >
      <Typography variant="subtitle2" component="div" gutterBottom>
        Section View
      </Typography>
      <Box sx={{ flex: 1, display: "flex" }}>
        {/* Scale bar */}
        <Box
          sx={{
            width: "40px",
            borderRight: "1px solid #ccc",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            pr: 1,
            fontSize: "0.75rem",
            color: "text.secondary",
          }}
        >
          <Typography variant="caption" component="div">
            0 mm
          </Typography>
          <Typography variant="caption" component="div">
            {totalThicknessMm.toFixed(0)} mm
          </Typography>
        </Box>
        {/* Layers */}
        <Box sx={{ flex: 1, display: "flex", flexDirection: "column" }}>
          {layers.map((layer, index) => {
            const heightPercent = (layer.fraction / totalThicknessMm) * 100;
            const isEditing = index === editingLayerIndex;

            return (
              <Box
                key={index}
                sx={{
                  height: `${heightPercent}%`,
                  bgcolor: isEditing
                    ? "#fff3e0"
                    : layer.rebar
                    ? "#e3f2fd"
                    : "#f5f5f5",
                  border: isEditing ? "2px solid #fb8c00" : "1px solid #e0e0e0",
                  p: 1,
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "center",
                  position: "relative",
                  minHeight: layer.fraction < 10 ? "20px" : "40px",
                  "&:hover": {
                    bgcolor: isEditing
                      ? "#ffe0b2"
                      : layer.rebar
                      ? "#bbdefb"
                      : "#eeeeee",
                    "& .layer-controls": {
                      opacity: 1,
                    },
                  },
                }}
              >
                {/* Layer content */}
                <Box sx={{ flex: 1 }}>
                  <Typography
                    variant="caption"
                    component="div"
                    sx={{
                      fontWeight: isEditing ? "bold" : "normal",
                      fontSize: layer.fraction < 10 ? "0.65rem" : "0.75rem",
                      color: isEditing ? "#e65100" : "inherit",
                    }}
                  >
                    {layer.material}
                    {layer.materialData?.kbobName &&
                      layer.materialData.kbobName !== layer.material && (
                        <span style={{ color: "text.secondary" }}>
                          {" "}
                          → {layer.materialData.kbobName}
                        </span>
                      )}
                    {isEditing && " (Editing)"}
                  </Typography>
                  <Typography
                    variant="caption"
                    component="div"
                    color="text.secondary"
                    sx={{
                      fontSize: layer.fraction < 10 ? "0.65rem" : "0.75rem",
                      display: "block",
                    }}
                  >
                    {layer.fraction.toFixed(0)} mm
                    {layer.materialData &&
                      ` - ${layer.materialData.density} kg/m³`}
                  </Typography>
                  {layer.rebar && (
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 0.5,
                        mt: 0.5,
                      }}
                    >
                      <Box
                        sx={{
                          width: "12px",
                          height: "12px",
                          borderRadius: "50%",
                          bgcolor: "#1976d2",
                        }}
                      />
                      <Typography variant="caption" component="div">
                        {layer.rebar.kgPerCubicMeter} kg/m³
                      </Typography>
                    </Box>
                  )}
                </Box>

                {/* Layer controls */}
                <Box
                  className="layer-controls"
                  sx={{
                    position: "absolute",
                    right: 8,
                    top: "50%",
                    transform: "translateY(-50%)",
                    display: "flex",
                    gap: 0.5,
                    opacity: 0,
                    transition: "opacity 0.2s",
                    bgcolor: "rgba(255, 255, 255, 0.9)",
                    borderRadius: 1,
                    padding: "2px",
                  }}
                >
                  <IconButton
                    size="small"
                    onClick={() => onMoveLayer(index, "up")}
                    disabled={index === 0}
                    sx={{ padding: "2px" }}
                  >
                    <ArrowUpwardIcon fontSize="small" />
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={() => onMoveLayer(index, "down")}
                    disabled={index === layers.length - 1}
                    sx={{ padding: "2px" }}
                  >
                    <ArrowDownwardIcon fontSize="small" />
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={() => onEditLayer(index)}
                    sx={{ padding: "2px" }}
                  >
                    <EditIcon fontSize="small" />
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={() => onRemoveLayer(index)}
                    sx={{ padding: "2px", color: "error.main" }}
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Box>
              </Box>
            );
          })}
        </Box>
      </Box>
    </Box>
  );
};

export default SectionView;
