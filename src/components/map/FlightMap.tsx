/**
 * Flight map component using react-map-gl with MapLibre
 * Displays the GPS track of the selected flight
 */

import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import Map, { Source, Layer, NavigationControl, Marker } from 'react-map-gl/maplibre';
import type { LineLayer, CircleLayer, MapRef } from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';
import { getTrackCenter, calculateBounds } from '@/lib/utils';

interface FlightMapProps {
  track: [number, number, number][]; // [lng, lat, alt][]
  themeMode: 'system' | 'dark' | 'light';
}

const MAP_STYLES = {
  dark: 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json',
  light: 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json',
} as const;

const TERRAIN_SOURCE_ID = 'terrain-dem';
const TERRAIN_SOURCE = {
  type: 'raster-dem',
  url: 'https://demotiles.maplibre.org/terrain-tiles/tiles.json',
  tileSize: 256,
  maxzoom: 14,
} as const;

export function FlightMap({ track, themeMode }: FlightMapProps) {
  const [viewState, setViewState] = useState({
    longitude: 0,
    latitude: 0,
    zoom: 14,
    pitch: 45,
    bearing: 0,
  });
  const [is3D, setIs3D] = useState(true);
  const mapRef = useRef<MapRef | null>(null);

  const resolvedTheme = useMemo(() => {
    if (themeMode === 'system') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light';
    }
    return themeMode;
  }, [themeMode]);

  // Calculate center and bounds when track changes
  useEffect(() => {
    if (track.length > 0) {
      const [lng, lat] = getTrackCenter(track);
      const bounds = calculateBounds(track);

      // Estimate zoom from bounds
      let zoom = 14;
      if (bounds) {
        const lngDiff = bounds[1][0] - bounds[0][0];
        const latDiff = bounds[1][1] - bounds[0][1];
        const maxDiff = Math.max(lngDiff, latDiff);
        zoom = Math.max(10, Math.min(18, 16 - Math.log2(maxDiff * 111)));
      }

      setViewState((prev) => ({
        ...prev,
        longitude: lng,
        latitude: lat,
        zoom,
      }));
    }
  }, [track]);

  // Convert track to GeoJSON
  const trackGeoJSON = useMemo(() => {
    if (track.length === 0) return null;

    return {
      type: 'Feature' as const,
      properties: {},
      geometry: {
        type: 'LineString' as const,
        coordinates: track,
      },
    };
  }, [track]);

  const altitudePointsGeoJSON = useMemo(() => {
    if (track.length === 0) return null;

    const step = Math.max(1, Math.floor(track.length / 800));
    const features = track
      .filter((_, index) => index % step === 0)
      .map(([lng, lat, alt]) => ({
        type: 'Feature' as const,
        properties: { altitude: alt },
        geometry: {
          type: 'Point' as const,
          coordinates: [lng, lat],
        },
      }));

    return {
      type: 'FeatureCollection' as const,
      features,
    };
  }, [track]);

  // Start and end markers
  const startPoint = track[0];
  const endPoint = track[track.length - 1];

  // Layer styles
  const trackLayerStyle: LineLayer = {
    id: 'flight-track',
    type: 'line',
    paint: {
      'line-color': '#00A0DC',
      'line-width': 3,
      'line-opacity': 0.8,
    },
  };

  const altitudeLayerStyle: CircleLayer = {
    id: 'altitude-points',
    type: 'circle',
    paint: {
      'circle-radius': 3,
      'circle-opacity': 0.8,
      'circle-color': [
        'interpolate',
        ['linear'],
        ['get', 'altitude'],
        0,
        '#38bdf8',
        50,
        '#f59e0b',
        120,
        '#f97316',
        200,
        '#ef4444',
      ],
    },
  };

  const handleMove = useCallback(
    (evt: { viewState: typeof viewState }) => {
      setViewState(evt.viewState);
    },
    []
  );

  const enableTerrain = useCallback(() => {
    const map = mapRef.current?.getMap();
    if (!map) return;

    if (!map.getSource(TERRAIN_SOURCE_ID)) {
      map.addSource(TERRAIN_SOURCE_ID, TERRAIN_SOURCE);
    }

    if (!map.getLayer('sky')) {
      map.addLayer({
        id: 'sky',
        type: 'sky',
        paint: {
          'sky-type': 'atmosphere',
          'sky-atmosphere-sun': [0.0, 0.0],
          'sky-atmosphere-sun-intensity': 10,
        },
      });
    }

    map.setTerrain({ source: TERRAIN_SOURCE_ID, exaggeration: 1.4 });
  }, []);

  const disableTerrain = useCallback(() => {
    const map = mapRef.current?.getMap();
    if (!map) return;
    map.setTerrain(null);
  }, []);

  useEffect(() => {
    if (is3D) {
      enableTerrain();
      setViewState((prev) => ({ ...prev, pitch: 60 }));
    } else {
      disableTerrain();
      setViewState((prev) => ({ ...prev, pitch: 0 }));
    }
  }, [disableTerrain, enableTerrain, is3D]);

  useEffect(() => {
    if (is3D) {
      enableTerrain();
    }
  }, [enableTerrain, is3D, resolvedTheme]);

  if (track.length === 0) {
    return (
      <div className="h-full flex items-center justify-center bg-dji-dark">
        <p className="text-gray-500">No GPS data available</p>
      </div>
    );
  }

  return (
    <Map
      {...viewState}
      onMove={handleMove}
      style={{ width: '100%', height: '100%' }}
      mapStyle={MAP_STYLES[resolvedTheme]}
      attributionControl={false}
      ref={mapRef}
      onLoad={() => {
        if (is3D) {
          enableTerrain();
        }
      }}
    >
      <NavigationControl position="top-right" />

      {/* Map Controls */}
      <div className="absolute top-2 left-2 z-10 bg-dji-dark/80 border border-gray-700 rounded-lg p-2">
        <label className="flex items-center gap-2 text-xs text-gray-300">
          <input
            type="checkbox"
            checked={is3D}
            onChange={(e) => setIs3D(e.target.checked)}
          />
          3D Terrain
        </label>
      </div>

      {/* Flight Track */}
      {trackGeoJSON && (
        <Source id="flight-track" type="geojson" data={trackGeoJSON} lineMetrics={true}>
          <Layer {...trackLayerStyle} />
        </Source>
      )}

      {/* Altitude Points */}
      {altitudePointsGeoJSON && (
        <Source id="altitude-points" type="geojson" data={altitudePointsGeoJSON}>
          <Layer {...altitudeLayerStyle} />
        </Source>
      )}

      {/* Start Marker (Green) */}
      {startPoint && (
        <Marker longitude={startPoint[0]} latitude={startPoint[1]} anchor="center">
          <div className="relative">
            <div className="w-4 h-4 bg-green-500 rounded-full border-2 border-white shadow-lg" />
            <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-xs bg-green-500 text-white px-1.5 py-0.5 rounded whitespace-nowrap">
              Start
            </div>
          </div>
        </Marker>
      )}

      {/* End Marker (Red) */}
      {endPoint && (
        <Marker longitude={endPoint[0]} latitude={endPoint[1]} anchor="center">
          <div className="relative">
            <div className="w-4 h-4 bg-red-500 rounded-full border-2 border-white shadow-lg" />
            <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-xs bg-red-500 text-white px-1.5 py-0.5 rounded whitespace-nowrap">
              End
            </div>
          </div>
        </Marker>
      )}
    </Map>
  );
}
