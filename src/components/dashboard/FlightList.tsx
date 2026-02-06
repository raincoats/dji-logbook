/**
 * Flight list component for the sidebar
 * Displays all imported flights with selection
 */

import { useState } from 'react';
import { useFlightStore } from '@/stores/flightStore';
import { formatDuration, formatDateTime, formatDistance } from '@/lib/utils';

export function FlightList() {
  const {
    flights,
    selectedFlightId,
    selectFlight,
    deleteFlight,
    updateFlightName,
    unitSystem,
  } =
    useFlightStore();
  const [editingId, setEditingId] = useState<number | null>(null);
  const [draftName, setDraftName] = useState('');

  if (flights.length === 0) {
    return (
      <div className="p-4 text-center text-gray-500">
        <p className="text-sm">No flights imported yet.</p>
        <p className="text-xs mt-1">
          Drag & drop a log file above to get started.
        </p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-gray-700/50">
      {flights.map((flight) => (
        <div
          key={flight.id}
          onClick={() => selectFlight(flight.id)}
          role="button"
          tabIndex={0}
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ' ') {
              selectFlight(flight.id);
            }
          }}
          className={`w-full p-3 text-left hover:bg-gray-700/30 transition-colors group ${
            selectedFlightId === flight.id
              ? 'bg-dji-primary/20 border-l-2 border-dji-primary'
              : 'border-l-2 border-transparent'
          }`}
        >
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              {/* Display Name */}
              {editingId === flight.id ? (
                <div className="flex items-center gap-2">
                  <input
                    value={draftName}
                    onChange={(e) => setDraftName(e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                    className="input h-7 text-sm px-2"
                    placeholder="Flight name"
                  />
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      const name = draftName.trim();
                      if (name.length > 0) {
                        updateFlightName(flight.id, name);
                      }
                      setEditingId(null);
                    }}
                    className="text-xs text-dji-primary hover:text-dji-accent"
                  >
                    Save
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditingId(null);
                    }}
                    className="text-xs text-gray-400 hover:text-gray-200"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <p className="font-medium text-white truncate">
                    {flight.displayName || flight.fileName}
                  </p>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditingId(flight.id);
                      setDraftName(flight.displayName || flight.fileName);
                    }}
                    className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-white transition-colors"
                    title="Rename flight"
                  >
                    <EditIcon />
                  </button>
                </div>
              )}

              {/* Drone Model */}
              {flight.droneModel && !flight.droneModel.startsWith('Unknown') && (
                <p className="text-xs text-gray-500 mt-0.5 truncate">
                  {flight.droneModel}
                </p>
              )}

              {/* Flight Date */}
              <p className="text-xs text-gray-400 mt-0.5">
                {formatDateTime(flight.startTime)}
              </p>

              {/* Stats Row */}
              <div className="flex gap-3 mt-2 text-xs text-gray-500">
                <span className="flex items-center gap-1">
                  <ClockIcon />
                  {formatDuration(flight.durationSecs)}
                </span>
                <span className="flex items-center gap-1">
                  <DistanceIcon />
                  {formatDistance(flight.totalDistance, unitSystem)}
                </span>
              </div>
            </div>

            {/* Delete Button */}
            <button
              onClick={async (e) => {
                e.stopPropagation();
                const shouldDelete = window.confirm(
                  `Delete "${flight.displayName || flight.fileName}"? This cannot be undone.`
                );
                if (shouldDelete) {
                  deleteFlight(flight.id);
                }
              }}
              className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-500/20 rounded transition-all"
              title="Delete flight"
            >
              <TrashIcon />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

function ClockIcon() {
  return (
    <svg
      className="w-3.5 h-3.5"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  );
}

function DistanceIcon() {
  return (
    <svg
      className="w-3.5 h-3.5"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
      />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg
      className="w-4 h-4 text-red-400"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
      />
    </svg>
  );
}

function EditIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M11 5h2m-1 0v14m-7 0h14"
      />
    </svg>
  );
}
