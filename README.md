# Construction Assemblies Manager 🏗️

[![React](https://img.shields.io/badge/React-18.3-blue.svg)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-blue.svg)](https://www.typescriptlang.org/)
[![Material-UI](https://img.shields.io/badge/MUI-6.4-blue.svg)](https://mui.com/)
[![Vite](https://img.shields.io/badge/Vite-6.0-646CFF.svg)](https://vitejs.dev/)
[![Fuse.js](https://img.shields.io/badge/Fuse.js-7.1-orange.svg)](https://fusejs.io/)
[![License](https://img.shields.io/badge/license-AGPL--3.0-green.svg)](LICENSE)

A modern web application for managing and analyzing construction assemblies with environmental impact calculations based on KBOB data. Built with React, TypeScript, and Material-UI, it provides a user-friendly interface for creating, managing, and analyzing the environmental impact of construction assemblies.

> **Note**: This application requires an API key from [lcadata.ch](https://lcadata.ch) to access the KBOB materials database. Please reach out to get access to the API.

## 🎯 Overview

The Construction Assemblies Manager helps architects, engineers, and construction professionals:

- Design and analyze layered construction assemblies
- Calculate environmental impacts using official KBOB data
- Compare different construction solutions
- Generate standardized environmental impact reports

## ✨ Features

- 📊 Create and manage construction assemblies (walls, floors)
- 🔄 Import/Export assemblies as JSON
- 🌱 Calculate environmental impacts based on KBOB data:
  - Global Warming Potential (GWP) in kg CO₂ eq/m²
  - Environmental Impact Points (UBP)
  - Non-renewable Primary Energy (PENRE) in kWh/m²
- 🔍 Smart material matching with fuzzy search
- 🛠️ Advanced layer composition:
  - Base materials with customizable thickness and density
  - Reinforcement specifications (rebar kg/m³)
  - Linear elements (e.g., studs, battens) with dimensions and spacing
- 📈 Impact calculations:
  - Absolute values per m²
  - Annual values based on component lifespan (based on eBKP classification and SIA 2032)
- 📱 Responsive design for all devices
- ⚡ Real-time impact calculations and visualization
- 🎨 Visual section view with interactive layer management
- 🔁 Flexible layer ordering and editing
- 🏗️ Support for standard construction categories:
  - Walls (interior, exterior)
  - Floor constructions

## 🚀 Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm (v9 or higher) or yarn
- API key from lcadata.ch

### Installation

```bash
# Clone the repository
git clone https://github.com/louistrue/lca-assemblies.git

# Navigate to project directory
cd lca-assemblies

# Install dependencies
npm install

# Start development server
npm run dev
```

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run lint` - Run ESLint
- `npm run preview` - Preview production build

## 💡 Usage Guide

### Creating an Assembly

1. Click "Add Assembly" to start a new assembly
2. Enter basic information:
   - Name and ID
   - Category (Wall/Floor)
   - eBKP classification (determines component lifespan)

### Adding Layers

1. Select material from KBOB database using fuzzy search
2. Specify layer thickness in mm
3. Optional: Adjust material density within allowed range
4. For concrete layers:
   - Add rebar specifications (kg/m³)
   - Select rebar material grade
5. For timber/steel constructions:
   - Add linear elements (studs, battens)
   - Specify dimensions and spacing

### Environmental Impact Analysis

- View real-time calculations for:
  - Global Warming Potential (GWP)
  - Environmental Impact Points (UBP)
  - Non-renewable Primary Energy (PENRE)
- Toggle between absolute and annual values
- Analyze impacts per layer and total assembly

### Data Management

- Export assemblies as JSON for downstream processing, backup or sharing
- Import existing assemblies
- Sort and filter by:
  - Name/ID
  - Category
  - Environmental impact
  - Total width

## 🔧 Configuration

### Development Setup

Create a `vite.config.ts` file:

```typescript
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/api": {
        target: "https://www.lcadata.ch",
        changeOrigin: true,
        secure: false,
        headers: {
          "x-api-key": "your-api-key",
        },
      },
    },
  },
});
```

## 🤝 Contributing

We welcome contributions! Here's how you can help:

1. Fork the repository
2. Create a feature branch:
   ```bash
   git checkout -b feature/AmazingFeature
   ```
3. Make your changes
4. Run tests and linting:
   ```bash
   npm run lint
   ```
5. Commit your changes:
   ```bash
   git commit -m 'Add some AmazingFeature'
   ```
6. Push to your branch:
   ```bash
   git push origin feature/AmazingFeature
   ```
7. Open a Pull Request

### Development Guidelines

- Follow TypeScript best practices
- Use functional components with hooks
- Maintain consistent code style
- Add comments for complex logic
- Update documentation as needed

## 📝 License

This project is licensed under the GNU Affero General Public License v3.0 (AGPL-3.0) - see the [LICENSE](LICENSE) file for details.

### Key License Requirements

- Disclose source code when distributing
- State changes made to the code
- License derivative works under AGPL-3.0
- Include original copyright and license
- Network use is distribution

## 🙏 Acknowledgments

- [KBOB](https://www.kbob.admin.ch/) for environmental impact data
- [Material-UI](https://mui.com/) for the comprehensive component library
- [Fuse.js](https://fusejs.io/) for fuzzy search capabilities
- [Vite](https://vitejs.dev/) for the fast development experience
- [React](https://reactjs.org/) for the powerful UI framework
- [TypeScript](https://www.typescriptlang.org/) for type safety

## 📚 Technical Stack

- **Frontend**: React 18.3, TypeScript 5.6
- **UI Framework**: Material-UI 6.4
- **Build Tool**: Vite 6.0
- **State Management**: React Hooks
- **API Integration**: Axios 1.7
- **Search**: Fuse.js 7.1
- **Backend**: Express 4.21
- **Development**: ESLint 9.17

## 📫 Support

For questions and support, please:

1. Check the [Issues](https://github.com/louistrue/lca-assemblies/issues) section
2. Create a new issue if needed

## 📋 Data Format

### Assembly JSON Structure

The application uses a JSON format for importing and exporting assemblies. Each assembly is represented as an object with the following structure:

```json
{
  "id": "awa001", // Unique identifier
  "name": "Example Wall Assembly", // Display name
  "category": "Wall", // "Wall" or "Floor"
  "width": 0.374, // Total width in meters
  "total_gwp": 55.025, // Total Global Warming Potential (kg CO₂ eq/m²)
  "total_ubp": 91587.21, // Total Environmental Impact Points
  "total_penre": 220.925, // Total Non-renewable Primary Energy (kWh/m²)
  "total_gwp_per_year": 1.205, // Annual GWP (total_gwp / amortization_years)
  "total_ubp_per_year": 2010.25, // Annual UBP
  "total_penre_per_year": 4.795, // Annual PENRE
  "layers": [
    // Array of layer objects
    {
      "material": "Example Material", // Material name
      "fraction": 0.0187, // Layer thickness / total width
      "materialData": {
        "kbobName": "KBOB Material Name", // Material name in KBOB database
        "unit": "kg", // Always "kg"
        "density": 1800, // Material density in kg/m³
        "userDefinedDensity": false, // Whether density was customized
        "eBKPClassification": "E02.03", // eBKP code (determines lifespan)
        "amortization_years": 40, // Component lifespan from eBKP
        "layer_thickness": 0.007, // Layer thickness in meters
        "kg_per_m2": 12.6, // Material mass per m²
        "gwp": 8.177, // Layer GWP (kg CO₂ eq/m²)
        "UBP": 13356, // Layer UBP
        "PENRE": 22.428, // Layer PENRE (kWh/m²)
        "gwp_indicator": 0.649, // KBOB GWP per kg
        "UBP_indicator": 1060, // KBOB UBP per kg
        "PENRE_indicator": 1.78, // KBOB PENRE per kg
        "gwp_per_year": 0.204, // Annual layer GWP
        "UBP_per_year": 333.9, // Annual layer UBP
        "PENRE_per_year": 0.56 // Annual layer PENRE
      },
      "linearElements": {
        // Optional: Linear elements in layer
        "material": "Timber Studs", // Linear element material
        "width": 80, // Width in mm
        "height": 200, // Height in mm
        "spacing": 625, // Center-to-center spacing in mm
        "kg_per_m2": 11.16, // Mass per m² based on dimensions
        "materialData": {
          // Same structure as layer materialData
          // ... material data fields
        }
      },
      "rebar": {
        // Optional: Reinforcement in layer
        "material": "Steel Rebar", // Rebar material
        "kgPerCubicMeter": 100, // Reinforcement ratio in kg/m³
        "materialData": {
          // Same structure as layer materialData
          // ... material data fields
        }
      }
    }
  ]
}
```

### Key Points

- All dimensions are stored in base SI units (meters, kilograms)
- Environmental impacts are calculated per square meter
- Annual values consider the component lifespan based on eBKP classification and amortization period in Annex of SIA 2032
- Layer fractions represent the proportion of total assembly width
- Linear elements and rebar are optional components within a layer
- Material data includes both total values and KBOB indicators per kg

### eBKP Classifications

The eBKP classification determines the component lifespan according the amortization period in SIA 2032 Annex:

- `B06.xx`, `C01-04`, `E01`, `F01.01`: 60 years
- `E02.03-05`, `F01.03`: 40 years
- `E02.01-02`, `E03`, `F01.02`, `F02`, `G01-04`: 30 years
