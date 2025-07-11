/**
 * ウォレットアドレスベースのピクセルアバター生成ユーティリティ
 * ランダムなピクセルパターンを生成してSVGアバターを作成
 */

interface PixelAvatarOptions {
  size?: number;
  pixelSize?: number;
  backgroundColor?: string;
  seed?: string;
}

/**
 * ウォレットアドレスからシードを生成
 */
function generateSeedFromAddress(address: string): number {
  let hash = 0;
  for (let i = 0; i < address.length; i++) {
    const char = address.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash);
}

/**
 * シード値から確定的な乱数を生成
 */
function seededRandom(seed: number): () => number {
  let value = seed;
  return () => {
    value = (value * 9301 + 49297) % 233280;
    return value / 233280;
  };
}

/**
 * HSL色を生成
 */
function generateColor(random: () => number, saturation = 70, lightness = 60): string {
  const hue = Math.floor(random() * 360);
  return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
}

/**
 * ピクセルアバターのSVGを生成
 */
export function generatePixelAvatar(address: string, options: PixelAvatarOptions = {}): string {
  const {
    size = 8,
    pixelSize = 8,
    backgroundColor = '#f0f0f0'
  } = options;

  const seed = generateSeedFromAddress(address);
  const random = seededRandom(seed);
  
  // 色パレットを生成
  const primaryColor = generateColor(random, 70, 50);
  const secondaryColor = generateColor(random, 60, 65);
  const accentColor = generateColor(random, 80, 40);
  
  const colors = [backgroundColor, primaryColor, secondaryColor, accentColor];
  
  // 対称的なピクセルパターンを生成（左右対称）
  const halfSize = Math.ceil(size / 2);
  const pattern: number[][] = [];
  
  for (let y = 0; y < size; y++) {
    pattern[y] = [];
    for (let x = 0; x < halfSize; x++) {
      // より面白いパターンのため、エッジは背景色にしがち
      let colorIndex;
      if (x === 0 || y === 0 || y === size - 1) {
        colorIndex = random() < 0.3 ? Math.floor(random() * colors.length) : 0;
      } else {
        colorIndex = Math.floor(random() * colors.length);
      }
      pattern[y][x] = colorIndex;
    }
    
    // 左右対称にミラー
    for (let x = halfSize; x < size; x++) {
      const mirrorX = size - 1 - x;
      if (mirrorX >= 0) {
        pattern[y][x] = pattern[y][mirrorX];
      }
    }
  }
  
  // SVGを生成
  const svgSize = size * pixelSize;
  let svg = `<svg width="${svgSize}" height="${svgSize}" viewBox="0 0 ${svgSize} ${svgSize}" xmlns="http://www.w3.org/2000/svg">`;
  
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const color = colors[pattern[y][x]];
      const px = x * pixelSize;
      const py = y * pixelSize;
      svg += `<rect x="${px}" y="${py}" width="${pixelSize}" height="${pixelSize}" fill="${color}"/>`;
    }
  }
  
  svg += '</svg>';
  return svg;
}

/**
 * SVGをData URLに変換
 */
export function svgToDataUrl(svg: string): string {
  const base64 = btoa(unescape(encodeURIComponent(svg)));
  return `data:image/svg+xml;base64,${base64}`;
}

/**
 * ウォレットアドレス用のピクセルアバターを生成（Data URL形式）
 */
export function generateWalletAvatar(address: string, size = 40): string {
  const svg = generatePixelAvatar(address, {
    size: 8,
    pixelSize: size / 8,
  });
  return svgToDataUrl(svg);
}

/**
 * ユーザーのアバターURLを決定（Twitter画像 > ピクセルアバター > デフォルト）
 */
export function getUserAvatarUrl(user: {
  profileImage?: string;
  walletAddress?: string;
  twitterId?: string;
}, size = 40): string {
  // Twitter画像が利用可能な場合
  if (user.profileImage) {
    return user.profileImage;
  }
  
  // ウォレットアドレスがある場合はピクセルアバター生成
  if (user.walletAddress) {
    return generateWalletAvatar(user.walletAddress, size);
  }
  
  // TwitterIDがある場合もピクセルアバター生成
  if (user.twitterId) {
    return generateWalletAvatar(user.twitterId, size);
  }
  
  // フォールバック：デフォルトSVGアバター
  const defaultSvg = `
    <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
      <circle cx="${size/2}" cy="${size/2}" r="${size/2}" fill="#e5e7eb"/>
      <circle cx="${size/2}" cy="${size*0.35}" r="${size*0.15}" fill="#9ca3af"/>
      <circle cx="${size/2}" cy="${size*0.75}" r="${size*0.25}" fill="#9ca3af"/>
    </svg>
  `;
  return svgToDataUrl(defaultSvg);
}