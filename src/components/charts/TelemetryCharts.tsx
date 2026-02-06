/**
 * Telemetry charts component using ECharts
 * Displays height, VPS height, speed, battery, attitude, RC, and GPS data
 * Optimized for performance with large datasets
 */

import { useMemo, useRef, useCallback } from 'react';
import ReactECharts from 'echarts-for-react';
import type { EChartsOption, ECharts } from 'echarts';
import type { TelemetryData } from '@/types';
import type { UnitSystem } from '@/lib/utils';

interface TelemetryChartsProps {
  data: TelemetryData;
  unitSystem: UnitSystem;
}

export function TelemetryCharts({ data, unitSystem }: TelemetryChartsProps) {
  const chartsRef = useRef<ECharts[]>([]);
  const isSyncingRef = useRef(false);

  const resetZoom = useCallback(() => {
    chartsRef.current.forEach((chart) => {
      chart.dispatchAction({
        type: 'dataZoom',
        start: 0,
        end: 100,
      });
    });
  }, []);

  const syncZoom = useCallback((sourceChart: ECharts) => {
    if (isSyncingRef.current) return;
    const dataZoom = sourceChart.getOption().dataZoom as
      | { start?: number; end?: number; startValue?: number; endValue?: number }[]
      | undefined;
    if (!dataZoom || dataZoom.length === 0) return;

    const { start, end, startValue, endValue } = dataZoom[0] ?? {};

    isSyncingRef.current = true;
    chartsRef.current.forEach((chart) => {
      if (chart === sourceChart) return;
      chart.dispatchAction({
        type: 'dataZoom',
        start,
        end,
        startValue,
        endValue,
      });
    });
    window.setTimeout(() => {
      isSyncingRef.current = false;
    }, 0);
  }, []);

  const registerChart = useCallback(
    (chart: ECharts) => {
      if (chartsRef.current.includes(chart)) return;
      chartsRef.current.push(chart);

      chart.on('dataZoom', () => {
        syncZoom(chart);
      });
    },
    [syncZoom]
  );

  // Memoize chart options to prevent unnecessary re-renders
  const altitudeSpeedOption = useMemo(
    () => createAltitudeSpeedChart(data, unitSystem),
    [data, unitSystem]
  );
  const batteryOption = useMemo(() => createBatteryChart(data), [data]);
  const attitudeOption = useMemo(() => createAttitudeChart(data), [data]);
  const rcSignalOption = useMemo(() => createRcSignalChart(data), [data]);
  const gpsOption = useMemo(() => createGpsChart(data), [data]);

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button
          onClick={resetZoom}
          className="text-xs text-gray-400 hover:text-white border border-gray-700 rounded px-2 py-1"
        >
          Reset zoom
        </button>
      </div>
      {/* Altitude & Speed Chart */}
      <div className="h-60">
        <ReactECharts
          option={altitudeSpeedOption}
          style={{ height: '100%', width: '100%' }}
          opts={{ renderer: 'canvas' }}
          notMerge={true}
          onChartReady={registerChart}
        />
      </div>

      {/* Battery Chart */}
      <div className="h-56">
        <ReactECharts
          option={batteryOption}
          style={{ height: '100%', width: '100%' }}
          opts={{ renderer: 'canvas' }}
          notMerge={true}
          onChartReady={registerChart}
        />
      </div>

      {/* Attitude Chart */}
      <div className="h-48">
        <ReactECharts
          option={attitudeOption}
          style={{ height: '100%', width: '100%' }}
          opts={{ renderer: 'canvas' }}
          notMerge={true}
          onChartReady={registerChart}
        />
      </div>

      {/* RC Signal Chart */}
      <div className="h-40">
        <ReactECharts
          option={rcSignalOption}
          style={{ height: '100%', width: '100%' }}
          opts={{ renderer: 'canvas' }}
          notMerge={true}
          onChartReady={registerChart}
        />
      </div>

      {/* GPS Satellites Chart */}
      <div className="h-40">
        <ReactECharts
          option={gpsOption}
          style={{ height: '100%', width: '100%' }}
          opts={{ renderer: 'canvas' }}
          notMerge={true}
          onChartReady={registerChart}
        />
      </div>
    </div>
  );
}

/** Shared chart configuration for performance */
const baseChartConfig: Partial<EChartsOption> = {
  animation: false, // Disable for large datasets
  grid: {
    left: 50,
    right: 20,
    top: 30,
    bottom: 50,
  },
  tooltip: {
    trigger: 'axis',
    backgroundColor: '#16213e',
    borderColor: '#4a4e69',
    textStyle: {
      color: '#fff',
    },
    axisPointer: {
      type: 'cross',
      lineStyle: {
        color: '#4a4e69',
      },
    },
  },
  legend: {
    textStyle: {
      color: '#9ca3af',
    },
    top: 0,
  },
  xAxis: {
    type: 'category',
    boundaryGap: false,
    axisLine: {
      lineStyle: {
        color: '#4a4e69',
      },
    },
    axisLabel: {
      color: '#9ca3af',
      formatter: (value: string) => {
        const secs = parseFloat(value);
        const mins = Math.floor(secs / 60);
        const remainingSecs = Math.floor(secs % 60);
        return `${mins}:${remainingSecs.toString().padStart(2, '0')}`;
      },
    },
    splitLine: {
      show: false,
    },
  },
  dataZoom: [
    {
      type: 'inside',
      xAxisIndex: 0,
      filterMode: 'filter',
      zoomOnMouseWheel: 'ctrl',
      moveOnMouseWheel: true,
      moveOnMouseMove: true,
    },
    {
      type: 'slider',
      xAxisIndex: 0,
      height: 18,
      bottom: 12,
      brushSelect: false,
      borderColor: '#2a2a4e',
      backgroundColor: '#16213e',
      fillerColor: 'rgba(0, 160, 220, 0.2)',
      handleStyle: {
        color: '#00A0DC',
      },
      textStyle: {
        color: '#9ca3af',
      },
    },
  ],
};

function createAltitudeSpeedChart(
  data: TelemetryData,
  unitSystem: UnitSystem
): EChartsOption {
  const hasHeight = data.height.some((val) => val !== null);
  const fallbackHeight = data.altitude ?? [];
  const heightSource = hasHeight ? data.height : fallbackHeight;
  const heightSeries =
    unitSystem === 'imperial'
      ? heightSource.map((val) => (val === null ? null : val * 3.28084))
      : heightSource;
  const vpsHeightSeries =
    unitSystem === 'imperial'
      ? data.vpsHeight.map((val) => (val === null ? null : val * 3.28084))
      : data.vpsHeight;
  const speedSeries =
    unitSystem === 'imperial'
      ? data.speed.map((val) => (val === null ? null : val * 2.236936))
      : data.speed;
  const heightUnit = unitSystem === 'imperial' ? 'ft' : 'm';
  const speedUnit = unitSystem === 'imperial' ? 'mph' : 'm/s';

  return {
    ...baseChartConfig,
    legend: {
      ...baseChartConfig.legend,
      data: ['Height', 'VPS Height', 'Speed'],
    },
    xAxis: {
      ...baseChartConfig.xAxis,
      data: data.time.map((t) => t.toFixed(1)),
    },
    yAxis: [
      {
        type: 'value',
        name: `Height (${heightUnit})`,
        nameTextStyle: {
          color: '#00A0DC',
        },
        axisLine: {
          lineStyle: {
            color: '#00A0DC',
          },
        },
        axisLabel: {
          color: '#9ca3af',
        },
        splitLine: {
          lineStyle: {
            color: '#2a2a4e',
          },
        },
      },
      {
        type: 'value',
        name: `Speed (${speedUnit})`,
        nameTextStyle: {
          color: '#00D4AA',
        },
        axisLine: {
          lineStyle: {
            color: '#00D4AA',
          },
        },
        axisLabel: {
          color: '#9ca3af',
        },
        splitLine: {
          show: false,
        },
      },
    ],
    series: [
      {
        name: 'Height',
        type: 'line',
        data: heightSeries,
        yAxisIndex: 0,
        smooth: true,
        symbol: 'none',
        itemStyle: {
          color: '#00A0DC',
        },
        lineStyle: {
          color: '#00A0DC',
          width: 2,
        },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(0, 160, 220, 0.3)' },
              { offset: 1, color: 'rgba(0, 160, 220, 0.05)' },
            ],
          },
        },
      },
      {
        name: 'VPS Height',
        type: 'line',
        data: vpsHeightSeries,
        yAxisIndex: 0,
        smooth: true,
        symbol: 'none',
        itemStyle: {
          color: '#f97316',
        },
        lineStyle: {
          color: '#f97316',
          width: 1.5,
        },
      },
      {
        name: 'Speed',
        type: 'line',
        data: speedSeries,
        yAxisIndex: 1,
        smooth: true,
        symbol: 'none',
        itemStyle: {
          color: '#00D4AA',
        },
        lineStyle: {
          color: '#00D4AA',
          width: 2,
        },
      },
    ],
  };
}

function createBatteryChart(data: TelemetryData): EChartsOption {
  return {
    ...baseChartConfig,
    legend: {
      ...baseChartConfig.legend,
      data: ['Battery %', 'Voltage', 'Temperature'],
    },
    xAxis: {
      ...baseChartConfig.xAxis,
      data: data.time.map((t) => t.toFixed(1)),
    },
    yAxis: [
      {
        type: 'value',
        name: 'Battery %',
        min: 0,
        max: 100,
        axisLine: {
          lineStyle: {
            color: '#f59e0b',
          },
        },
        axisLabel: {
          color: '#9ca3af',
        },
        splitLine: {
          lineStyle: {
            color: '#2a2a4e',
          },
        },
      },
      {
        type: 'value',
        name: 'Voltage (V)',
        position: 'right',
        axisLine: {
          lineStyle: {
            color: '#38bdf8',
          },
        },
        axisLabel: {
          color: '#9ca3af',
        },
        splitLine: {
          show: false,
        },
      },
      {
        type: 'value',
        name: 'Temp (°C)',
        position: 'right',
        offset: 50,
        axisLine: {
          lineStyle: {
            color: '#a855f7',
          },
        },
        axisLabel: {
          color: '#9ca3af',
        },
        splitLine: {
          show: false,
        },
      },
    ],
    series: [
      {
        name: 'Battery %',
        type: 'line',
        data: data.battery,
        smooth: true,
        symbol: 'none',
        itemStyle: {
          color: '#f59e0b',
        },
        lineStyle: {
          color: '#f59e0b',
          width: 2,
        },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(245, 158, 11, 0.3)' },
              { offset: 1, color: 'rgba(245, 158, 11, 0.05)' },
            ],
          },
        },
        markLine: {
          silent: true,
          data: [
            {
              yAxis: 20,
              lineStyle: {
                color: '#ef4444',
                type: 'dashed',
              },
              label: {
                formatter: 'Low Battery',
                color: '#ef4444',
              },
            },
          ],
        },
      },
      {
        name: 'Voltage',
        type: 'line',
        data: data.batteryVoltage,
        yAxisIndex: 1,
        smooth: true,
        symbol: 'none',
        itemStyle: {
          color: '#38bdf8',
        },
        lineStyle: {
          color: '#38bdf8',
          width: 1.5,
        },
      },
      {
        name: 'Temperature',
        type: 'line',
        data: data.batteryTemp,
        yAxisIndex: 2,
        smooth: true,
        symbol: 'none',
        itemStyle: {
          color: '#a855f7',
        },
        lineStyle: {
          color: '#a855f7',
          width: 1.5,
        },
      },
    ],
  };
}

function createAttitudeChart(data: TelemetryData): EChartsOption {
  return {
    ...baseChartConfig,
    legend: {
      ...baseChartConfig.legend,
      data: ['Pitch', 'Roll', 'Yaw'],
    },
    xAxis: {
      ...baseChartConfig.xAxis,
      data: data.time.map((t) => t.toFixed(1)),
    },
    yAxis: {
      type: 'value',
      name: 'Degrees',
      axisLine: {
        lineStyle: {
          color: '#4a4e69',
        },
      },
      axisLabel: {
        color: '#9ca3af',
      },
      splitLine: {
        lineStyle: {
          color: '#2a2a4e',
        },
      },
    },
    series: [
      {
        name: 'Pitch',
        type: 'line',
        data: data.pitch,
        smooth: true,
        symbol: 'none',
        itemStyle: {
          color: '#8b5cf6',
        },
        lineStyle: {
          color: '#8b5cf6',
          width: 1.5,
        },
      },
      {
        name: 'Roll',
        type: 'line',
        data: data.roll,
        smooth: true,
        symbol: 'none',
        itemStyle: {
          color: '#ec4899',
        },
        lineStyle: {
          color: '#ec4899',
          width: 1.5,
        },
      },
      {
        name: 'Yaw',
        type: 'line',
        data: data.yaw,
        smooth: true,
        symbol: 'none',
        itemStyle: {
          color: '#14b8a6',
        },
        lineStyle: {
          color: '#14b8a6',
          width: 1.5,
        },
      },
    ],
  };
}

function createRcSignalChart(data: TelemetryData): EChartsOption {
  return {
    ...baseChartConfig,
    legend: {
      ...baseChartConfig.legend,
      data: ['RC Signal'],
    },
    xAxis: {
      ...baseChartConfig.xAxis,
      data: data.time.map((t) => t.toFixed(1)),
    },
    yAxis: {
      type: 'value',
      name: 'RC Signal',
      axisLine: {
        lineStyle: {
          color: '#22c55e',
        },
      },
      axisLabel: {
        color: '#9ca3af',
      },
      splitLine: {
        lineStyle: {
          color: '#2a2a4e',
        },
      },
    },
    series: [
      {
        name: 'RC Signal',
        type: 'line',
        data: data.rcSignal,
        smooth: true,
        symbol: 'none',
        itemStyle: {
          color: '#22c55e',
        },
        lineStyle: {
          color: '#22c55e',
          width: 1.5,
        },
      },
    ],
  };
}

function createGpsChart(data: TelemetryData): EChartsOption {
  return {
    ...baseChartConfig,
    legend: {
      ...baseChartConfig.legend,
      data: ['GPS Satellites'],
    },
    xAxis: {
      ...baseChartConfig.xAxis,
      data: data.time.map((t) => t.toFixed(1)),
    },
    yAxis: {
      type: 'value',
      name: 'Satellites',
      axisLine: {
        lineStyle: {
          color: '#0ea5e9',
        },
      },
      axisLabel: {
        color: '#9ca3af',
      },
      splitLine: {
        lineStyle: {
          color: '#2a2a4e',
        },
      },
    },
    series: [
      {
        name: 'GPS Satellites',
        type: 'line',
        data: data.satellites,
        smooth: true,
        symbol: 'none',
        itemStyle: {
          color: '#0ea5e9',
        },
        lineStyle: {
          color: '#0ea5e9',
          width: 1.5,
        },
      },
    ],
  };
}
