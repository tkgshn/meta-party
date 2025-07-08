import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse/sync';

export interface Volunteer {
  twitter_id: string;
  name: string;
  role: string;
  joined_date: string;
}

/**
 * ボランティアリストをCSVから読み込み
 * @returns ボランティアリスト
 */
export function loadVolunteers(): Volunteer[] {
  try {
    const csvPath = path.join(process.cwd(), 'src/data/volunteers.csv');
    const csvContent = fs.readFileSync(csvPath, 'utf-8');
    
    const records = parse(csvContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true
    }) as Volunteer[];
    
    return records;
  } catch (error) {
    console.error('Failed to load volunteers:', error);
    return [];
  }
}

/**
 * Twitter IDがボランティアリストに含まれているかチェック
 * @param twitterId チェックするTwitter ID (@なしでも可)
 * @returns ボランティア情報またはnull
 */
export function checkVolunteerStatus(twitterId: string): Volunteer | null {
  const volunteers = loadVolunteers();
  
  // @を統一的に処理
  const normalizedId = twitterId.startsWith('@') ? twitterId : `@${twitterId}`;
  
  return volunteers.find(volunteer => 
    volunteer.twitter_id.toLowerCase() === normalizedId.toLowerCase()
  ) || null;
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
}