/* ───── miraiMarkets.ts ───── */

export interface Proposal {
  id: string;
  name: string;
  description: string;
  price: number;
  volume: number;
  change24h: number;
  supporters: number;
}

export interface Market {
  id: string;
  title: string;
  kpiDescription: string;
  deadline: Date;
  createdAt: Date;
  status: 'TRADING' | 'CLOSED';
  category: string;
  totalVolume: number;
  numProposals: number;
  participants: number;
  topPrice: number;
  change24h: number;
  tags: string[];
  featured: boolean;
  liquidity: number;
  priceHistory: Array<{
    time: string;
    price: number;
  }>;
  proposals?: Proposal[];
}

// Generate mock price history data
const generatePriceHistory = (currentPrice: number, days: number = 7) => {
  const history = [];
  for (let i = days; i >= 0; i--) {
    const variation = (Math.random() - 0.5) * 0.1;
    const price = Math.max(0.05, Math.min(0.95, currentPrice + variation));
    history.push({
      time: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString(),
      price: price
    });
  }
  return history;
};

export const miraiMarkets = [
  /** １．新産業育成による所得倍増 */
  // {
  //   id: 'mirai-1',
  //   title: '所得倍増：新産業育成イニシアチブ',
  //   kpiDescription:
  //     '2029年末までに国民一人あたり可処分所得中央値を2024年比で2倍にできるか？',
  //   deadline: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // 60日後
  //   createdAt: new Date(),
  //   status: 'TRADING' as const,
  //   category: 'economy',
  //   totalVolume: 4200,
  //   numProposals: 3, // 例：①AI特区 ②グリーン水素クラスター ③Web3税制
  //   participants: 121,
  //   topPrice: 0.47,
  //   change24h: 0.04,
  //   tags: ['産業育成', '所得倍増', '成長戦略'],
  //   featured: true,
  //   liquidity: 9000,
  //   priceHistory: generatePriceHistory(0.47),
  // },

  // /** ２．世界一の「子育て先進国」計画 */
  // {
  //   id: 'mirai-2',
  //   title: '子育て先進国：出生率 1.6 への挑戦',
  //   kpiDescription:
  //     '2030年の合計特殊出生率を 1.60 以上に押し上げられるか？',
  //   deadline: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
  //   createdAt: new Date(),
  //   status: 'TRADING' as const,
  //   category: 'childcare',
  //   totalVolume: 3750,
  //   numProposals: 4, // 例：給付金拡充／幼保無償化DX／育休給付100%／住宅支援
  //   participants: 88,
  //   topPrice: 0.39,
  //   change24h: -0.02,
  //   tags: ['少子化対策', '家族政策', '福祉'],
  //   featured: false,
  //   liquidity: 6800,
  //   priceHistory: generatePriceHistory(0.39),
  // },

  // /** ３．税・社会保障制度の未来志向再構築 */
  // {
  //   id: 'mirai-3',
  //   title: '社会保障再構築：捕捉率＋15% プロジェクト',
  //   kpiDescription:
  //     '社会保障制度の捕捉率を 2024年比で 15% 向上できるか？',
  //   deadline: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
  //   createdAt: new Date(),
  //   status: 'TRADING' as const,
  //   category: 'social',
  //   totalVolume: 5120,
  //   numProposals: 3, // 例：マイナポータル連携／給与リアルタイム課税／逆進性改革
  //   participants: 142,
  //   topPrice: 0.58,
  //   change24h: 0.07,
  //   tags: ['税制改革', '社会保障', 'デジタルID'],
  //   featured: true,
  //   liquidity: 7900,
  //   priceHistory: generatePriceHistory(0.58),
  // },

  // /** ４．立法プロセスの「見える化」 */
  // {
  //   id: 'mirai-4',
  //   title: '立法オープン化：議案透明度 80% 目標',
  //   kpiDescription:
  //     '2027年までに提出法案の 80% 以上がオンライン審議ログを公開できるか？',
  //   deadline: new Date(Date.now() + 75 * 24 * 60 * 60 * 1000),
  //   createdAt: new Date(),
  //   status: 'TRADING' as const,
  //   category: 'governance',
  //   totalVolume: 2890,
  //   numProposals: 2, // 例：AI議事録自動公開／熟議プラットフォーム
  //   participants: 67,
  //   topPrice: 0.46,
  //   change24h: 0.03,
  //   tags: ['デジタル民主主義', '議会透明化', 'GovTech'],
  //   featured: false,
  //   liquidity: 5400,
  //   priceHistory: generatePriceHistory(0.46),
  // },

  // /** ５．「政治とカネ」問題の終止符 */
  // {
  //   id: 'mirai-5',
  //   title: '政治資金フルオープン：透明化率 90% への道',
  //   kpiDescription:
  //     '全国会議員の政治資金収支をリアルタイムで 90% 以上公開できるか？',
  //   deadline: new Date(Date.now() + 120 * 24 * 60 * 60 * 1000),
  //   createdAt: new Date(),
  //   status: 'TRADING' as const,
  //   category: 'integrity',
  //   totalVolume: 3330,
  //   numProposals: 3, // 例：ブロックチェーン台帳／即時電子開示義務／QRレシート
  //   participants: 104,
  //   topPrice: 0.41,
  //   change24h: -0.01,
  //   tags: ['政治資金', '透明化', '腐敗防止'],
  //   featured: true,
  //   liquidity: 7200,
  //   priceHistory: generatePriceHistory(0.41),
  // },

  /** ６．社会保障制度の捕捉率向上プロジェクト */
  {
    id: 'mirai-6',
    title: '予算1億円で、社会保障制度の捕捉率を10%上げる',
    kpiDescription: '社会保障制度の対象だが、抜け漏れている人たちの捕捉率を10%向上させることができるか？',
    deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
    status: 'TRADING' as const,
    category: 'social',
    totalVolume: 5240,
    numProposals: 3,
    participants: 156,
    topPrice: 0.65,
    change24h: 0.08,
    tags: ['社会保障', '格差是正', '政策', '効率化'],
    featured: true,
    liquidity: 8500,
    priceHistory: generatePriceHistory(0.65),
    proposals: [
      {
        id: 'civichat',
        name: 'civichat',
        description: 'チャットボットによる市民とのコミュニケーション改善で制度周知を強化',
        price: 0.35,
        volume: 1820,
        change24h: 0.12,
        supporters: 62
      },
      {
        id: 'askoe',
        name: 'アスコエ',
        description: 'デジタル窓口統合により申請手続きの簡素化と自動判定システム構築',
        price: 0.42,
        volume: 2150,
        change24h: 0.08,
        supporters: 73
      },
      {
        id: 'graffer',
        name: 'graffer',
        description: 'データ分析プラットフォームによる対象者の能動的発見と支援',
        price: 0.23,
        volume: 1270,
        change24h: -0.04,
        supporters: 41
      }
    ]
  },

  /** ７．チームみらい政党要件達成予測市場 */
  {
    id: 'mirai-7',
    title: 'チームみらいが2025年8月31日までに政党要件を満たす',
    kpiDescription: '「チームみらい」が2025年8月31日までに政治資金規正法第3条に規定する政党要件（所属国会議員5名以上または直近の衆参選挙で全国得票率2%以上）を満たすことができるか？',
    deadline: new Date('2025-08-31T23:59:59'),
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    status: 'TRADING' as const,
    category: 'government',
    totalVolume: 3420,
    numProposals: 0, // YES/NO市場なのでproposalsなし
    participants: 89,
    topPrice: 0.34, // YES の確率
    change24h: 0.12,
    tags: ['政治', '政党', 'チームみらい', '政党要件'],
    featured: true,
    liquidity: 6800,
    priceHistory: generatePriceHistory(0.34, 14) // 2週間分のデータ
  },

  // /** ７．デジタル政府サービス効率化 */
  // {
  //   id: 'mirai-7',
  //   title: 'デジタル政府サービス効率化',
  //   kpiDescription: '行政手続きのデジタル化により、処理時間を30%短縮できるか？',
  //   deadline: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
  //   createdAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000),
  //   status: 'TRADING' as const,
  //   category: 'government',
  //   totalVolume: 3840,
  //   numProposals: 5,
  //   participants: 89,
  //   topPrice: 0.42,
  //   change24h: -0.05,
  //   tags: ['デジタル化', '行政', 'DX', '効率化'],
  //   featured: false,
  //   liquidity: 6200,
  //   priceHistory: generatePriceHistory(0.42)
  // },

  // /** ８．教育格差是正プログラム */
  // {
  //   id: 'mirai-8',
  //   title: '教育格差是正プログラム',
  //   kpiDescription: '低所得世帯の子どもの学力向上により、格差指標を15%改善できるか？',
  //   deadline: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
  //   createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
  //   status: 'CLOSED' as const,
  //   category: 'education',
  //   totalVolume: 8960,
  //   numProposals: 4,
  //   participants: 234,
  //   topPrice: 0.78,
  //   change24h: 0.12,
  //   tags: ['教育', '格差是正', '学力向上', '社会課題'],
  //   featured: true,
  //   liquidity: 4500,
  //   priceHistory: generatePriceHistory(0.78)
  // },

  // /** ９．環境エネルギー転換政策 */
  // {
  //   id: 'mirai-9',
  //   title: '環境エネルギー転換政策',
  //   kpiDescription: '再生可能エネルギーの導入により、CO2排出量を25%削減できるか？',
  //   deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
  //   createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
  //   status: 'TRADING' as const,
  //   category: 'environment',
  //   totalVolume: 12500,
  //   numProposals: 8,
  //   participants: 412,
  //   topPrice: 0.55,
  //   change24h: 0.15,
  //   tags: ['環境', 'エネルギー', '気候変動', '持続可能性'],
  //   featured: true,
  //   liquidity: 15200,
  //   priceHistory: generatePriceHistory(0.55)
  // },

  // /** １０．スタートアップ支援プログラム */
  // {
  //   id: 'mirai-10',
  //   title: 'スタートアップ支援プログラム',
  //   kpiDescription: '新規事業支援により、地域の雇用を20%増加させることができるか？',
  //   deadline: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
  //   createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
  //   status: 'TRADING' as const,
  //   category: 'business',
  //   totalVolume: 6750,
  //   numProposals: 6,
  //   participants: 178,
  //   topPrice: 0.38,
  //   change24h: -0.03,
  //   tags: ['起業支援', '雇用創出', '地域活性化', '経済'],
  //   featured: false,
  //   liquidity: 9800,
  //   priceHistory: generatePriceHistory(0.38)
  // },

  // /** １１．高齢者支援技術導入 */
  // {
  //   id: 'mirai-11',
  //   title: '高齢者支援技術導入',
  //   kpiDescription: 'AIを活用した高齢者見守りシステムにより、事故を30%減少させることができるか？',
  //   deadline: new Date(Date.now() + 18 * 24 * 60 * 60 * 1000),
  //   createdAt: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000),
  //   status: 'TRADING' as const,
  //   category: 'technology',
  //   totalVolume: 4320,
  //   numProposals: 2,
  //   participants: 95,
  //   topPrice: 0.71,
  //   change24h: 0.06,
  //   tags: ['AI', '高齢者支援', '安全', '技術'],
  //   featured: false,
  //   liquidity: 5600,
  //   priceHistory: generatePriceHistory(0.71)
  // },

  // /** １２．地域創生イノベーション */
  // {
  //   id: 'mirai-12',
  //   title: '地域創生イノベーション：人口減少地域の活性化',
  //   kpiDescription: '人口減少が進む地方都市において、新技術導入により地域活性化指標を25%向上できるか？',
  //   deadline: new Date(Date.now() + 35 * 24 * 60 * 60 * 1000),
  //   createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
  //   status: 'TRADING' as const,
  //   category: 'government',
  //   totalVolume: 7800,
  //   numProposals: 5,
  //   participants: 203,
  //   topPrice: 0.44,
  //   change24h: 0.02,
  //   tags: ['地域創生', 'イノベーション', '人口問題', '地方活性化'],
  //   featured: false,
  //   liquidity: 11200,
  //   priceHistory: generatePriceHistory(0.44)
  // },

  // /** １３．次世代教育DXプラットフォーム */
  // {
  //   id: 'mirai-13',
  //   title: '次世代教育DXプラットフォーム：学習効果最大化',
  //   kpiDescription: 'AI個別最適化学習システムにより、全国の学習効果を平均20%向上させることができるか？',
  //   deadline: new Date(Date.now() + 80 * 24 * 60 * 60 * 1000),
  //   createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
  //   status: 'TRADING' as const,
  //   category: 'education',
  //   totalVolume: 9300,
  //   numProposals: 6,
  //   participants: 287,
  //   topPrice: 0.73,
  //   change24h: 0.11,
  //   tags: ['AI教育', 'DX', '個別最適化', '学習効果'],
  //   featured: true,
  //   liquidity: 13600,
  //   priceHistory: generatePriceHistory(0.73)
  // },

  // /** １４．サステナブル産業転換 */
  // {
  //   id: 'mirai-14',
  //   title: 'サステナブル産業転換：炭素中立経済への移行',
  //   kpiDescription: '2030年までに主要産業の80%が炭素中立型ビジネスモデルに転換できるか？',
  //   deadline: new Date(Date.now() + 150 * 24 * 60 * 60 * 1000),
  //   createdAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000),
  //   status: 'TRADING' as const,
  //   category: 'environment',
  //   totalVolume: 15600,
  //   numProposals: 9,
  //   participants: 445,
  //   topPrice: 0.56,
  //   change24h: 0.08,
  //   tags: ['脱炭素', '産業転換', 'サステナブル', '気候変動'],
  //   featured: true,
  //   liquidity: 18900,
  //   priceHistory: generatePriceHistory(0.56)
  // },

  // /** １５．医療・介護統合システム */
  // {
  //   id: 'mirai-15',
  //   title: '医療・介護統合システム：超高齢社会対応',
  //   kpiDescription: 'AIとIoT技術により、医療・介護の効率性と質を同時に30%向上できるか？',
  //   deadline: new Date(Date.now() + 95 * 24 * 60 * 60 * 1000),
  //   createdAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
  //   status: 'TRADING' as const,
  //   category: 'technology',
  //   totalVolume: 11400,
  //   numProposals: 7,
  //   participants: 329,
  //   topPrice: 0.68,
  //   change24h: 0.04,
  //   tags: ['医療DX', '介護', 'AI', 'IoT', '超高齢社会'],
  //   featured: false,
  //   liquidity: 14800,
  //   priceHistory: generatePriceHistory(0.68)
  // }
] as const;
