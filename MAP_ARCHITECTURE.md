# Railway Corridor Architecture & Engine Documentation

This document explains the technical mathematics, dynamic rendering, and pathfinding logic powering the interactive railway map.

## 1. The Rendering Engine
The entire map is built as a massive, infinitely scalable, hardware-accelerated **SVG (Scalable Vector Graphics)** canvas rendered in React. It is nested inside a `react-zoom-pan-pinch` wrapper, which allows the user to smoothly drag to pan and scroll to zoom without losing any graphical fidelity.

## 2. Dynamic Station Generation
Instead of hardcoding the UI for all 15 stations between Chengalpattu (CGL) and Chennai Central (MAS), the map is generated algorithmically from a core configuration array.
- The map spans a massive geographical `CANVAS_WIDTH` based on a mathematical `STATION_SPACING` (1600 pixels).
- **Intelligent Track Routing (`getStationMainY`)**: Massive stations (like Chennai Central, which has 17 platforms) require sprawling yards. The math engine automatically distributes platforms around a geometric center (`CENTER_Y`). It dynamically calculates whether a station needs a 3-lane mainline setup (for major hubs) or gracefully funnels down to a 2-lane setup (for small stations with ≤ 4 platforms).

## 3. Organic & Randomized Switchyards
One of the most complex features of the map is the natural, non-uniform rendering of the tracks as they converge and diverge into the station platforms.
- **Deterministic Chaos (`pseudoRandom`)**: We built a custom pseudo-random hashing function. This ensures that the wildly sprawling, crisscrossing tracks look completely random and organic, but are strictly mathematical so that the Train AI can accurately follow them.
- **Sprawling Terminals**: Massive terminals are mathematically flagged to multiply their `yardStartOffset` and `yardEndOffset` by 300%. This mimics reality, where the switchyards for huge stations like Tambaram stretch for miles outside the actual station structure.
- **X-Crossovers**: The engine injects explicit physical interlocking crossovers (such as the one outside Maraimalai Nagar), allowing trains to glide diagonally across the mainlines.

## 4. The Pathfinding Engine (`getTrainY`)
The "telemetry" you see—the trains smoothly gliding, banking, and switching tracks—is completely real-time.
1. **Zonal Scanning**: As a train moves across the X-axis, the `getTrainY` function continuously scans which "zone" the train is in (e.g., inter-station, divergence zone, convergence zone, or parallel platform block).
2. **Real-time Bézier Interpolation**: When a train enters a switchyard, it doesn't just teleport. The math engine runs a smooth Cosine interpolation equation: `((1 - Math.cos(Math.PI * t)) / 2)`. This equation perfectly matches the curvature of the SVG SVG S-curves (`drawThroat`), ensuring the nose of the train perfectly traces the rails.
3. **Dynamic Tangent Rotation**: We calculate the train's trajectory slightly ahead of its current position (`Math.atan2(dy, dx)`). This calculates the physical tangent of the curve, causing the train arrow to dynamically rotate and "bank" smoothly into the turns.
4. **Lane Switching AI**: Trains are spawned with a `switchDirection`. As they pass through physical interlocking yards, they calculate their `effectiveLane`, allowing them to glide smoothly from the express track to the passenger track mid-transit.

## 5. Architectural UI Theme
The aesthetic is designed to look like a premium, modern engineering blueprint:
- **Canvas**: A light, matte Sage Green (`#d6e1c9`) to reduce glare and mimic architectural paper.
- **Tracks**: Bold, heavy Charcoal/Slate (`#52525b` & `#1f2937`) to strongly anchor the map.
- **Stations**: Premium frosted white glass panels (`rgba(255, 255, 255, 0.65)`) with crisp, high-tech dark corner accents.
- **Platforms**: Industrial concrete bases (`#f3f4f6`) with simulated safety hatching, clearly labeled with high-contrast `PF-X` numbering.
