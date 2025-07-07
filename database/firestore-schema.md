# Firestore Database Schema for Play Token Airdrop

既存のFirebase設定を活用したPlay Token エアドロップシステムのデータベース設計です。

## 🔥 Firebase Firestore Collections

### 1. `users` Collection

各ドキュメントIDは `twitter_id` (Twitter OAuth の `sub` claim)

```typescript
interface User {
  // Document ID: twitter_id (string)
  
  // Wallet & Authentication
  walletAddress: string;           // MetaMask/スマートアカウントアドレス
  authProvider: 'twitter';         // 認証プロバイダー
  
  // Twitter Profile (OAuth から取得)
  twitter: {
    id: string;                    // Twitter ID
    username: string;              // @username
    displayName: string;           // 表示名
    profileImageUrl?: string;      // アイコンURL
    verified?: boolean;            // Twitter認証済みバッジ
  };
  
  // Claim Status
  claims: {
    baseAirdrop: {
      claimed: boolean;            // 基本エアドロップ受領済み
      claimedAt?: Timestamp;       // 受領日時
      txHash?: string;             // ブロックチェーントランザクションハッシュ
      amount: number;              // 1000 (PT)
    };
    volunteerBonus: {
      claimed: boolean;            // ボランティアボーナス受領済み
      claimedAt?: Timestamp;       // 受領日時
      txHash?: string;             // トランザクションハッシュ
      amount: number;              // 2000 (PT)
    };
  };
  
  // Role & Permissions
  roles: {
    isVolunteer: boolean;          // ボランティア資格
    isMarketCreator: boolean;      // 市場作成権限
    isAdmin: boolean;              // 管理者権限
  };
  
  // Metadata
  createdAt: Timestamp;            // アカウント作成日時
  updatedAt: Timestamp;            // 最終更新日時
  lastLoginAt: Timestamp;          // 最終ログイン日時
  
  // Optional: Additional Data
  email?: string;                  // メールアドレス（通知用）
  preferences?: {                  // ユーザー設定
    language: 'ja' | 'en';
    notifications: boolean;
    newsletter: boolean;
  };
  
  // Analytics & Metadata
  metadata?: {
    referralCode?: string;         // 紹介コード
    signupSource?: string;         // 登録経路
    ipAddress?: string;            // 初回登録IP（セキュリティ用）
    userAgent?: string;            // ブラウザ情報
  };
}
```

### 2. `distributionTransactions` Collection

トークン配布の監査ログ

```typescript
interface DistributionTransaction {
  // Document ID: auto-generated
  
  // User Reference
  twitterId: string;               // ユーザー参照
  walletAddress: string;           // 配布先ウォレット
  
  // Transaction Details
  type: 'base_airdrop' | 'volunteer_bonus' | 'custom' | 'admin_mint';
  amountPT: number;                // 配布量（PT単位）
  reason?: string;                 // 配布理由
  
  // Blockchain Transaction
  txHash?: string;                 // ブロックチェーンTXハッシュ
  blockNumber?: number;            // ブロック番号
  gasUsed?: number;                // 使用ガス
  
  // Status
  status: 'pending' | 'confirmed' | 'failed';
  errorMessage?: string;           // エラーメッセージ（失敗時）
  
  // Metadata
  createdAt: Timestamp;            // 作成日時
  confirmedAt?: Timestamp;         // 確認日時
  createdBy: string;               // 実行者（admin_mint時）
  
  // Network Info
  network: 'sepolia' | 'polygon' | 'amoy';
  chainId: number;
}
```

### 3. `marketCreators` Collection

市場作成者のホワイトリスト管理

```typescript
interface MarketCreator {
  // Document ID: twitter_id
  
  // User Reference
  twitterId: string;
  walletAddress: string;
  
  // Creator Profile
  profile: {
    name: string;                  // 作成者名
    organization?: string;         // 所属組織
    bio?: string;                  // 自己紹介
    website?: string;              // ウェブサイト
    specialization?: string[];     // 専門分野
  };
  
  // Permissions
  permissions: {
    canCreateMarkets: boolean;     // 市場作成権限
    canResolveMarkets: boolean;    // 市場解決権限
    maxMarketsPerMonth: number;    // 月間最大作成数
    categories?: string[];         // 作成可能カテゴリー
  };
  
  // Status
  status: 'active' | 'suspended' | 'revoked';
  
  // Approval Process
  approval: {
    approvedBy: string;            // 承認者
    approvedAt: Timestamp;         // 承認日時
    reviewNotes?: string;          // 審査コメント
  };
  
  // Statistics
  stats: {
    marketsCreated: number;        // 作成した市場数
    marketsResolved: number;       // 解決した市場数
    accuracyRate?: number;         // 予測精度
    totalVolume?: number;          // 総取引量
  };
  
  // Metadata
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

### 4. `oauthStates` Collection (Security)

OAuth CSRF攻撃防止用の一時状態管理

```typescript
interface OAuthState {
  // Document ID: state_token (random string)
  
  // Session Info
  sessionId?: string;              // セッションID
  ipAddress: string;               // クライアントIP
  userAgent: string;               // ブラウザ情報
  
  // Linking Flow (既存ウォレット連携時)
  linkingWalletAddress?: string;   // 連携するウォレット
  linkingFlow: boolean;            // 連携フローかどうか
  
  // Security
  expiresAt: Timestamp;            // 有効期限（5分程度）
  createdAt: Timestamp;            // 作成日時
  
  // Optional: Additional security data
  challengeHash?: string;          // チャレンジハッシュ
}
```

### 5. `claimAttempts` Collection (Rate Limiting)

レート制限とセキュリティ監視

```typescript
interface ClaimAttempt {
  // Document ID: auto-generated
  
  // User/IP Identification
  twitterId?: string;              // ユーザーID（ログイン済みの場合）
  walletAddress?: string;          // ウォレットアドレス
  ipAddress: string;               // クライアントIP
  
  // Attempt Details
  attemptType: 'base_airdrop' | 'volunteer_bonus';
  success: boolean;                // 成功/失敗
  errorCode?: string;              // エラーコード
  errorMessage?: string;           // エラーメッセージ
  
  // Security Data
  userAgent: string;               // ブラウザ情報
  sessionId?: string;              // セッションID
  
  // Timing
  createdAt: Timestamp;
  
  // Geolocation (optional, for security analysis)
  location?: {
    country?: string;
    region?: string;
  };
}
```

## 🔧 Firestore Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Users collection - users can read/write their own data
    match /users/{twitterId} {
      allow read, write: if request.auth != null && 
                           request.auth.token.sub == twitterId;
      
      // Admin can read all users
      allow read: if request.auth != null && 
                     get(/databases/$(database)/documents/users/$(request.auth.token.sub)).data.roles.isAdmin == true;
    }
    
    // Distribution transactions - read-only for users, write for server
    match /distributionTransactions/{transactionId} {
      allow read: if request.auth != null && 
                     resource.data.twitterId == request.auth.token.sub;
      
      // Server-side writes only (use Admin SDK)
    }
    
    // Market creators - read-only for public, admin writes
    match /marketCreators/{twitterId} {
      allow read: if true; // Public read for market creator verification
      
      // Admin writes only
      allow write: if request.auth != null && 
                      get(/databases/$(database)/documents/users/$(request.auth.token.sub)).data.roles.isAdmin == true;
    }
    
    // OAuth states - server-side only
    match /oauthStates/{stateToken} {
      allow read, write: if false; // Server-side only
    }
    
    // Claim attempts - server-side only for security
    match /claimAttempts/{attemptId} {
      allow read, write: if false; // Server-side only
    }
  }
}
```

## 📊 Firebase Functions (Cloud Functions)

### 主要機能

```typescript
// 1. Twitter OAuth認証後のユーザー作成/更新
export const handleTwitterAuth = functions.https.onCall(async (data, context) => {
  // JWT検証 → ユーザー作成/更新
});

// 2. Play Token配布処理
export const distributePlayTokens = functions.https.onCall(async (data, context) => {
  // 重複チェック → コントラクト呼び出し → DB更新
});

// 3. 期限切れOAuth状態のクリーンアップ
export const cleanupExpiredStates = functions.pubsub.schedule('every 5 minutes').onRun(async (context) => {
  // 期限切れoauthStatesを削除
});

// 4. ボランティア承認通知
export const notifyVolunteerApproval = functions.firestore.document('users/{twitterId}').onUpdate(async (change, context) => {
  // ボランティア承認時の通知送信
});
```

## 🚀 Next.js API Routes

### `/api/auth/twitter` - Twitter OAuth処理

```typescript
// Twitter OAuth開始 → リダイレクト
// コールバック受信 → JWT作成 → Firestore更新
```

### `/api/claim` - Token配布エンドポイント

```typescript
// JWT検証 → 重複チェック → コントラクト呼び出し → Firestore更新
```

### `/api/admin/volunteers` - ボランティア管理

```typescript
// 管理者のみ → ボランティア承認/削除
```

## 💾 データ移行とバックアップ

```typescript
// 既存データからFirestoreへの移行
export const migrateFromPostgreSQL = async () => {
  // PostgreSQL → Firestore データ移行
};

// 定期バックアップ
export const backupFirestore = functions.pubsub.schedule('every 24 hours').onRun(async (context) => {
  // Firestore → Cloud Storage バックアップ
});
```

## 🔍 Analytics & Monitoring

Firestore + Firebase Analytics で詳細な分析が可能：

- ユーザー登録数の推移
- Claim成功率
- 地域別の利用状況
- 不正アクセス検知

## 💡 Firestore の利点

1. **リアルタイム同期**: フロントエンドがリアルタイムでデータ更新を受信
2. **オフライン対応**: クライアントサイドキャッシュで安定動作
3. **セキュリティルール**: きめ細かいアクセス制御
4. **スケーラビリティ**: Googleインフラで自動スケール
5. **統合性**: Firebase Auth、Cloud Functions、Analyticsとの完全統合

この設計により、PostgreSQLよりもシンプルで堅牢なPlay Tokenエアドロップシステムが構築できます。