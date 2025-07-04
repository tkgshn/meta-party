# META PARTY - Futarchy Prediction Market Platform

[![Production](https://img.shields.io/badge/Production-Live-green)](https://web-nqr7kd4vi-taka-shunsuke-takagis-projects.vercel.app)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-15-black)](https://nextjs.org/)
[![Polygon](https://img.shields.io/badge/Polygon-Amoy-purple)](https://polygon.technology/)

予測市場ベースのガバナンスシステム（Futarchy）の実装プラットフォーム。Play Tokenを使用した11の社会課題予測市場を提供。

## 🌐 Live Demo

**Production URL**: https://web-nqr7kd4vi-taka-shunsuke-takagis-projects.vercel.app

- MetaMaskで即座にPlay Token取得
- リアルタイム予測市場取引
- 完全な日本語UI対応

## 🏗️ プロジェクト構成

```
/
├── apps/web/           # Next.js 15 フロントエンド
├── packages/contracts/ # Solidity スマートコントラクト  
├── functions/          # Firebase Cloud Functions
└── ref/               # 参考資料・設計書
    ├── futarchy/      # Futarchy サブモジュール
    ├── Mirai-master-plan.md
    └── v0.md
```

## 🚀 クイックスタート

```bash
# 1. リポジトリのクローン（サブモジュール含む）
git clone --recurse-submodules https://github.com/tkgshn/meta-party.git
cd meta-party

# 2. 依存関係のインストール
npm install

# 3. 開発サーバー起動
npm run dev
```

**アクセス**:
- **ホームページ**: http://localhost:3000
- **ダッシュボード**: http://localhost:3000/dashboard  
- **管理画面**: http://localhost:3000/admin

## 💎 Play Token取得フロー

1. **MetaMask接続** → ワンクリック接続
2. **ネットワーク設定** → Polygon Amoy自動切り替え  
3. **テストPOL取得** → [Alchemy Faucet](https://www.alchemy.com/faucets/polygon-amoy)
4. **Play Token受け取り** → 1,000 PT 無料取得
5. **MetaMask追加** → 🦊ボタンで自動追加

## 📊 実装済み予測市場（11市場）

### 🏛️ 未来日本プロジェクト
1. **所得倍増：新産業育成イニシアチブ** 
2. **子育て先進国：出生率 1.6 への挑戦**
3. **社会保障再構築：捕捉率＋15% プロジェクト**
4. **立法オープン化：議案透明度 80% 目標**
5. **政治資金フルオープン：透明化率 90% への道**

### 🌍 社会課題マーケット  
6. **社会保障制度の捕捉率向上プロジェクト**
7. **デジタル政府サービス効率化**
8. **教育格差是正プログラム**
9. **環境エネルギー転換政策**
10. **スタートアップ支援プログラム**
11. **高齢者支援技術導入**

## 🔧 技術スタック

### Frontend
- **Next.js 15** (App Router)
- **TypeScript** (完全型安全)
- **Tailwind CSS v4** (モダンデザイン)
- **Recharts** (価格チャート)

### Blockchain  
- **Polygon Amoy** テストネット
- **PlayToken**: `0x237B9E4EEE4AeAf712B5B240Ab03C973310B6bD1`
- **MarketFactory**: `0x9f1C3f06B201FFa385a4BB3695f78cB1c17c12db`
- **ConditionalTokens**: `0x0416a4757062c1e61759ADDb6d68Af145919F045`

### Backend
- **Firebase** (認証・データベース)
- **Cloud Functions** (自動処理)

## 🎯 主要機能

### ✅ 完全実装済み
- **予測市場取引**: LMSR価格メカニズム
- **管理者ダッシュボード**: 市場作成・管理
- **リアルタイム価格**: ライブ更新
- **高度な検索・フィルタ**: カテゴリ・キーワード対応
- **レスポンシブデザイン**: モバイル完全対応
- **アクセシビリティ**: ARIA・キーボードナビゲーション

### 🧪 テスト環境
- **Jest**: 40+ 包括的テスト
- **t-wada原則**: 境界値・エッジケース対応

## 📁 詳細ドキュメント

- **[vibe.md](./vibe.md)**: プロジェクト概要・セットアップガイド
- **[CLAUDE.md](./CLAUDE.md)**: 開発者向け技術仕様
- **[ref/Mirai-master-plan.md](./ref/Mirai-master-plan.md)**: 設計思想
- **[ref/v0.md](./ref/v0.md)**: 初期仕様

## 🔮 Futarchyとは？

**Futarchy** = **Prediction Markets** + **Governance**

1. **予測市場**: 未来の出来事に投票・取引
2. **意思決定**: 市場価格が政策の成功確率を反映  
3. **実行**: 高確率政策を自動採用

→ **集合知による最適な意思決定システム**

## 🛠️ 開発コマンド

```bash
# 全体ビルド
npm run build

# テスト実行  
npm run test

# リント
npm run lint

# スマートコントラクト（packages/contracts/）
cd packages/contracts
npm run deploy:testnet

# Firebase Functions（functions/）
cd functions  
npm run serve    # ローカル
npm run deploy   # デプロイ
```

## サブモジュール管理

```bash
# サブモジュール初期化（既存クローンの場合）
git submodule update --init --recursive

# サブモジュール更新
git submodule update --remote
```

## 🤝 貢献方法

1. Fork & Clone
2. Feature ブランチ作成
3. 変更実装 & テスト
4. Pull Request作成

## 📄 ライセンス

MIT License - 詳細は [LICENSE](./LICENSE) を参照

---

**🎯 質問・バグ報告は [Issues](https://github.com/tkgshn/meta-party/issues) まで！**
