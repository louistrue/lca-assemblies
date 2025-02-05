import React from "react";
import { Card, CardContent, Button, Typography, Box } from "@mui/material";
import { Assembly } from "../types/Assembly";
import SectionView from "./SectionView";
import MaterialSelector from "./MaterialSelector";
import RebarSelector from "./RebarSelector";
import LinearElementSelector from "./LinearElementSelector";
import AssemblyBasicFields from "./AssemblyBasicFields";
import { useAssemblyForm } from "../hooks/useAssemblyForm";

interface AssemblyFormProps {
  onSave: (assembly: Assembly) => void;
  onCancel: () => void;
  assembly?: Assembly;
}

const AssemblyForm: React.FC<AssemblyFormProps> = ({
  onSave,
  onCancel,
  assembly,
}) => {
  const { formState, handlers } = useAssemblyForm({ assembly, onSave });

  return (
    <Card>
      <CardContent>
        <form onSubmit={handlers.handleSubmit}>
          <Typography variant="h5" component="div" gutterBottom>
            {assembly ? "Edit Assembly" : "New Assembly"}
          </Typography>

          <AssemblyBasicFields
            name={formState.name}
            id={formState.id}
            category={formState.category}
            onNameChange={handlers.setName}
            onIdChange={handlers.setId}
            onCategoryChange={handlers.setCategory}
            isNewAssembly={!assembly}
          />

          <Typography variant="h6" component="div" gutterBottom sx={{ mt: 2 }}>
            Total Width: {formState.totalThicknessMm.toFixed(1)} mm
          </Typography>

          <SectionView
            layers={formState.layers}
            totalThicknessMm={formState.totalThicknessMm}
            editingLayerIndex={formState.editingLayer}
            onEditLayer={handlers.handleEditLayer}
            onRemoveLayer={handlers.handleRemoveLayer}
            onMoveLayer={handlers.handleMoveLayer}
          />

          <MaterialSelector
            materials={formState.materials}
            loading={formState.loading}
            error={formState.error}
            selectedMaterial={formState.newMaterial}
            density={formState.newDensity}
            thickness={formState.newThickness}
            isEditing={formState.editingLayer !== null}
            onMaterialChange={handlers.setNewMaterial}
            onDensityChange={handlers.setNewDensity}
            onThicknessChange={handlers.setNewThickness}
            onSave={handlers.handleSaveLayerEdit}
            onCancel={handlers.resetForm}
            onAdd={handlers.handleAddLayer}
            eBKPClassification={formState.newEBKPClassification}
            onEBKPClassificationChange={handlers.setNewEBKPClassification}
          />

          <RebarSelector
            showRebar={formState.showRebar}
            selectedMaterial={formState.newMaterial}
            rebarMaterials={formState.rebarMaterials}
            selectedRebarMaterial={formState.newRebarMaterial}
            rebarAmount={formState.newRebarAmount}
            loading={formState.loading}
            onShowRebarChange={(show) => {
              handlers.setShowRebar(show);
              if (!show) {
                handlers.setNewRebarMaterial(null);
                handlers.setNewRebarAmount("");
              }
            }}
            onRebarMaterialChange={handlers.setNewRebarMaterial}
            onRebarAmountChange={handlers.setNewRebarAmount}
            onAdd={handlers.handleAddLayer}
            isEditing={formState.editingLayer !== null}
          />

          <LinearElementSelector
            showLinearElements={formState.showLinearElements}
            selectedMaterial={formState.newMaterial}
            linearElementMaterials={formState.linearElementMaterials}
            selectedLinearElementMaterial={formState.newLinearElementMaterial}
            width={formState.newLinearElementWidth}
            height={formState.newLinearElementHeight}
            spacing={formState.newLinearElementSpacing}
            loading={formState.loading}
            onShowLinearElementsChange={(show) => {
              handlers.setShowLinearElements(show);
              if (!show) {
                handlers.setNewLinearElementMaterial(null);
                handlers.setNewLinearElementWidth("");
                handlers.setNewLinearElementHeight("");
                handlers.setNewLinearElementSpacing("");
              }
            }}
            onLinearElementMaterialChange={handlers.setNewLinearElementMaterial}
            onWidthChange={handlers.setNewLinearElementWidth}
            onHeightChange={handlers.setNewLinearElementHeight}
            onSpacingChange={handlers.setNewLinearElementSpacing}
          />

          <Box
            sx={{
              mt: 4,
              pt: 3,
              borderTop: 1,
              borderColor: "divider",
              display: "flex",
              gap: 2,
            }}
          >
            <Button
              type="submit"
              variant="contained"
              color="primary"
              fullWidth
              size="large"
              sx={{
                height: "48px",
                fontWeight: "bold",
                fontSize: "1.1rem",
              }}
            >
              Save Assembly
            </Button>
            <Button
              variant="outlined"
              color="inherit"
              fullWidth
              size="large"
              onClick={onCancel}
              sx={{
                height: "48px",
                fontSize: "1.1rem",
              }}
            >
              Cancel
            </Button>
          </Box>
        </form>
      </CardContent>
    </Card>
  );
};

export default AssemblyForm;
