import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse/sync';

export interface Volunteer {
  twitter_id: string;
  name: string;
  role: string;
  joined_date: string;
}

// キャッシュ用変数
let volunteersCache: Volunteer[] | null = null;
let volunteerMapCache: Map<string, Volunteer> | null = null;
let lastLoadTime = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5分間キャッシュ

/**
 * ボランティアリストをCSVから読み込み（キャッシュ機能付き）
 * @returns ボランティアリスト
 */
export function loadVolunteers(): Volunteer[] {
  const now = Date.now();
  
  // キャッシュが有効な場合は既存データを返す
  if (volunteersCache && (now - lastLoadTime) < CACHE_DURATION) {
    return volunteersCache;
  }
  
  try {
    const csvPath = path.join(process.cwd(), 'src/data/volunteers.csv');
    const csvContent = fs.readFileSync(csvPath, 'utf-8');
    
    const records = parse(csvContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true
    }) as Volunteer[];
    
    // キャッシュを更新
    volunteersCache = records;
    
    // 高速検索用のMapも作成
    volunteerMapCache = new Map();
    records.forEach(volunteer => {
      const normalizedId = volunteer.twitter_id.toLowerCase();
      volunteerMapCache!.set(normalizedId, volunteer);
      // @なしバージョンも追加
      if (normalizedId.startsWith('@')) {
        volunteerMapCache!.set(normalizedId.slice(1), volunteer);
      }
    });
    
    lastLoadTime = now;
    
    return records;
  } catch (error) {
    console.error('Failed to load volunteers:', error);
    // エラーが発生した場合でも、古いキャッシュがあれば返す
    return volunteersCache || [];
  }
}

/**
 * Twitter IDがボランティアリストに含まれているかチェック（高速版）
 * @param twitterId チェックするTwitter ID (@なしでも可)
 * @returns ボランティア情報またはnull
 */
export function checkVolunteerStatus(twitterId: string): Volunteer | null {
  // キャッシュを初期化（loadVolunteers内でMapも更新される）
  loadVolunteers();
  
  if (!volunteerMapCache) {
    return null;
  }
  
  // 正規化されたIDで高速検索
  const normalizedId = twitterId.toLowerCase().replace(/^@/, '');
  
  return volunteerMapCache.get(`@${normalizedId}`) || 
         volunteerMapCache.get(normalizedId) || 
         null;
}

/**
 * すべてのボランティアのTwitter IDを取得
 * @returns Twitter IDの配列
 */
export function getAllVolunteerIds(): string[] {
  const volunteers = loadVolunteers();
  return volunteers.map(v => v.twitter_id);
}

/**
 * ボランティア情報をログ形式で出力
 */
export function logVolunteerStats() {
  const volunteers = loadVolunteers();
  console.log(`📊 Volunteer Stats:`);
  console.log(`   Total volunteers: ${volunteers.length}`);
  console.log(`   Roles: ${[...new Set(volunteers.map(v => v.role))].join(', ')}`);
  console.log(`   IDs: ${volunteers.map(v => v.twitter_id).join(', ')}`);
  console.log(`   Cache status: ${volunteerMapCache ? 'Active' : 'Not loaded'}`);
  console.log(`   Last load: ${lastLoadTime ? new Date(lastLoadTime).toLocaleString() : 'Never'}`);
}

/**
 * ボランティアキャッシュを手動でクリア
 */
export function clearVolunteerCache() {
  volunteersCache = null;
  volunteerMapCache = null;
  lastLoadTime = 0;
  console.log('🗑️ Volunteer cache cleared');
}