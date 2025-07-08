import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

interface TwitterLinkRequest {
  walletAddress: string;
  twitterId: string;
  signature?: string; // 将来的な署名認証用
}

interface TwitterLinkResponse {
  success: boolean;
  message: string;
  linkedTwitterId?: string;
}

interface UserTwitterLink {
  walletAddress: string;
  twitterId: string;
  linkedAt: string;
  signature?: string;
}

// 簡易データベース（本来はDBを使用）
const LINKS_FILE = path.join(process.cwd(), 'src/data/user-twitter-links.json');

/**
 * Twitter連携データの読み込み
 */
function loadTwitterLinks(): UserTwitterLink[] {
  try {
    if (fs.existsSync(LINKS_FILE)) {
      const data = fs.readFileSync(LINKS_FILE, 'utf-8');
      return JSON.parse(data);
    }
    return [];
  } catch (error) {
    console.error('Failed to load Twitter links:', error);
    return [];
  }
}

/**
 * Twitter連携データの保存
 */
function saveTwitterLinks(links: UserTwitterLink[]): void {
  try {
    // データディレクトリの作成
    const dataDir = path.dirname(LINKS_FILE);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    
    fs.writeFileSync(LINKS_FILE, JSON.stringify(links, null, 2));
  } catch (error) {
    console.error('Failed to save Twitter links:', error);
    throw new Error('Failed to save Twitter link');
  }
}

/**
 * ウォレットアドレスとTwitter IDの連携
 */
export async function POST(request: NextRequest): Promise<NextResponse<TwitterLinkResponse>> {
  try {
    const body: TwitterLinkRequest = await request.json();
    const { walletAddress, twitterId } = body;

    console.log(`🔗 Twitter link request:`, { walletAddress, twitterId });

    // 入力検証
    if (!walletAddress || !twitterId) {
      return NextResponse.json({
        success: false,
        message: 'Wallet address and Twitter ID are required'
      }, { status: 400 });
    }

    // ウォレットアドレスの正規化
    const normalizedAddress = walletAddress.toLowerCase();
    
    // Twitter IDの正規化
    const normalizedTwitterId = twitterId.startsWith('@') ? twitterId : `@${twitterId}`;

    // 既存の連携データを読み込み
    const links = loadTwitterLinks();

    // 既存の連携をチェック
    const existingLinkIndex = links.findIndex(
      link => link.walletAddress.toLowerCase() === normalizedAddress
    );

    // Twitter IDの重複チェック
    const twitterIdExists = links.some(
      link => link.twitterId.toLowerCase() === normalizedTwitterId.toLowerCase() &&
              link.walletAddress.toLowerCase() !== normalizedAddress
    );

    if (twitterIdExists) {
      return NextResponse.json({
        success: false,
        message: `Twitter ID ${normalizedTwitterId} is already linked to another wallet`
      }, { status: 409 });
    }

    const newLink: UserTwitterLink = {
      walletAddress: normalizedAddress,
      twitterId: normalizedTwitterId,
      linkedAt: new Date().toISOString()
    };

    if (existingLinkIndex >= 0) {
      // 既存の連携を更新
      links[existingLinkIndex] = newLink;
      console.log(`🔄 Updated Twitter link for ${normalizedAddress}`);
    } else {
      // 新規連携を追加
      links.push(newLink);
      console.log(`✨ Created new Twitter link for ${normalizedAddress}`);
    }

    // データを保存
    saveTwitterLinks(links);

    return NextResponse.json({
      success: true,
      message: `Successfully linked ${normalizedTwitterId} to wallet`,
      linkedTwitterId: normalizedTwitterId
    });

  } catch (error) {
    console.error('❌ Twitter link error:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to link Twitter account'
    }, { status: 500 });
  }
}

/**
 * ウォレットの連携状態確認
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const url = new URL(request.url);
    const walletAddress = url.searchParams.get('address');

    if (!walletAddress) {
      return NextResponse.json({ error: 'Wallet address is required' }, { status: 400 });
    }

    const links = loadTwitterLinks();
    const link = links.find(
      link => link.walletAddress.toLowerCase() === walletAddress.toLowerCase()
    );

    return NextResponse.json({
      walletAddress: walletAddress.toLowerCase(),
      isLinked: !!link,
      twitterId: link?.twitterId || null,
      linkedAt: link?.linkedAt || null
    });

  } catch (error) {
    console.error('❌ Failed to check Twitter link status:', error);
    return NextResponse.json({ 
      error: 'Failed to check link status' 
    }, { status: 500 });
  }
}

/**
 * Twitter連携の削除
 */
export async function DELETE(request: NextRequest): Promise<NextResponse> {
  try {
    const url = new URL(request.url);
    const walletAddress = url.searchParams.get('address');

    if (!walletAddress) {
      return NextResponse.json({ error: 'Wallet address is required' }, { status: 400 });
    }

    const links = loadTwitterLinks();
    const filteredLinks = links.filter(
      link => link.walletAddress.toLowerCase() !== walletAddress.toLowerCase()
    );

    if (links.length === filteredLinks.length) {
      return NextResponse.json({
        success: false,
        message: 'No Twitter link found for this wallet'
      }, { status: 404 });
    }

    saveTwitterLinks(filteredLinks);

    return NextResponse.json({
      success: true,
      message: 'Twitter link removed successfully'
    });

  } catch (error) {
    console.error('❌ Failed to remove Twitter link:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to remove Twitter link'
    }, { status: 500 });
  }
}