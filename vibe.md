# META PARTY - プロジェクトガイド

## 🎯 このプロジェクトは何？

META PARTYは「Futarchy（フューターキー）」という予測市場ベースのガバナンスシステムです。簡単に言うと：

1. **予測市場**: 未来の出来事について、お金を賭けて予測する市場
2. **ガバナンス**: 組織や社会の意思決定の仕組み
3. **Play Token**: 実際のお金ではなく、ゲーム内通貨で練習できる

つまり、「みんなの予測を使って、より良い意思決定をする仕組み」を作るプロジェクトです。

## 🏗️ プロジェクトの構成

```
/
├── apps/web/          → Webアプリケーション（ユーザーが使う画面）
├── packages/contracts/ → スマートコントラクト（ブロックチェーン上のプログラム）
├── functions/         → バックエンド処理（Firebase）
└── ref/              → 参考資料（過去のデモや設計書）
```

### 各部分の役割

1. **apps/web/**
   - Next.js製のWebアプリ
   - MetaMaskと連携してPlay Tokenを取得
   - 予測市場での取引画面

2. **packages/contracts/**
   - PlayToken.sol: ゲーム内通貨
   - MarketFactory.sol: 市場を作る工場
   - Market.sol: 個別の予測市場

3. **functions/**
   - 市場の自動処理
   - データベース管理

4. **ref/**
   - 過去のデモアプリ
   - 設計思想の資料

## 🚀 今すぐ動かすには ✅ **すぐに使える状態**

### 1. アプリを起動 ✅ **稼働中**

```bash
# プロジェクトのルートで
npm run dev
```

- **ホームページ**: http://localhost:3000
- **ダッシュボード**: http://localhost:3000/dashboard

### 2. 環境設定 ✅ **すべて完了済み**

#### ✅ 完了済み
- Firebase設定ファイル（firebase.json, firestore.rules等）
- Firebase Functions依存関係のインストール
- .env.local ファイルの認証情報設定
- スマートコントラクトのデプロイ
- フロントエンドとコントラクトの連携

2. **スマートコントラクトのデプロイ** ✅ **完了済み**
   
   **デプロイ済みコントラクト（Polygon Amoy テストネット）:**
   - **PlayToken**: `0x237B9E4EEE4AeAf712B5B240Ab03C973310B6bD1`
   - **MarketFactory**: `0x9f1C3f06B201FFa385a4BB3695f78cB1c17c12db`
   - **ConditionalTokens**: `0x0416a4757062c1e61759ADDb6d68Af145919F045`
   
   **フロントエンドの.env.localに追加が必要:**
   ```
   NEXT_PUBLIC_PLAY_TOKEN_ADDRESS=0x237B9E4EEE4AeAf712B5B240Ab03C973310B6bD1
   NEXT_PUBLIC_MARKET_FACTORY_ADDRESS=0x9f1C3f06B201FFa385a4BB3695f78cB1c17c12db
   ```

3. **Wallet Connect（オプション）**
   - https://cloud.walletconnect.com/ でプロジェクトIDを取得

## 💎 MetaMaskでPlay Tokenを取得する流れ

1. **MetaMaskをインストール**
   - Chrome拡張機能として追加
   - アカウントを作成

2. **Polygon Amoyテストネットに接続**
   - MetaMaskでネットワークを追加
   - **ネットワーク設定:**
     - ネットワーク名: Polygon Amoy
     - RPC URL: `https://polygon-amoy.g.alchemy.com/v2/Jmm9344uth8TJQi0gNCbs`
     - チェーンID: 80002
     - 通貨記号: POL
   - 無料のテスト用POLを取得: https://faucet.polygon.technology/

3. **アプリで接続**
   - http://localhost:3000/dashboard にアクセス
   - 「Connect Wallet」ボタンをクリック
   - MetaMaskで承認
   - 「1,000 PT を受け取る」ボタンで Play Token 取得

4. **予測市場で使う**
   - 市場一覧から興味のある市場を選択
   - 「Yes」か「No」に賭ける
   - 結果が出たら配当を受け取る

## 📝 次にやること

### 初心者向け（順番に）

1. **環境構築** ✅ **完了済み**
   - [x] Firebaseプロジェクト作成
   - [x] Firebase設定ファイル作成
   - [x] Firebase Functions依存関係インストール
   - [x] .env.localファイルに認証情報設定
   - [x] スマートコントラクトアドレス設定
   - [x] npm run devでアプリ起動確認

2. **フロントエンド実装** ✅ **完了済み**
   - [x] ダッシュボードページ作成
   - [x] Play Token請求機能実装
   - [x] ウォレット接続機能確認
   - [x] Polygon Amoy対応完了

3. **動作確認** ✅ **完了済み**
   - [x] MetaMask設定ガイド作成
   - [x] Polygon Amoyテストネット接続
   - [x] Play Token取得機能テスト

4. **理解を深める**
   - [ ] ref/Mirai-master-plan.mdを読む
   - [ ] ref/v0.mdで設計思想を理解
   - [ ] ref/futarchy/でデモを動かしてみる

### 開発者向け

1. **スマートコントラクト** ✅ **完了済み**
   ```bash
   cd packages/contracts
   npm test  # テスト実行
   npm run deploy:testnet  # デプロイ完了
   ```
   
2. **フロントエンド開発** ✅ **完了済み**
   ```bash
   cd apps/web
   npm run dev  # 開発サーバー稼働中
   npm run build  # ビルド
   ```

3. **Firebase Functions**
   ```bash
   cd functions
   npm run serve  # ローカルエミュレータ
   npm run deploy  # デプロイ
   ```

## 🎮 このプラットフォームでできること

1. **予測市場の作成**（管理者のみ）
   - 「次の選挙で誰が勝つか？」
   - 「このプロジェクトは成功するか？」

2. **予測の売買**
   - Play Tokenを使って予測を購入
   - 価格は市場の総意を反映
   - 正解すれば配当を獲得

3. **知識の集約**
   - 多くの人の予測から「集合知」を形成
   - より良い意思決定のための情報源

## ⚡ トラブルシューティング

### アプリが起動しない
```bash
# 依存関係を再インストール
rm -rf node_modules
npm install
npm run dev
```

### Firebase認証エラー
```bash
# 対話型でログイン
firebase login

# 非対話型環境の場合
firebase login:ci
```

### MetaMaskが接続できない
- Polygon Amoyテストネットを選択しているか確認
- ブラウザの拡張機能が有効か確認

### Play Tokenが取得できない
- スマートコントラクトがデプロイされているか確認
- .env.localにアドレスが正しく設定されているか確認

### Firebase Functions関連
- Node.jsバージョンが18の場合、現在Node.js v22.14.0を使用中（警告が出ますが動作します）
- Firebase Functions dependencies は既にインストール済み

### スマートコントラクト関連
- デプロイは Polygon Mumbai ではなく **Polygon Amoy** を使用
- deployed-addresses.json にコントラクトアドレス保存済み
- フロントエンドの .env.local に上記のアドレスを設定済み
- ダッシュボードページ（/dashboard）でPlay Token請求機能実装済み

## 🔮 将来の展望

このプロジェクトは「Miraiイニシアティブ」の一部として、以下を目指しています：

1. **知識の集約**: 分散した専門知識を予測市場で収集
2. **実行能力**: スキルのある人が直接解決策を実装
3. **インセンティブ調整**: 個人の利益と社会の利益を一致
4. **中立的なガバナンス**: 透明で改ざん不可能な意思決定

詳細は `ref/Mirai-master-plan.md` を参照してください。

## 🎯 現在の状況（2025-07-03 更新）

### ✅ 完全動作確認済み
- **フロントエンド**: Next.js アプリが http://localhost:3000 で稼働中
- **スマートコントラクト**: Polygon Amoy テストネットにデプロイ完了
- **ダッシュボード**: http://localhost:3000/dashboard でPlay Token請求可能
- **ウォレット連携**: MetaMask + RainbowKit で接続機能実装済み

### 🚀 すぐにできること
1. **Play Token を取得**: `/dashboard` でMetaMaskを接続して1,000 PT を無料取得
2. **予測市場を見る**: ホームページでモックデータの市場一覧を確認
3. **システム理解**: 実際に動作するアプリでFutarchyコンセプトを体験

### 📋 今後の拡張予定
- [ ] 実際の予測市場の作成・取引機能
- [ ] Firebase Functions での市場自動化
- [ ] 実際のKPI測定と結果判定システム
- [ ] より多くの社会課題市場の追加

---

質問や問題があれば、GitHubのIssuesで報告してください！