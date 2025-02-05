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
  id: string;
  category: Assembly["category"];
  onNameChange: (value: string) => void;
  onIdChange: (value: string) => void;
  onCategoryChange: (value: Assembly["category"]) => void;
  isNewAssembly: boolean;
}

const AssemblyBasicFields: React.FC<AssemblyBasicFieldsProps> = ({
  name,
  id,
  category,
  onNameChange,
  onIdChange,
  onCategoryChange,
  isNewAssembly,
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
        label="Assembly ID"
        value={id}
        onChange={(e) => onIdChange(e.target.value)}
        margin="normal"
        required
        disabled={!isNewAssembly}
        helperText={
          isNewAssembly
            ? "Enter a unique identifier"
            : "ID cannot be changed after creation"
        }
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
