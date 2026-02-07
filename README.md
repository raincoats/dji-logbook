# DJI Flight Log Viewer

A high-performance desktop application for analyzing DJI drone flight logs. Built with Tauri v2, DuckDB, and React.

## Features

- 📊 **High-Performance Analytics**: DuckDB-powered analytical queries with automatic downsampling for large datasets
- 🗺️ **Interactive Flight Maps**: View your flight path with MapLibre GL (3D terrain supported)
- 📈 **Telemetry Charts**: ECharts-based visualization of height/VPS, speed (km/h in metric), battery, attitude, RC, and GPS
- 🔐 **V13+ Log Support**: Automatic encryption key handling for newer DJI logs
- 💾 **Local-First**: All data stored locally in a single DuckDB database
- 🎛️ **Filters & Search**: Date range picker, drone/device filter, and battery serial filter
- 🧭 **Overview Dashboard**: Aggregate totals, averages, and battery usage insights
- 🎨 **Theme & Units**: Light/Dark/System theme and Metric/Imperial units
- ✏️ **Editable Flight Names**: Rename flights directly in the sidebar
- 🔍 **Synced Zoom**: Pan/zoom charts together with reset zoom
- 🚀 **Cross-Platform**: Works on Windows, macOS, and Linux

## Tech Stack

### Backend (Rust)
- **Tauri v2**: Desktop application framework
- **DuckDB**: Embedded analytical database (bundled, no installation required)
- **dji-log-parser**: DJI flight log parsing library

### Frontend (React)
- **React 18 + TypeScript**: UI framework
- **Vite**: Build tool
- **Tailwind CSS**: Styling
- **Zustand**: State management
- **ECharts**: Telemetry charting
- **react-map-gl + MapLibre**: Map visualization

## Prerequisites

- [Rust](https://rustup.rs/) (1.70+)
- [Node.js](https://nodejs.org/) (18+)
- [pnpm](https://pnpm.io/) or npm

## Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/dji-logviewer.git
cd dji-logviewer

# Install frontend dependencies
npm install

# Run in development mode
npm run tauri
```

Optional: run without file watching (useful on slow filesystems)

```bash
npm run tauri:nowatch
```

## Building for Production

```bash
# Build the application
npm run tauri build
```

The built application will be in `src-tauri/target/release/bundle/`.

## Project Structure

```
├── src-tauri/               # RUST BACKEND
│   ├── src/
│   │   ├── main.rs          # Entry point (Tauri commands)
│   │   ├── database.rs      # DuckDB connection & schema
│   │   ├── parser.rs        # dji-log-parser wrapper
│   │   ├── models.rs        # Data structures
│   │   └── api.rs           # DJI API key fetching (if present)
│   ├── Cargo.toml           # Rust dependencies
│   └── tauri.conf.json      # App configuration
│
├── src/                     # REACT FRONTEND
│   ├── components/
│   │   ├── dashboard/       # Layout components
│   │   ├── charts/          # ECharts components
│   │   └── map/             # MapLibre components
│   ├── stores/              # Zustand state
│   ├── types/               # TypeScript interfaces
│   └── lib/                 # Utilities
│
└── [App Data Directory]     # RUNTIME DATA
    ├── flights.db           # DuckDB database
    ├── raw_logs/            # Original log files
    └── keychains/           # Cached decryption keys
```

## Database Schema

### flights table
- Flight metadata (drone model, duration, statistics)
- Optimized with indexes for date-based queries

### telemetry table
- Time-series telemetry data
- Composite primary key (flight_id, timestamp_ms) for efficient range queries
- Automatic downsampling for large flights (>5000 points)
- Column order enforcement with automatic rebuild if mismatched

## Usage

1. **Import a Flight Log**: Click "Browse Files" or drag-and-drop a DJI log file
2. **Select a Flight**: Click on a flight in the sidebar
3. **Analyze Data**: View telemetry charts and flight path on the map
4. **Filter Flights**: Use date range, drone/device, and battery serial filters
5. **Configure Settings**: Set API key, theme, and units in Settings

## Supported Log Formats

- `.txt` - DJI Go app logs
- `.dat` - DJI binary logs
- `.log` - Various DJI log formats

## Performance Optimizations

- **Bulk Inserts**: Uses DuckDB's Appender for fast data ingestion
- **Automatic Downsampling**: Long flights are downsampled to ~5000 points for visualization
- **Canvas Rendering**: ECharts uses canvas with animations disabled for smooth scrolling
- **Lazy Loading**: Flight data is loaded on-demand when selected

## Configuration

- **DJI API Key**: Stored locally in `config.json` (never sent to third parties except DJI API). You can also provide it via `.env`.
- **Database Location**: Stored in the platform-specific app data directory (e.g., AppData on Windows, Application Support on macOS, and local share on Linux).

## License

MIT License - see [LICENSE](LICENSE) for details.

## Acknowledgments

- [dji-log-parser](https://github.com/lvauvillier/dji-log-parser) - DJI log parsing
- [DuckDB](https://duckdb.org/) - Analytical database
- [Tauri](https://tauri.app/) - Desktop app framework
