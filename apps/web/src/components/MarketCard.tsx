import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { ja } from 'date-fns/locale';

interface Market {
  id: string;
  title: string;
  kpiDescription: string;
  deadline: Date;
  status: 'TRADING' | 'CLOSED' | 'RESOLVED';
  totalVolume: string;
  numProposals: number;
  topPrice: number;
}

interface MarketCardProps {
  market: Market;
}

export default function MarketCard({ market }: MarketCardProps) {
  const getStatusColor = (status: Market['status']) => {
    switch (status) {
      case 'TRADING':
        return 'bg-green-100 text-green-800';
      case 'CLOSED':
        return 'bg-yellow-100 text-yellow-800';
      case 'RESOLVED':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: Market['status']) => {
    switch (status) {
      case 'TRADING':
        return '取引中';
      case 'CLOSED':
        return '取引終了';
      case 'RESOLVED':
        return '解決済み';
      default:
        return '不明';
    }
  };

  const timeUntilDeadline = formatDistanceToNow(market.deadline, {
    addSuffix: true,
    locale: ja,
  });

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
              {market.title}
            </h3>
            <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(market.status)}`}>
              {getStatusText(market.status)}
            </span>
          </div>
        </div>

        {/* KPI Description */}
        <p className="text-sm text-gray-600 mb-4 line-clamp-3">
          {market.kpiDescription}
        </p>

        {/* Market Stats */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <div className="text-xs text-gray-500">取引量</div>
            <div className="font-semibold text-gray-900">{market.totalVolume}</div>
          </div>
          <div>
            <div className="text-xs text-gray-500">提案数</div>
            <div className="font-semibold text-gray-900">{market.numProposals}件</div>
          </div>
        </div>

        {/* Top Price */}
        <div className="mb-4">
          <div className="text-xs text-gray-500 mb-1">最高予測価格</div>
          <div className="flex items-center">
            <div className="text-2xl font-bold text-blue-600">
              {(market.topPrice * 100).toFixed(0)}%
            </div>
            <div className="ml-2 text-sm text-gray-500">信頼度</div>
          </div>
        </div>

        {/* Deadline */}
        <div className="mb-4">
          <div className="text-xs text-gray-500">締切</div>
          <div className="text-sm font-medium text-gray-900">
            {market.status === 'TRADING' ? timeUntilDeadline : '終了済み'}
          </div>
        </div>

        {/* Action Button */}
        <Link
          href={`/market/${market.id}`}
          className="block w-full bg-blue-600 text-white text-center py-2 px-4 rounded-md hover:bg-blue-700 transition-colors font-medium"
        >
          {market.status === 'TRADING' ? '参加する' : '詳細を見る'}
        </Link>
      </div>
    </div>
  );
}