import React from "react";
import {
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from "@mui/material";
import { Assembly } from "../types/Assembly";

interface AssemblyBasicFieldsProps {
  name: string;
  eBKPClassification: string;
  category: Assembly["category"];
  onNameChange: (value: string) => void;
  onEBKPClassificationChange: (value: string) => void;
  onCategoryChange: (value: Assembly["category"]) => void;
}

const AssemblyBasicFields: React.FC<AssemblyBasicFieldsProps> = ({
  name,
  eBKPClassification,
  category,
  onNameChange,
  onEBKPClassificationChange,
  onCategoryChange,
}) => {
  return (
    <>
      <TextField
        fullWidth
        label="Assembly Name"
        value={name}
        onChange={(e) => onNameChange(e.target.value)}
        margin="normal"
        required
      />

      <TextField
        fullWidth
        label="eBKP Classification"
        value={eBKPClassification}
        onChange={(e) => onEBKPClassificationChange(e.target.value)}
        margin="normal"
        required
      />

      <FormControl fullWidth margin="normal">
        <InputLabel>Category</InputLabel>
        <Select
          value={category}
          onChange={(e) =>
            onCategoryChange(e.target.value as Assembly["category"])
          }
          required
        >
          <MenuItem value="Wall">Wall</MenuItem>
          <MenuItem value="Floor">Floor</MenuItem>
        </Select>
      </FormControl>
    </>
  );
};

export default AssemblyBasicFields;
