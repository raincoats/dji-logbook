import type { OverviewStats } from '@/types';
import {
  formatDistance,
  formatDuration,
  formatSpeed,
  type UnitSystem,
} from '@/lib/utils';

interface OverviewProps {
  stats: OverviewStats;
  unitSystem: UnitSystem;
}

export function Overview({ stats, unitSystem }: OverviewProps) {
  const avgDistancePerFlight =
    stats.totalFlights > 0
      ? stats.totalDistanceM / stats.totalFlights
      : 0;
  const avgDurationPerFlight =
    stats.totalFlights > 0
      ? stats.totalDurationSecs / stats.totalFlights
      : 0;
  const avgSpeed =
    stats.totalDurationSecs > 0
      ? stats.totalDistanceM / stats.totalDurationSecs
      : 0;

  return (
    <div className="p-4 space-y-4 overflow-auto">
      <div className="grid grid-cols-4 gap-3">
        <StatCard label="Total Flights" value={stats.totalFlights.toLocaleString()} />
        <StatCard
          label="Total Distance"
          value={formatDistance(stats.totalDistanceM, unitSystem)}
        />
        <StatCard
          label="Total Time"
          value={formatDuration(stats.totalDurationSecs)}
        />
        <StatCard
          label="Total Points"
          value={stats.totalPoints.toLocaleString()}
        />
      </div>

      <div className="grid grid-cols-3 gap-3">
        <StatCard
          label="Avg Distance / Flight"
          value={formatDistance(avgDistancePerFlight, unitSystem)}
        />
        <StatCard
          label="Avg Duration / Flight"
          value={formatDuration(avgDurationPerFlight)}
        />
        <StatCard
          label="Avg Speed"
          value={formatSpeed(avgSpeed, unitSystem)}
        />
      </div>

      <div className="card p-4">
        <h3 className="text-sm font-semibold text-white mb-3">
          Batteries Used
        </h3>
        {stats.batteriesUsed.length === 0 ? (
          <p className="text-sm text-gray-400">No battery serials recorded.</p>
        ) : (
          <div className="divide-y divide-gray-700/50">
            {stats.batteriesUsed.map((battery) => (
              <div
                key={battery.batterySerial}
                className="flex items-center justify-between py-2 text-sm"
              >
                <span className="text-gray-300 truncate">
                  {battery.batterySerial}
                </span>
                <span className="text-gray-400">
                  {battery.flightCount} flight{battery.flightCount !== 1 ? 's' : ''}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="stat-card">
      <span className="stat-value">{value}</span>
      <span className="stat-label">{label}</span>
    </div>
  );
}