# ボランティアボーナスシステム：完全分析

## 概要
このドキュメントは、Futarchy プラットフォームのボランティアボーナスシステムの入力、出力、およびアルゴリズムを包括的に分析したものです。

## 🎛️ 管理者がコントロールできる入力 (Administrator-Controlled Inputs)

### 1. ボランティアマスターデータ
**ファイル**: `src/data/volunteers.csv`
```csv
twitter_id,name,role,joined_date
@volunteer1,田中太郎,運営,2024-01-15
@0xtkgshn,テストデベロッパー,開発,2024-07-08
```

**コントロール可能項目:**
- `twitter_id`: ボランティアのTwitter ID（@付き）
- `name`: ボランティアの実名
- `role`: ボランティアの役割（運営、広報、技術、企画、デザイン、開発、コミュニティ、テスト）
- `joined_date`: 参加日（YYYY-MM-DD形式）

**影響範囲:**
- ボランティア認証の可否
- UI表示される名前と役割
- 2,000 PTボーナスの受給資格

### 2. 環境変数設定
**ファイル**: `.env.local`

**ネットワーク設定:**
- `NEXT_PUBLIC_SEPOLIA_RPC_URL`: Sepoliaテストネット RPC URL
- `NEXT_PUBLIC_SEPOLIA_PLAY_TOKEN_ADDRESS`: PlayTokenコントラクトアドレス
- `NEXT_PUBLIC_ANVIL_PLAY_TOKEN_ADDRESS`: AnvilローカルPlayTokenアドレス

**認証・配布設定:**
- `SEPOLIA_DEPLOYER_PRIVATE_KEY`: トークン配布用の秘密鍵
- `ADMIN_TWITTER_IDS`: 管理者のTwitter ID（カンマ区切り）

**影響範囲:**
- トークン配布の実行可否
- ネットワーク接続の成功/失敗
- 管理者権限の認証

### 3. スマートコントラクト設定
**ファイル**: `packages/contracts/contracts/PlayToken.sol`

**コントロール可能な定数:**
- `BASE_AIRDROP_AMOUNT`: 1,000 PT（基本エアドロップ額）
- `VOLUNTEER_BONUS_AMOUNT`: 2,000 PT（ボランティアボーナス額）
- `DISTRIBUTOR_ROLE`: トークン配布権限
- `MARKET_CREATOR_ROLE`: マーケット作成権限

**影響範囲:**
- ボーナス額の変更（コントラクト再デプロイ必要）
- 配布権限の管理
- 重複配布防止の仕組み

### 4. API設定
**設定可能項目:**
- APIエンドポイントのレスポンス形式
- エラーメッセージの内容
- 自動ボーナス付与の有効/無効
- キャッシュ期間（5分間）

## 📊 システムが出力するもの (System Outputs)

### 1. UI表示要素

**ボランティア認証前:**
- Twitter ID入力フィールド
- "連携"ボタン
- 説明文とフロー

**ボランティア認証後:**
- ✅ ボランティア認証済み
- 名前、役割、Twitter ID
- "🎁 2,000 PT特典を受け取る"ボタン

**ボーナス獲得後:**
- 🎉 ボランティア特典獲得済み！
- 連携済みアカウント表示
- ✅ 2,000 PT を獲得しました
- トランザクションハッシュのリンク

### 2. ブロックチェーン出力
- **トークン配布トランザクション**: PlayTokenコントラクトのmint処理
- **状態変更**: `volunteerBonusClaimed[address] = true`
- **イベント発行**: `VolunteerBonusClaimed(address, amount)`

### 3. データベース保存
**ファイル**: `src/data/user-twitter-links.json`
```json
{
  "walletAddress": "0x...",
  "twitterId": "@username",
  "linkedAt": "2024-07-11T10:00:00Z"
}
```

### 4. ログ出力
```
🎁 Volunteer bonus request: {walletAddress, twitterId, networkKey}
🚀 Distributing volunteer bonus to 0x...
✅ Transaction confirmed: 0x...
```

## 🚫 コントロールできない変数 (Uncontrollable Variables)

### 1. ユーザー入力
- ウォレットアドレス（MetaMask等から取得）
- ユーザーが入力するTwitter ID
- ネットワーク選択（ユーザーのMetaMask設定）

### 2. ブロックチェーン状態
- トランザクションの確認時間（ネットワーク混雑度）
- ガス料金の変動
- ネットワークの可用性
- 既存のcontract state（`volunteerBonusClaimed`マッピング）

### 3. 外部依存
- MetaMaskの接続状態
- RPC providersの稼働状況
- ブラウザのローカルストレージ状態

### 4. 時間的要因
- ユーザーのアクセス時刻
- トランザクションの実行タイミング
- キャッシュの有効期限

## 🔄 アルゴリズムフロー (Algorithm Flow)

### Phase 1: Twitter連携
```
1. ユーザーがTwitter ID入力
2. フロントエンド → `/api/user/link-twitter` POST
3. user-twitter-links.jsonに保存
4. 連携状態をUIに反映
```

### Phase 2: ボランティア確認
```
1. 連携成功後、自動で handleCheckVolunteer 実行
2. フロントエンド → `/api/auth/social` POST
3. checkVolunteerStatus(twitterId) 実行
   - volunteers.csv読み込み
   - Twitter IDマッチング（大文字小文字無視、@有無両対応）
4. ボランティア情報をUIに表示
```

### Phase 3: ボーナス配布
```
1. "特典を受け取る"ボタンクリック
2. フロントエンド → `/api/claim/volunteer-bonus` POST
3. サーバーサイド処理:
   a. volunteers.csv再確認
   b. 契約確認: hasClaimedVolunteerBonus(address)
   c. 配布実行: distributeVolunteerBonus(address)
   d. トランザクション待機
4. 成功時: UI更新 + txHash表示
```

### Phase 4: 状態管理
```
1. ローカルストレージにキャッシュ
2. コントラクト状態と同期
3. UI状態の更新
```

## 🔍 データフロー詳細 (Data Flow Details)

### 入力データの正規化
```javascript
// Twitter ID正規化
const normalizedTwitterId = twitterId.startsWith('@') ? twitterId : `@${twitterId}`;

// ウォレットアドレス正規化
const normalizedAddress = walletAddress.toLowerCase();

// 検索時の柔軟性確保
return volunteerMapCache.get(`@${normalizedId}`) || 
       volunteerMapCache.get(normalizedId) || 
       null;
```

### 状態管理のレイヤー
1. **ブロックチェーン状態** (最終的な真実)
   - `volunteerBonusClaimed[address]` マッピング
   - PlayTokenバランス

2. **サーバーサイド状態**
   - `volunteers.csv` キャッシュ（5分間）
   - `user-twitter-links.json` ファイル

3. **クライアントサイド状態**
   - React state (`bonusStatus`)
   - ローカルストレージ (`futarchy-claim-status`)

### エラーハンドリング階層
```
レベル1: 入力検証エラー
  - 必須フィールドの欠如
  - 無効なアドレス形式

レベル2: 認証エラー
  - Twitter IDがボランティアリストに存在しない
  - ウォレット未接続

レベル3: 状態エラー
  - 既にボーナス請求済み
  - 重複する連携試行

レベル4: システムエラー
  - RPC接続失敗
  - 秘密鍵未設定
  - トランザクション失敗
```

## ⚠️ 既知の問題点と対策

### 1. 状態不整合問題
**問題**: APIが `hasClaimedVolunteerBonus: true` を返すが、実際の契約状態は `false`

**原因**: 
- 自動ボーナス付与の失敗
- 非同期処理の競合
- キャッシュの不整合

**対策**:
- 契約状態を直接確認するAPI実装
- 自動リトライ機能の追加
- キャッシュ無効化機能の追加

### 2. ネットワーク切り替え問題
**問題**: 異なるネットワーク間での状態混乱

**対策**:
- ネットワーク切り替え時の状態リセット
- ネットワーク固有の状態管理

### 3. 同期タイミング問題
**問題**: トランザクション完了とUI更新のタイミングずれ

**対策**:
- トランザクション確認後の状態更新
- リアルタイム残高チェック

## 🛠️ 推奨改善点

### 1. 状態管理の強化
```javascript
// 契約状態と同期するhook
const useContractSync = (address, networkKey) => {
  // 定期的に契約状態を確認
  // キャッシュと不整合がある場合は修正
}
```

### 2. エラー回復機能
```javascript
// 失敗したトランザクションの再試行
const retryFailedClaim = async (address, twitterId) => {
  // 契約状態確認 → 必要に応じて再実行
}
```

### 3. 詳細ログ機能
```javascript
// 操作履歴の記録
const logUserAction = (action, data, result) => {
  // デバッグ用の詳細ログ
}
```

## 📋 テストシナリオ

### 基本フロー
1. 新規ユーザーの連携 → 認証 → ボーナス受取
2. 既存ユーザーの状態確認
3. 非ボランティアの基本トークン請求

### エラーケース
1. 無効なTwitter ID
2. 既に請求済みのアドレス
3. ネットワーク接続エラー
4. 残高不足エラー

### エッジケース
1. 同じTwitter IDの複数ウォレット連携試行
2. 大文字小文字混在のTwitter ID
3. @記号有無のTwitter ID
4. ネットワーク切り替え中の操作

---

*このドキュメントは2024年7月11日に作成され、システムの実装に基づいて継続的に更新されます。*