---
title: Revolutions
description: 3D revolution surface visualizer for non-polynomial equations using Python and Matplotlib.
---

## Overview

**Revolutions** is a Python tool that generates 3D surfaces of revolution from non-polynomial equations (e.g., `y = C` or `x = C`). It takes a 2D curve and rotates it around an axis to produce an interactive 3D visualization using Matplotlib.

**GitHub:** [voidReq/revolutions](https://github.com/voidReq/revolutions)


![Rotations](/projects/rotation.png)
## Tech Stack

- **Language:** Python
- **Libraries:** Matplotlib, NumPy
- **Visualization:** 3D surface plots with interactive rotation

## How It Works

The tool takes a mathematical equation and generates a surface of revolution by:

1. **Parsing the equation** — Accepts equations in forms like `y = f(x)` or parametric curves
2. **Discretizing the curve** — Samples points along the curve at regular intervals
3. **Rotating around an axis** — Applies rotational transformations to generate 3D coordinates
4. **Rendering** — Uses Matplotlib's `plot_surface` to visualize the result with customizable colormaps

## Usage

```python
python customModel.py
```

The script prompts for an equation and renders the resulting 3D surface interactively. You can rotate, zoom, and pan the visualization in real time.

## Key Features

- Handles non-polynomial equations
- Interactive 3D visualization with full camera control
- Clean, minimal codebase — easy to extend with new equation types
- Custom color mapping for surface rendering
