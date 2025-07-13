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
import { ChevronDownIcon } from '@heroicons/react/24/outline';

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

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload as ChartDataPoint;
      const fullDate = format(new Date(data.timestamp), 'yyyy年M月d日 HH:mm', { locale: ja });
      
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="text-sm text-gray-600 mb-1">{fullDate}</p>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
            <span className="font-semibold text-gray-900">
              {data.balance.toFixed(2)} {currencySymbol}
            </span>
          </div>
          {data.transactionType && (
            <p className="text-xs text-gray-500 mt-1">
              {data.transactionType === 'claim' && '🎁 トークン受取'}
              {data.transactionType === 'transfer_in' && '📈 受信'}
              {data.transactionType === 'transfer_out' && '📉 送信'}
            </p>
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
      {/* Header with P&L info */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-baseline space-x-4">
          <div>
            <div className={`flex items-center space-x-2 ${profitLoss.total >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              <span className="text-xs">
                {profitLoss.total >= 0 ? '▲' : '▼'}
              </span>
              <span className="text-2xl font-bold">
                {profitLoss.total >= 0 ? '+' : '-'}{Math.abs(profitLoss.total).toFixed(2)} PT
              </span>
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {period === 'ALL' ? '全期間' : period}
            </div>
          </div>
          
          {/* Current portfolio value */}
          <div className="border-l border-gray-200 pl-4">
            <div className="text-lg font-semibold text-gray-900">
              {currentBalance.toFixed(2)} {currencySymbol}
            </div>
            <div className="text-xs text-gray-500">
              現在の残高
            </div>
          </div>
        </div>

        {/* Period selector */}
        <div className="flex items-center space-x-1 bg-gray-100 rounded-lg p-1">
          {(['1D', '1W', '1M', 'ALL'] as const).map((p) => (
            <button
              key={p}
              onClick={() => onPeriodChange(p)}
              className={`px-3 py-1.5 text-sm font-medium rounded transition-colors ${
                period === p
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Chart */}
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={chartData}
            margin={{
              top: 5,
              right: 30,
              left: 20,
              bottom: 5,
            }}
          >
            <defs>
              <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={areaColor} stopOpacity={areaOpacity} />
                <stop offset="95%" stopColor={areaColor} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis
              dataKey="formattedTime"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: '#6b7280' }}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: '#6b7280' }}
              tickFormatter={(value) => `${value.toFixed(0)}`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="balance"
              stroke={lineColor}
              strokeWidth={2}
              fill="url(#colorBalance)"
              fillOpacity={1}
              dot={{
                fill: lineColor,
                strokeWidth: 2,
                r: 4
              }}
              activeDot={{
                r: 6,
                fill: lineColor,
                strokeWidth: 2,
                stroke: '#fff'
              }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Chart legend */}
      <div className="mt-4 text-xs text-gray-500 text-center">
        <p>💡 マウスをグラフの上に重ねると詳細な情報が表示されます</p>
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