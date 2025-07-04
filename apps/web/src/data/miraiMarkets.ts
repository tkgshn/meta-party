/* ───── miraiMarkets.ts ───── */

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
  {
    id: 'mirai-1',
    title: '所得倍増：新産業育成イニシアチブ',
    kpiDescription:
      '2029年末までに国民一人あたり可処分所得中央値を2024年比で2倍にできるか？',
    deadline: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // 60日後
    createdAt: new Date(),
    status: 'TRADING' as const,
    category: 'economy',
    totalVolume: 4200,
    numProposals: 3, // 例：①AI特区 ②グリーン水素クラスター ③Web3税制
    participants: 121,
    topPrice: 0.47,
    change24h: 0.04,
    tags: ['産業育成', '所得倍増', '成長戦略'],
    featured: true,
    liquidity: 9000,
    priceHistory: generatePriceHistory(0.47),
  },

  /** ２．世界一の「子育て先進国」計画 */
  {
    id: 'mirai-2',
    title: '子育て先進国：出生率 1.6 への挑戦',
    kpiDescription:
      '2030年の合計特殊出生率を 1.60 以上に押し上げられるか？',
    deadline: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
    createdAt: new Date(),
    status: 'TRADING' as const,
    category: 'childcare',
    totalVolume: 3750,
    numProposals: 4, // 例：給付金拡充／幼保無償化DX／育休給付100%／住宅支援
    participants: 88,
    topPrice: 0.39,
    change24h: -0.02,
    tags: ['少子化対策', '家族政策', '福祉'],
    featured: false,
    liquidity: 6800,
    priceHistory: generatePriceHistory(0.39),
  },

  /** ３．税・社会保障制度の未来志向再構築 */
  {
    id: 'mirai-3',
    title: '社会保障再構築：捕捉率＋15% プロジェクト',
    kpiDescription:
      '社会保障制度の捕捉率を 2024年比で 15% 向上できるか？',
    deadline: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
    createdAt: new Date(),
    status: 'TRADING' as const,
    category: 'social',
    totalVolume: 5120,
    numProposals: 3, // 例：マイナポータル連携／給与リアルタイム課税／逆進性改革
    participants: 142,
    topPrice: 0.58,
    change24h: 0.07,
    tags: ['税制改革', '社会保障', 'デジタルID'],
    featured: true,
    liquidity: 7900,
    priceHistory: generatePriceHistory(0.58),
  },

  /** ４．立法プロセスの「見える化」 */
  {
    id: 'mirai-4',
    title: '立法オープン化：議案透明度 80% 目標',
    kpiDescription:
      '2027年までに提出法案の 80% 以上がオンライン審議ログを公開できるか？',
    deadline: new Date(Date.now() + 75 * 24 * 60 * 60 * 1000),
    createdAt: new Date(),
    status: 'TRADING' as const,
    category: 'governance',
    totalVolume: 2890,
    numProposals: 2, // 例：AI議事録自動公開／熟議プラットフォーム
    participants: 67,
    topPrice: 0.46,
    change24h: 0.03,
    tags: ['デジタル民主主義', '議会透明化', 'GovTech'],
    featured: false,
    liquidity: 5400,
    priceHistory: generatePriceHistory(0.46),
  },

  /** ５．「政治とカネ」問題の終止符 */
  {
    id: 'mirai-5',
    title: '政治資金フルオープン：透明化率 90% への道',
    kpiDescription:
      '全国会議員の政治資金収支をリアルタイムで 90% 以上公開できるか？',
    deadline: new Date(Date.now() + 120 * 24 * 60 * 60 * 1000),
    createdAt: new Date(),
    status: 'TRADING' as const,
    category: 'integrity',
    totalVolume: 3330,
    numProposals: 3, // 例：ブロックチェーン台帳／即時電子開示義務／QRレシート
    participants: 104,
    topPrice: 0.41,
    change24h: -0.01,
    tags: ['政治資金', '透明化', '腐敗防止'],
    featured: true,
    liquidity: 7200,
    priceHistory: generatePriceHistory(0.41),
  },
] as const;