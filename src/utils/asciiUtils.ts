export const getAsciiChar = (distance: number, maskValue: number): string => {
  if (maskValue === 15) return ' '; // 사람 영역은 공백으로 처리
  return '🔥'; // 배경은 불꽃 이모지로 처리
};

export const calculateDistance = (x1: number, y1: number, x2: number, y2: number): number => {
  return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
};

export const getNearestPersonPixel = (mask: Float32Array, width: number, height: number): { x: number; y: number } | null => {
  let minX = width;
  let minY = height;
  let maxX = 0;
  let maxY = 0;
  let found = false;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const index = y * width + x;
      if (Math.round(mask[index] * 255.0) === 15) { // 사람 클래스
        found = true;
        minX = Math.min(minX, x);
        minY = Math.min(minY, y);
        maxX = Math.max(maxX, x);
        maxY = Math.max(maxY, y);
      }
    }
  }

  if (!found) return null;

  // 사람의 중심점 반환
  return {
    x: Math.floor((minX + maxX) / 2),
    y: Math.floor((minY + maxY) / 2)
  };
}; 