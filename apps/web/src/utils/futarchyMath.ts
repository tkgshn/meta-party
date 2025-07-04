/**
 * 🚩 Futarchy Math - n-outcome market価格メカニズム
 * 
 * Based on the specification:
 * - n-outcome market：各アウトカムごとに「勝てば 1 PT」Yes トークンを発行
 * - フルセット裁定を許可→ Yes 価格の総和が 1 に近づき、そのまま確率表示
 * - No トークンは `1 − YesPrice` で自動組成
 * - 決着時：勝者 Yes＝1 PT、敗者 Yes＝0、逆に敗者 No＝1 PT、勝者 No＝0 で償還
 * - ユーザ PnL は **払った価格 vs 1 PT** の差分で自動計算
 * 
 * NOTE: Advanced features like FullSetMintBurn and MarketResolution components
 * are available in the codebase but hidden from the main UI for simplicity.
 * These can be enabled for advanced users or admin interfaces.
 */

export interface OutcomeToken {
  id: string;
  name: string;
  yesPrice: number;    // 0-1 の確率値
  noPrice: number;     // 1 - yesPrice (理論値)
  actualNoPrice: number; // 実際の No トークン価格（スプレッド含む）
}

export interface MarketState {
  outcomes: OutcomeToken[];
  totalYesPriceSum: number;
  isArbitrageOpportunity: boolean;
  fullSetCost: number; // 常に 1 PT
}

/**
 * 🚩フルセット・ミント／バーン
 * mintFullSet(): user pays 1 PT to escrow, for i in 1..n: mint 1 YES_i to user
 * redeemFullSet(): require 1 YES_i for all i, burn all YES_i, send 1 PT back to user
 */
export const mintFullSet = (n: number): { cost: number; tokensReceived: number } => {
  return {
    cost: 1, // 1 PT
    tokensReceived: n // n 枚の YES トークン
  };
};

export const redeemFullSet = (yesTokens: number[]): { ptReturned: number; success: boolean } => {
  // 各アウトカムの YES トークンを 1 枚ずつ持っているかチェック
  const hasFullSet = yesTokens.every(amount => amount >= 1);
  
  return {
    ptReturned: hasFullSet ? 1 : 0,
    success: hasFullSet
  };
};

/**
 * 🚩裁定条件による価格収束メカニズム
 * 和 ( Σ YESPrice_i ) > 1 → ユーザは `mintFullSet → 市場で売却` し利ざや
 * 和 < 1 → `市場で買い集め → redeemFullSet` で利ざや
 * ⇒ 自然に **Σ YESPrice_i ≈ 1** へ収束
 */
export const calculateArbitrageOpportunity = (outcomes: OutcomeToken[]): {
  totalYesSum: number;
  opportunity: 'mint_and_sell' | 'buy_and_redeem' | 'none';
  profitPotential: number;
} => {
  const totalYesSum = outcomes.reduce((sum, outcome) => sum + outcome.yesPrice, 0);
  
  if (totalYesSum > 1.001) { // 0.1% 以上のずれがある場合のみ裁定機会と判断
    return {
      totalYesSum,
      opportunity: 'mint_and_sell',
      profitPotential: totalYesSum - 1
    };
  } else if (totalYesSum < 0.999) {
    return {
      totalYesSum,
      opportunity: 'buy_and_redeem',
      profitPotential: 1 - totalYesSum
    };
  }
  
  return {
    totalYesSum,
    opportunity: 'none',
    profitPotential: 0
  };
};

/**
 * 🚩価格メカニズム（板取引 or AMM 共通概念）
 * YES トークン: 表示確率_i = YESPrice_i (0–1 で表示)
 * NO トークン: 理論値 NOPrice_i* = 1 − YESPrice_i, 実際表示 NOPrice_i = NOPrice_i* ± spread
 */
export const calculateTokenPrices = (
  outcomes: { id: string; name: string; probability: number }[],
  spread: number = 0.01 // 1% スプレッド
): OutcomeToken[] => {
  // 確率の正規化（合計が 1 になるように調整）
  const totalProbability = outcomes.reduce((sum, outcome) => sum + outcome.probability, 0);
  
  return outcomes.map(outcome => {
    const normalizedYesPrice = outcome.probability / totalProbability;
    const theoreticalNoPrice = 1 - normalizedYesPrice;
    
    return {
      id: outcome.id,
      name: outcome.name,
      yesPrice: normalizedYesPrice,
      noPrice: theoreticalNoPrice,
      actualNoPrice: theoreticalNoPrice + spread / 2 // スプレッドを加味
    };
  });
};

/**
 * 🚩取引コスト・ペイアウト
 * buyYES_i(amount): cost = amount * YESPrice_i, pnl = +amount * (1 - YESPrice_i) if outcome i wins else -cost
 * buyNO_i(amount): cost = amount * NOPrice_i, pnl = +amount * (1 - NOPrice_i) if outcome i loses else -cost
 */
export const calculateTradeCost = (
  amount: number,
  tokenType: 'yes' | 'no',
  outcome: OutcomeToken
): {
  cost: number;
  potentialPayout: number;
  profitIfWin: number;
  lossIfLose: number;
} => {
  const price = tokenType === 'yes' ? outcome.yesPrice : outcome.actualNoPrice;
  const cost = amount * price;
  
  let potentialPayout: number;
  let profitIfWin: number;
  
  if (tokenType === 'yes') {
    // YES トークンの場合：勝利時に 1 PT で償還
    potentialPayout = amount * 1; // 1 PT per token
    profitIfWin = potentialPayout - cost;
  } else {
    // NO トークンの場合：そのアウトカムが負けた時に 1 PT で償還
    potentialPayout = amount * 1; // 1 PT per token
    profitIfWin = potentialPayout - cost;
  }
  
  return {
    cost,
    potentialPayout,
    profitIfWin,
    lossIfLose: -cost
  };
};

/**
 * 🚩決着フロー
 * resolve(winnerIndex): 勝者 Yes＝1 PT、敗者 Yes＝0、逆に敗者 No＝1 PT、勝者 No＝0 で償還
 */
export const resolveMarket = (
  winnerIndex: number,
  userHoldings: { yesTokens: number[]; noTokens: number[] }
): {
  totalPayout: number;
  yesTokenPayouts: number[];
  noTokenPayouts: number[];
} => {
  const yesTokenPayouts = userHoldings.yesTokens.map((amount, index) => {
    return index === winnerIndex ? amount * 1 : 0; // 勝者の YES トークンは 1 PT で償還
  });
  
  const noTokenPayouts = userHoldings.noTokens.map((amount, index) => {
    return index !== winnerIndex ? amount * 1 : 0; // 敗者の NO トークンは 1 PT で償還
  });
  
  const totalPayout = yesTokenPayouts.reduce((sum, payout) => sum + payout, 0) +
                     noTokenPayouts.reduce((sum, payout) => sum + payout, 0);
  
  return {
    totalPayout,
    yesTokenPayouts,
    noTokenPayouts
  };
};

/**
 * 🚩マーケット状態の更新
 * 新しい価格データに基づいてマーケット状態を計算
 */
export const updateMarketState = (
  outcomes: { id: string; name: string; probability: number }[],
  spread: number = 0.01
): MarketState => {
  const tokenPrices = calculateTokenPrices(outcomes, spread);
  const arbitrageInfo = calculateArbitrageOpportunity(tokenPrices);
  
  return {
    outcomes: tokenPrices,
    totalYesPriceSum: arbitrageInfo.totalYesSum,
    isArbitrageOpportunity: arbitrageInfo.opportunity !== 'none',
    fullSetCost: 1
  };
};

/**
 * 🚩オッズ計算
 * 確率から倍率を計算（例：40% → 2.5倍）
 */
export const calculateOdds = (probability: number): number => {
  return 1 / probability;
};

/**
 * 🚩利益率計算
 * 支払った価格に対する利益率を計算
 */
export const calculateProfitMargin = (
  purchasePrice: number,
  tokenType: 'yes' | 'no',
  outcome: OutcomeToken
): number => {
  const payoutValue = 1; // 勝利時は必ず 1 PT
  return ((payoutValue - purchasePrice) / purchasePrice) * 100;
};