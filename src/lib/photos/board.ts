export type BoardPoint = {
  x: number;
  y: number;
};

export type BoardPositions = Record<string, BoardPoint>;

const DRAG_THRESHOLD_PX = 5;
const ZONE_COLUMNS = 4;
const ZONE_ROWS = 3;

function hashString(value: string) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function seededRandom(seed: number) {
  let value = seed;
  return () => {
    value += 0x6d2b79f5;
    let next = value;
    next = Math.imul(next ^ (next >>> 15), next | 1);
    next ^= next + Math.imul(next ^ (next >>> 7), next | 61);
    return ((next ^ (next >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffledZones(seed: string) {
  const random = seededRandom(hashString(seed));
  const zones = Array.from({ length: ZONE_COLUMNS * ZONE_ROWS }, (_, index) => index);
  for (let index = zones.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [zones[index], zones[swapIndex]] = [zones[swapIndex], zones[index]];
  }
  return zones;
}

export function clampBoardPosition(
  position: BoardPoint,
  boardWidth: number,
  boardHeight: number,
  cardWidth: number,
  cardHeight: number,
): BoardPoint {
  const maxX = Math.max(0, boardWidth - cardWidth);
  const maxY = Math.max(0, boardHeight - cardHeight);
  return {
    x: Math.min(Math.max(0, position.x), maxX),
    y: Math.min(Math.max(0, position.y), maxY),
  };
}

export function createBoardPositions(
  ids: string[],
  boardWidth: number,
  boardHeight: number,
  cardWidth: number,
  cardHeight: number,
  seed: string,
): BoardPositions {
  const availableWidth = Math.max(0, boardWidth - cardWidth);
  const availableHeight = Math.max(0, boardHeight - cardHeight);
  const zoneWidth = availableWidth / ZONE_COLUMNS;
  const zoneHeight = availableHeight / ZONE_ROWS;
  const random = seededRandom(hashString(`${seed}:${ids.join(",")}`));
  const zones = shuffledZones(seed);

  return ids.reduce<BoardPositions>((positions, id, index) => {
    const zone = zones[index % zones.length];
    const column = zone % ZONE_COLUMNS;
    const row = Math.floor(zone / ZONE_COLUMNS);
    const jitterX = zoneWidth * 0.12 + random() * zoneWidth * 0.76;
    const jitterY = zoneHeight * 0.12 + random() * zoneHeight * 0.76;
    positions[id] = clampBoardPosition(
      {
        x: column * zoneWidth + jitterX,
        y: row * zoneHeight + jitterY,
      },
      boardWidth,
      boardHeight,
      cardWidth,
      cardHeight,
    );
    return positions;
  }, {});
}

export function hasDragged(start: BoardPoint, current: BoardPoint) {
  const deltaX = current.x - start.x;
  const deltaY = current.y - start.y;
  return Math.hypot(deltaX, deltaY) > DRAG_THRESHOLD_PX;
}
