Futarchyプラットフォーム 詳細設計書 v0.2
1. はじめに
1.1. プロジェクトの目的とビジョン
本プロジェクトは、「Mirai master plan」に描かれた「政党政治のエンドゲーム」を実現するための技術的基盤を構築することを目的とする。その核心は、予測市場を活用したガバナンスメカニズム「Futarchy」を用いて、特定のイデオロギーに依存しない、より効率的で知的な意思決定を社会にもたらす「メタ・ガバナンス・プラットフォーム」を創造することにある。

このプラットフォームは、以下のビジョンを追求する。

知性の集約: 社会に散在する専門家の知見、市民の直感、さらにはインサイダー情報までもを集約し、集合知として意思決定に活用する。

実行能力の解放: プリンシパルエージェント問題を解決し、真に能力のある個人や組織が、官僚的な手続きに妨げられることなく、公共の利益に貢献できる場を提供する。

インセンティブの調和: 個人の金銭的・社会的な利益追求が、結果として社会全体の利益に繋がるような、自己増殖的なエコシステムを構築する。

1.2. 本ドキュメントのスコープ
本ドキュメントは、上記ビジョンを実現するための第一歩として、**概念実証（Proof of Concept）プラットフォーム（v0.1）**の設計を定義する。

対象フェーズ: Mirai master planにおけるフェーズ1「知性の独占」およびフェーズ2「実行能力の独占」の初期段階。

中心機能: KPI Futarchyを実装し、「行政が事業委託先の選定に使う」といった具体的なユースケースをシミュレーションできる環境を構築する。

利用通貨: 法的・技術的リスクを最小化するため、初期バージョンでは実際の金銭価値を持たないPlay Tokenを使用する。

対象外: Mirai master planにおけるフェーズ3「お金の独占」（$miraiトークンの発行など、Asset Futarchyに関連する機能）は、将来のスコープとする。

2. 設計思想とガイド原則
本プラットフォームの設計は、Mirai master planで提示された以下の思想を根幹とする。

インセンティブのアラインメント (Incentive Alignment): システムは、参加者が自身の利益（金銭的、評判的）を最大化しようとする利己的な行動が、市場全体の予測精度を高め、最終的に社会全体の利益に貢献するように設計される。

反脆性の追求 (Anti-fragility): 従来のシステムが脆弱性とみなす「インサイダー取引」を、重要な情報源として積極的に奨励する。匿名性を確保し、隠された情報が価格に反映されやすい環境を作ることで、外部からの操作や内部の不正に対して堅牢な（反脆い）システムを目指す。

信頼できる中立性 (Credible Neutrality): プラットフォームのコアロジックは、一度デプロイされれば特定の管理者や国家権力ですら介入・改変が困難なスマートコントラクトによって実行される。属人性を排し、誰にとっても公平で中立的なルールを提供することで、長期的な信頼を醸成する。

3. PoC(v0.1)の主要パラメータ
カテゴリ

決定内容

補足

基盤チェーン

Polygon PoS

日本のユーザーにおけるMetaMask普及率、ガス代の安さ、EVM互換性を考慮。

市場メカニズム

LMSRベースのAMM

流動性が薄い初期段階でも市場が機能しやすい。bパラメータで価格変動を調整可能。

流動性パラメータ (b)

1,000

少額の取引でも価格が大きく動き、ゲーム性が高まるように設定。初期参加者が少ないPoCに適する。

条件付きトークン

Gnosis Conditional Tokens (ERC-1155)

標準化されており、安全性が高い実績のある規格を流用する。

インセンティブ通貨

Play Token (PT)

価値ゼロのゲーム内通貨。ユーザー登録時に自動でエアドロップ。

Play Token配布量

1,000 PT / 1ユーザー

ユーザー登録（メール認証等）をトリガーに配布。

提案の投稿資格

誰でも自由投稿

KYC（本人確認）は不要。参加のハードルを下げ、多様な知見を募る。

UI言語

日本語のみ

PoC段階ではターゲットを国内ユーザーに絞り、迅速な開発を優先する。

KPI（初回市場の例）

「あるプロジェクトは社会保障制度の補足率をX%向上させられるか」

基準値は最新の政府統計、測定時点はプロジェクト完了後6ヶ月時点の公表値とする。

取引期間

7日間

PoCとして結果を迅速に確認できる期間に設定。

採択条件

取引終了時点で最高価格の提案を自動採択

最も市場から期待されている提案を勝者とするシンプルなルール。

オラクル戦略

中央集権型（管理者入力）

PoCでは運営チームが手動でKPI結果を入力。異議申し立て期間は設けない。

実行フロー

採択結果とKPI実測値をサイト上で公開するのみ

PoCではオンチェーンでの資金移動は行わない。

法的レビュー

PoCリリース前に簡易チェック

ゲーム内通貨であっても景品表示法や特定商取引法に関する表記を確認する。

4. システムアーキテクチャと連携
4.1. 全体構成
[ ユーザー (ブラウザ) ]
       ↑↓ (HTTPS)
[ フロントエンド (React/Next.js) ]
       ↑↓ (API Call)                ↑↓ (Wallet RPC via Wagmi)
[ バックエンド (Firebase) ]      [ ブロックチェーン (Polygon) ]
  - ユーザー認証 (Auth)             - PlayToken.sol (ERC20)
  - DB (Firestore)                  - MarketFactory.sol
  - 定期実行 (Cloud Scheduler)      - Market.sol
  - サーバーレス (Functions)        - ConditionalTokens.sol (Gnosis)
       ↑↓ (Admin SDK)
[ 中央集権型オラクル (管理者ダッシュボード) ]

4.2. オンチェーン・オフチェーン連携フロー
処理

オフチェーン (Firebase / フロントエンド)

オンチェーン (Polygon)

ユーザー登録

① Firebase Authで認証<br>② フロントエンドからclaim()をコール

PlayToken.claim()が実行され、1,000 PTがミントされる。

市場作成

管理者ダッシュボードから市場パラメータをPOST

MarketFactory.createMarket()がコールされ、新しいMarketコントラクトがデプロイされる。

取引

Next.jsのフォームからbuy()をコール

Market.buy()が実行され、LMSRに基づき価格が計算され、条件付きトークンが発行される。

取引終了

Cloud Schedulerがdeadlineを監視し、Functionsをトリガー

Market.closeTrading()がコールされ、市場のステータスがCLOSEDに遷移する。

KPI結果入力

管理者ダッシュボードからKPI結果を入力

Market.resolve()がコールされ、勝者が確定し、市場がRESOLVEDに遷移する。

フロント表示

FirestoreのonSnapshotで市場データをリアルタイム同期。価格はeth_callで直接取得。

-

5. 機能仕様と画面構成
5.1. 主要機能一覧
ID

機能名

概要

主な利用者

F-01

市場の作成

管理者が新しい意思決定のテーマ（市場）を作成する。

管理者

F-02

提案の投稿

提案者が、開催中の市場に対して具体的な解決策を提案する。

提案者

F-03

市場の閲覧

ユーザーが開催中・過去の市場一覧や、各市場の詳細を閲覧する。

全員

F-04

ベット（取引）

市場参加者が、最もKPIを達成しそうだと思う提案の「YESトークン」を購入する。

市場参加者

F-05

ポートフォリオ管理

市場参加者が、自身の保有資産や取引履歴を確認する。

市場参加者

F-06

市場の決定

取引期間終了後、最も価格が高い提案が「採択」される。

システム

F-07

市場の解決

管理者がオラクルとして最終的なKPIの結果を入力し、予測が的中した参加者に払い戻しが行われる。

管理者, システム

F-08

Play Tokenの獲得

ユーザーが初回登録時にclaimを実行し、1,000 Play Tokenを無料で獲得する。

市場参加者

5.2. 画面構成（ルーティング）
URL

役割

主要コンポーネント

/

市場一覧ページ

MarketCard[], カテゴリTab

/market/[id]

市場詳細＆取引ページ

KPIInfo, PriceChart, ProposalTable, TradePanel

/dashboard

マイページ

BalanceBox, PositionTable, HistoryTimeline

/admin

管理者用ページ

NewMarketForm, OracleInputTable

6. データモデル (Firestore)
// users/{uid}
{
  walletAddress: string,
  claimed: bool,
  createdAt: timestamp
}

// markets/{marketId}
{
  title: string,
  kpiDescription: string,
  deadline: timestamp,
  resolutionTime: timestamp,
  factoryAddress: string,
  marketAddress: string,
  status: "TRADING" | "CLOSED" | "RESOLVED"
}

// proposals/{proposalId}
{
  marketId: string, // FK
  title: string,
  details: string,
  outcomeIndex: number,
  createdBy: string // uid
}

// trades/{tradeId}
{
  marketId: string, // FK
  proposalId: string, // FK
  uid: string, // FK
  amount: string, // Play Token amount
  cost: string, // Conditional Token amount
  txHash: string,
  timestamp: timestamp
}

7. 技術スタック
カテゴリ

技術

選定理由

フロントエンド

React (Next.js), TypeScript

開発効率、型安全性、およびモダンなWeb開発の標準であるため。

UIフレームワーク

Tailwind CSS

迅速なUI構築とカスタマイズの容易さ。

バックエンド/DB

Firebase (Auth, Firestore, Functions)

迅速なPoC開発、リアルタイムDB、サーバーレス機能、スケーラビリティ。

ブロックチェーン

Polygon (PoS)

EVM互換性があり、ガス代が安価で、開発者コミュニティが活発なため。

スマートコントラクト

Solidity

EVM互換チェーンにおけるスマートコントラクト開発の標準言語。

ウォレット連携

RainbowKit / Wagmi

美しいUIと優れた開発者体験を提供し、ウォレット接続を容易にするため。

8. Solidityコントラクト雛形（抜粋）
8.1. PlayToken.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract PlayToken is ERC20, Ownable {
    uint256 public constant AIRDROP_AMOUNT = 1_000 * 1e18; // 1,000 PT

    mapping(address => bool) public claimed;

    constructor() ERC20("Play Token", "PT") {}

    function claim() external {
        require(!claimed[msg.sender], "Already claimed");
        claimed[msg.sender] = true;
        _mint(msg.sender, AIRDROP_AMOUNT);
    }

    // For emergency minting (admin only)
    function adminMint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }
}

8.2. MarketFactory.sol
pragma solidity ^0.8.20;

import "./Market.sol";

contract MarketFactory {
    event MarketCreated(address market);

    address public playToken;
    address public oracle;
    uint256 public b = 1_000 * 1e18; // LMSR parameter

    constructor(address _playToken, address _oracle) {
        playToken = _playToken;
        oracle    = _oracle;
    }

    function createMarket(
        string calldata _title,
        string calldata _kpiDescription,
        uint64 _tradingDeadline,
        uint64 _resolutionTime
    ) external returns (address) {
        Market m = new Market(
            playToken,
            oracle,
            _title,
            _kpiDescription,
            _tradingDeadline,
            _resolutionTime,
            b
        );
        emit MarketCreated(address(m));
        return address(m);
    }
}

8.3. Market.sol
pragma solidity ^0.8.20;

import "@gnosis.pm/conditional-tokens-contracts/contracts/ConditionalTokens.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract Market {
    enum Phase { TRADING, CLOSED, RESOLVED }

    IERC20             public playToken;
    ConditionalTokens  public ctf;
    address            public oracle;
    uint256            public b;          // LMSR liquidity
    string             public title;
    string             public kpi;
    uint64             public deadline;
    uint64             public resolution;
    Phase              public phase;

    mapping(uint256 => int256) public q; // outcomeIndex -> cumulative quantity
    uint256[] public conditionIds;

    constructor(
        address _playToken,
        address _oracle,
        string memory _title,
        string memory _kpi,
        uint64 _deadline,
        uint64 _resolution,
        uint256 _b
    ){
        playToken  = IERC20(_playToken);
        oracle     = _oracle;
        title      = _title;
        kpi        = _kpi;
        deadline   = _deadline;
        resolution = _resolution;
        b          = _b;
        phase      = Phase.TRADING;
        ctf = new ConditionalTokens();
    }

    function buy(uint256 outcome, uint256 amount) external {
        require(phase == Phase.TRADING && block.timestamp < deadline, "Trading closed");
        // LMSR price calculation logic...
    }

    function closeTrading() external {
        require(block.timestamp >= deadline, "Too early");
        phase = Phase.CLOSED;
    }

    function resolve(uint256 winningOutcome) external {
        require(msg.sender == oracle, "Only oracle");
        require(phase == Phase.CLOSED, "Not closed");
        phase = Phase.RESOLVED;
        // Redeem conditional tokens and pay out PT to winners...
    }
}

9. 次のステップ
リポジトリセットアップ: Hardhat + TypeScriptのモノレポ (packages/contracts, apps/web, functions) を構築する。

コントラクト実装 & テスト: 雛形を基に詳細なロジックを実装し、テストを記述する。特にb=1000でのスケールに注意し、オーバーフロー/アンダーフローを検証する。

フロントエンド雛形作成: Next.js 14 (App Router) / Tailwind CSS / Wagmi v2 / RainbowKitで基本構成を作成する。

Firebaseプロジェクト作成: FirestoreとFunctions (TypeScript) をセットアップする。

デプロイ & QA: Polygon Mumbaiテストネットにデプロイし、一連のフローをテストする。

ユーザーテスト: 登録→1,000 PT受領→ベット→採択→KPI入力→決済のサイクルを7日間で回し、UXの問題点を洗い出す。
