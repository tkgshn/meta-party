'use client';

import { useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart
} from 'recharts';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';

interface ChartDataPoint {
  timestamp: number;
  balance: number;
  value: number;
  formattedTime: string;
  transactionType?: 'transfer_in' | 'transfer_out' | 'claim';
}

interface PortfolioChartProps {
  data: Array<{
    timestamp: number;
    balance: number;
    blockNumber: number;
    transactionHash?: string;
    transactionType?: 'transfer_in' | 'transfer_out' | 'claim';
    value?: number;
  }>;
  profitLoss: {
    total: number;
    percentage: number;
    period: '1D' | '1W' | '1M' | 'ALL';
  };
  period: '1D' | '1W' | '1M' | 'ALL';
  onPeriodChange: (period: '1D' | '1W' | '1M' | 'ALL') => void;
  isLoading?: boolean;
  currencySymbol?: string;
}

export default function PortfolioChart({
  data,
  profitLoss,
  period,
  onPeriodChange,
  isLoading = false,
  currencySymbol = 'PT'
}: PortfolioChartProps) {
  const [activePoint, setActivePoint] = useState<ChartDataPoint | null>(null);

  // Transform data for chart
  const chartData: ChartDataPoint[] = data.map(point => ({
    timestamp: point.timestamp,
    balance: point.balance,
    value: point.balance, // Use balance as value for now
    formattedTime: formatTimeByPeriod(point.timestamp, period),
    transactionType: point.transactionType
  }));

  function formatTimeByPeriod(timestamp: number, period: '1D' | '1W' | '1M' | 'ALL'): string {
    const date = new Date(timestamp);
    switch (period) {
      case '1D':
        return format(date, 'HH:mm', { locale: ja });
      case '1W':
        return format(date, 'M/d', { locale: ja });
      case '1M':
        return format(date, 'M/d', { locale: ja });
      case 'ALL':
        return format(date, 'M/d', { locale: ja });
      default:
        return format(date, 'M/d HH:mm', { locale: ja });
    }
  }

  // Custom tooltip - Polymarket style
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload as ChartDataPoint;
      const fullDate = format(new Date(data.timestamp), 'MMM d, yyyy h:mm a');
      
      return (
        <div className="bg-white p-4 border border-gray-200 rounded-xl shadow-xl backdrop-blur-sm">
          <p className="text-xs text-gray-500 mb-2 font-medium uppercase tracking-wide">{fullDate}</p>
          <div className="flex items-center space-x-3">
            <div className={`w-2 h-2 rounded-full ${profitLoss.total >= 0 ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span className="font-bold text-gray-900 text-lg">
              ${data.balance.toFixed(2)}
            </span>
          </div>
          {data.transactionType && (
            <div className="mt-2 pt-2 border-t border-gray-100">
              <span className="text-xs text-gray-600 font-medium">
                {data.transactionType === 'claim' && '🎁 Token Claim'}
                {data.transactionType === 'transfer_in' && '📈 Received'}
                {data.transactionType === 'transfer_out' && '📉 Sent'}
              </span>
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  // Determine line color based on profit/loss
  const lineColor = profitLoss.total >= 0 ? '#10B981' : '#EF4444'; // green or red
  const areaColor = profitLoss.total >= 0 ? '#10B981' : '#EF4444';
  const areaOpacity = 0.1;

  if (isLoading) {
    return (
      <div className="w-full h-64 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
          <p className="text-gray-500 text-sm">チャートデータを読み込み中...</p>
        </div>
      </div>
    );
  }

  if (!data.length) {
    return (
      <div className="w-full h-64 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 text-sm">履歴データがありません</p>
          <p className="text-gray-400 text-xs mt-1">
            トランザクションが発生するとチャートが表示されます
          </p>
        </div>
      </div>
    );
  }

  const currentBalance = chartData[chartData.length - 1]?.balance || 0;

  return (
    <div className="w-full">
      {/* Polymarket-style Header */}
      <div className="flex items-start justify-between mb-6">
        <div className="flex-1">
          {/* P&L Display - Polymarket style */}
          <div className="mb-2">
            <div className={`flex items-center space-x-2 ${profitLoss.total >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              <span className="text-lg font-medium">
                {profitLoss.total >= 0 ? '▲' : '▼'}
              </span>
              <span className="text-4xl font-bold tracking-tight">
                {profitLoss.total >= 0 ? '+' : '-'}${Math.abs(profitLoss.total).toFixed(2)}
              </span>
            </div>
            <div className="text-gray-500 text-sm mt-1 flex items-center space-x-4">
              <span>{period === 'ALL' ? 'All-Time' : period}</span>
              <div className="h-1 w-1 bg-gray-300 rounded-full"></div>
              <span className="text-gray-400">Polymarket</span>
            </div>
          </div>
        </div>

        {/* Period selector - Polymarket style */}
        <div className="flex items-center space-x-1 bg-gray-50 rounded-lg p-1 border">
          {(['1D', '1W', '1M', 'ALL'] as const).map((p) => (
            <button
              key={p}
              onClick={() => onPeriodChange(p)}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
                period === p
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Chart - Polymarket style */}
      <div className="h-80 w-full relative bg-white rounded-lg border border-gray-100">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={chartData}
            margin={{
              top: 20,
              right: 20,
              left: 40,
              bottom: 20,
            }}
          >
            <defs>
              <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={areaColor} stopOpacity={0.15} />
                <stop offset="100%" stopColor={areaColor} stopOpacity={0.01} />
              </linearGradient>
            </defs>
            <CartesianGrid 
              strokeDasharray="none" 
              stroke="#f3f4f6" 
              horizontal={true}
              vertical={false}
            />
            <XAxis
              dataKey="formattedTime"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 11, fill: '#9ca3af', fontWeight: 500 }}
              dy={10}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 11, fill: '#9ca3af', fontWeight: 500 }}
              tickFormatter={(value) => `${value.toFixed(0)}`}
              width={60}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="balance"
              stroke={lineColor}
              strokeWidth={3}
              fill="url(#colorBalance)"
              fillOpacity={1}
              dot={false}
              activeDot={{
                r: 5,
                fill: lineColor,
                strokeWidth: 3,
                stroke: '#fff',
                shadowColor: 'rgba(0,0,0,0.1)',
                filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))'
              }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Chart info - Polymarket style */}
      <div className="mt-6 flex items-center justify-between text-xs text-gray-400 px-1">
        <div className="flex items-center space-x-4">
          <span>Hover to view details</span>
          <div className="h-1 w-1 bg-gray-300 rounded-full"></div>
          <span>Based on on-chain transaction history</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className={`w-2 h-2 rounded-full ${profitLoss.total >= 0 ? 'bg-green-500' : 'bg-red-500'}`}></div>
          <span>Portfolio Value</span>
        </div>
      </div>
    </div>
  );
}

// Helper function for period labels
export function getPeriodLabel(period: '1D' | '1W' | '1M' | 'ALL'): string {
  switch (period) {
    case '1D':
      return '1日';
    case '1W':
      return '1週間';
    case '1M':
      return '1ヶ月';
    case 'ALL':
      return '全期間';
    default:
      return '全期間';
  }
}