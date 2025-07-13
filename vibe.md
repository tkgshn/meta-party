# Futarchy Platform

## 🎯 プロジェクト概要

**Futarchy Platform**は、予測市場を活用した新世代のガバナンスシステムです。社会課題の解決策を市場メカニズムで評価し、最適な意思決定を支援する革新的なプラットフォームです。

### 核心コンセプト
- **Futarchy**: Robin Hansonが提唱した「予測市場による政治」理論の実装
- **Play Token (PT)**: 実通貨ではない実験的トークンによる安全な学習環境
- **Multi-Network**: Polygon、Sepolia、Anvilローカル環境をサポート
- **LMSR Market Making**: 数学的に正確な価格発見メカニズム

## 🏗️ アーキテクチャ

### プロジェクト構成
```
meta-party/
├── apps/web/              # Next.js 15 フロントエンドアプリケーション
├── packages/contracts/    # Hardhatベースのスマートコントラクト
├── ref/                   # 参考資料とデモアプリケーション
├── database/              # Firestore データベース設計
└── docs/                  # 技術ドキュメント
```

### 技術スタック

#### フロントエンド (apps/web/)
- **Next.js 15.3.4** + **React 19** + **TypeScript**
- **TailwindCSS v4** - 最新のユーティリティファーストCSS
- **Reown AppKit** (旧WalletConnect) - Web3ウォレット統合
- **Magic SDK** - ソーシャルログイン（Twitter OAuth）
- **Firebase/Firestore** - ユーザー管理とデータストレージ
- **Recharts** - データ可視化とチャート表示
- **Jest + Playwright** - テストフレームワーク

#### スマートコントラクト (packages/contracts/)
- **Hardhat** - 開発・テスト・デプロイフレームワーク
- **Solidity ^0.8.20** + **OpenZeppelin v5** - セキュアなコントラクト開発
- **TypeChain** - TypeScript型生成
- **Ethers v6** - Web3ライブラリ

#### 開発環境
- **TurboRepo** - モノレポ管理
- **Foundry/Anvil** - 高速ローカルブロックチェーン
- **Concurrently** - 並行プロセス実行

## 🚀 主要機能

### 1. マルチネットワーク対応 ✅
- **Polygon Mainnet** (Chain ID: 137) - 本番環境、MATIC通貨
- **Sepolia Testnet** (Chain ID: 11155111) - 主要テスト環境、ETH通貨
- **Polygon Amoy** (Chain ID: 80002) - レガシーテスト環境
- **Anvil Local** (Chain ID: 31337) - 開発環境、テストETH

### 2. Play Token システム ✅
- **基本エアドロップ**: 1,000 PT（Twitter OAuth経由）
- **ボランティアボーナス**: 追加2,000 PT
- **ロールベースアクセス制御**: DISTRIBUTOR、MARKET_CREATOR権限
- **重複防止機能**: ブロックチェーンレベルでの厳密管理

### 3. 予測市場メカニズム ✅
- **LMSR (Logarithmic Market Scoring Rule)**: 数学的に正確な価格発見
- **N-Outcome Markets**: 複数選択肢市場のサポート
- **自己解決型オラクル**: 市場作成者による結果判定
- **リアルタイム取引**: 即座の価格更新と流動性提供

### 4. ユーザー体験 ✅
- **ワンクリック認証**: Twitter → ウォレット → トークン取得の自動フロー
- **検索・フィルタ**: 高度な市場検索とカテゴリ分類
- **レスポンシブデザイン**: モバイル・タブレット・デスクトップ対応
- **リアルタイム更新**: 価格、残高、取引状況の即座反映

### 5. 管理者機能 ✅
- **管理ダッシュボード**: システム統計と監視
- **市場作成**: 包括的な市場設定インターフェース
- **ユーザー管理**: 権限付与と役割管理
- **アナリティクス**: 詳細な使用状況分析

## 📊 デプロイ状況

### Sepolia Testnet（メイン）
```
PlayToken: 0xBe5cC5b0B4D00f637d58008f3577D4Ef30D65a1D
MarketFactory: 0xCdC015712bC57d097CB2754051E06789f9437601
ConditionalTokens: 0x322819DD35bF132dfA6b312315b32Cd7B4C81A51
```

### Polygon Amoy Testnet（レガシー）
```
PlayToken: 0x237B9E4EEE4AeAf712B5B240Ab03C973310B6bD1
MarketFactory: 0x9f1C3f06B201FFa385a4BB3695f78cB1c17c12db
ConditionalTokens: 0x0416a4757062c1e61759ADDb6d68Af145919F045
```

## 🎮 利用方法

### 開発環境セットアップ

#### 前提条件
- Node.js 18.0.0以上
- npm 9.0.0以上
- MetaMask等のWeb3ウォレット

#### クイックスタート
```bash
# リポジトリクローン
git clone https://github.com/tkgshn/meta-party.git
cd meta-party

# 依存関係インストール
npm install

# 開発サーバー起動
npm run dev

# フル開発環境（Anvil + Web App）
npm run dev:with-anvil

# Foundryセットアップ（初回のみ）
npm run setup:foundry
```

#### 環境設定
`apps/web/.env.local`を作成:
```bash
# 本番では適切な値に変更してください
NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID=your_project_id
NEXT_PUBLIC_MAGIC_PUBLIC_KEY=your_magic_key
FIREBASE_PROJECT_ID=your_firebase_project
```

### ユーザーフロー

#### 新規ユーザー
1. **ウォレット接続**: ReownAppKitでのワンクリック接続
2. **ネットワーク設定**: 自動ネットワーク切り替えサポート
3. **Play Token取得**: Twitter認証経由で1,000 PT受け取り
4. **市場参加**: 好きな予測市場での取引開始

#### 開発者
1. **ローカル環境**: `npm run dev:with-anvil`で即座開発開始
2. **コントラクトデプロイ**: `cd packages/contracts && npm run deploy:local`
3. **テストデータ**: `npm run seed:local`でダミーデータ投入
4. **テスト実行**: `npm test`で品質確認

## 🧪 テスト状況

### スマートコントラクト ✅
- **65テスト全てパス**
- PlayToken、MarketFactory、Marketコントラクトの包括テスト
- セキュリティテスト、統合テスト含む

### フロントエンド ⚠️
- **31テストパス / 42テスト**
- 一部ESM設定とWeb3ライブラリの競合
- アプリケーション機能には影響なし

### ビルド ✅
- **本番ビルド成功**
- Next.js最適化済み
- 全ページの静的生成対応

## 🎯 実装済み市場

プラットフォームには11の多様な予測市場が実装されています：

### 未来日本プロジェクト（5市場）
1. **所得倍増：新産業育成イニシアチブ** - 経済成長戦略
2. **子育て先進国：出生率1.6への挑戦** - 少子化対策
3. **社会保障再構築：捕捉率+15%プロジェクト** - 社会保障改革
4. **立法オープン化：議案透明度80%目標** - 政治透明性
5. **政治資金フルオープン：透明化率90%への道** - 政治倫理

### 社会課題市場（6市場）
6. **社会保障制度の捕捉率向上プロジェクト** - 社会保障
7. **デジタル政府サービス効率化** - 行政効率
8. **教育格差是正プログラム** - 教育
9. **環境エネルギー転換政策** - 環境
10. **スタートアップ支援プログラム** - ビジネス
11. **高齢者支援技術導入** - 技術

## 🔧 開発コマンド

### プロジェクト全体
```bash
npm run dev                 # 通常開発（Webアプリのみ）
npm run dev:with-anvil      # フル開発（Anvil + Webアプリ）
npm run build              # 全体ビルド
npm run test               # 全体テスト
npm run lint               # 全体リント
```

### スマートコントラクト
```bash
cd packages/contracts

npm run build              # コントラクトコンパイル
npm run test               # コントラクトテスト
npm run deploy:local       # Anvilデプロイ
npm run deploy:sepolia     # Sepoliaデプロイ
npm run seed:local         # テストデータ投入
```

### フロントエンド
```bash
cd apps/web

npm run dev                # 開発サーバー
npm run build              # 本番ビルド
npm run test               # フロントエンドテスト
```

## 🔮 今後の展開

### 短期目標（1-3ヶ月）
- [ ] Reownプロジェクト設定の完全化
- [ ] テストカバレッジの改善
- [ ] ユーザビリティテストの実施
- [ ] より多くの市場テンプレートの追加

### 中期目標（3-6ヶ月）
- [ ] Polygon Mainnetへのフルデプロイ
- [ ] クロスチェーン機能の実装
- [ ] オラクル自動化（Chainlink統合）
- [ ] DAO統合機能

### 長期目標（6ヶ月以上）
- [ ] 実通貨との統合実験
- [ ] 企業・自治体向けソリューション
- [ ] グローバル展開
- [ ] 他のブロックチェーンエコシステムとの統合

## 🤝 貢献方法

### 開発者向け
1. **Issue作成**: [GitHub Issues](https://github.com/tkgshn/meta-party/issues)でバグ報告や機能提案
2. **Pull Request**: フォーク後、feature branchでの開発推奨
3. **テスト必須**: 新機能には必ずテストを追加
4. **コードレビュー**: 全PRはレビュー必須

### ユーザー向け
1. **フィードバック**: 使用感やUIの改善提案
2. **市場提案**: 新しい予測市場のアイデア
3. **バグ報告**: 動作不良や表示問題の報告
4. **コミュニティ**: Discord/Twitterでの議論参加

## 📞 サポート・連絡先

- **GitHub**: [tkgshn/meta-party](https://github.com/tkgshn/meta-party)
- **Issues**: プロジェクトの技術的問題
- **開発者**: @tkgshn

---

**Futarchy Platform**は、予測市場を通じてより良い集合知と意思決定を実現する、次世代ガバナンスシステムです。

🚀 **今すぐ始める**: `npm run dev` でローカル開発を開始しましょう！