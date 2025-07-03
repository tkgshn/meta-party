# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Structure

This is a meta-party project focused on Futarchy (prediction market-based governance) with the following architecture:

- **Main repository**: Contains reference materials and documentation
- **Futarchy submodule**: Located at `ref/futarchy/` - a Next.js web application demonstrating Futarchy concepts
- **Reference documents**: `ref/Mirai-master-plan.md` and `ref/v0.md` contain project specifications and planning

## Development Commands

### Futarchy Web Application (ref/futarchy/)
```bash
# Navigate to the futarchy directory
cd ref/futarchy/

# Development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Lint code
npm run lint
```

### Git Submodule Management
```bash
# Clone with submodules
git clone --recurse-submodules https://github.com/tkgshn/meta-party.git

# Initialize submodules (if already cloned)
git submodule update --init --recursive

# Update submodules to latest
git submodule update --remote
```

## Architecture Overview

The project demonstrates a "Meta-Party" concept - a prediction market-based governance system called Futarchy. Key components:

### Frontend Architecture (Next.js)
- **Pages**: `index.js` (main landing), `master-plan.js` (detailed plan), `_app.js`, `_document.js`
- **Components**: Modular React components for different sections (IntroSection, PoliticalCorruptionSection, FutarchySimulationSection, etc.)
- **Styling**: Tailwind CSS with custom modules for specific components
- **Visualization**: D3.js and Three.js for interactive charts and 3D visualizations
- **Data**: Plotly for advanced data visualization

### Key Technologies
- **Next.js 14**: React framework with SSR/SSG capabilities
- **TypeScript**: Type safety throughout the codebase
- **Tailwind CSS**: Utility-first CSS framework
- **D3.js**: Data visualization library
- **Three.js**: 3D graphics library
- **Plotly**: Interactive plotting library

### Project Philosophy
The codebase implements concepts from the Mirai Master Plan, focusing on:
- Prediction markets for governance (Futarchy)
- Principal-agent problem solutions
- Collective intelligence aggregation
- Self-sustaining governance models

## Development Notes

- The main application lives in the `ref/futarchy/` submodule
- All development work should be done within the submodule directory
- The project uses Japanese and English documentation
- Focus on governance innovation and prediction market mechanisms