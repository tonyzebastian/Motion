// ---------------------------------------------------------------------------
// Colors
// ---------------------------------------------------------------------------

export const COLORS = {
  backgroundFrom: '#ffffff',
  backgroundTo: '#FAEEFC',
  cardBg: 'linear-gradient(115deg, rgb(255, 255, 255) 0.35%, rgba(255, 255, 255, 0.5) 99.66%)',
  cardBorder: '#ffffff',
  cardShadow: '0px 2px 6px rgba(0, 0, 0, 0.06), 0px 1px 2px rgba(0, 0, 0, 0.08)',

  gold: '#F5B731',
  goldLight: 'rgba(245, 183, 49, 0.12)',
  goldBorder: 'rgba(245, 183, 49, 0.5)',

  // Table cells — purple tinted backgrounds
  headerCellBg: 'rgba(164, 61, 245, 0.1)',
  dataCellBg: 'rgba(164, 61, 245, 0.05)',
  hoverCellBg: 'rgba(164, 61, 245, 0.1)',
  cellText: '#000000',

  dimmedRow: 'rgba(0, 0, 0, 0.25)',

  lineStroke: '#A43DF5',

  highlightShadow: '0 8px 32px rgba(0, 0, 0, 0.18)',
};

// ---------------------------------------------------------------------------
// Layout
// ---------------------------------------------------------------------------

export const LAYOUT = {
  sceneSize: 600,

  // Outer card (contains the table)
  cardMargin: 34,
  cardBorderRadius: 16,
  cardPadding: 16,

  // Table — each cell is an individual rounded rectangle
  cellHeight: 44,
  cellRadius: 4,
  cellGap: 4,
  cellPaddingX: 8,
  cellPaddingY: 10,
  columnWidths: [170, 100, 120, 140] as const, // TableName, Rows, LastUpdated, CreatedBy

  avatarSize: 20,
  avatarGap: 8,

  // Zoom scales the entire card
  initialScale: 0.82,
  zoomedScale: 1.2,
  zoomOriginX: 0,
  zoomOriginY: 0.4,

  // Compact golden card (Act 3 center) — matches Figma
  compactCardWidth: 195,
  compactCardHeight: 56,
  compactCardRadius: 16,

  // Stacked images (Act 3)
  imageRadius: 12,
};

// ---------------------------------------------------------------------------
// Timing (all in frames at 30 fps)
// ---------------------------------------------------------------------------

export const TIMING = {
  // Act 1: rows stagger in, then zoom + cursor together
  act1Start: 0,
  rowStaggerStart: 8,
  rowStaggerGap: 7,
  rowStaggerDuration: 10,
  zoomInStart: 48,
  zoomInEnd: 85,
  cursorEnterStart: 50,

  // Act 2: cursor arrives + hover + click + fade
  cursorArriveFrame: 82,
  hoverStart: 80,
  cursorClickFrame: 92,
  cursorFadeEnd: 100,
  dimOthersStart: 95,
  dimOthersEnd: 105,
  focusStart: 102,
  focusEnd: 110,

  // Act 3: container morphs to center + tag + images + highlights
  morphStart: 112,
  dimmedExitEnd: 112,
  morphEnd: 138,
  tagAppearFrame: 140,

  // Card slides up after morph
  cardMoveUpStart: 140,
  cardMoveUpEnd: 152,
  cardTopY: 50,

  // Stacked images entrance
  imagesAppearStart: 154,
  imagesStaggerGap: 6,

  // Sequential highlight phases
  highlightDuration: 14,
  highlight1Start: 178,
  highlight2Start: 212,
  highlight3Start: 246,

  fadeOutStart: 274,
  fadeOutEnd: 284,

  totalFrames: 288,
};

// ---------------------------------------------------------------------------
// Table data
// ---------------------------------------------------------------------------

export type TableRowData = {
  name: string;
  rows: string;
  lastUpdated: string;
  createdBy: string;
  avatarFile: string;
  avatarColor: string;
};

export const TABLE_DATA: TableRowData[] = [
  {
    name: 'customer_data',
    rows: '1,284,019',
    lastUpdated: '2 days ago',
    createdBy: 'Alex T',
    avatarFile: 'avatars/alex.jpg',
    avatarColor: '#7C3AED',
  },
  {
    name: 'customer_v2',
    rows: '1,281,445',
    lastUpdated: '3 months ago',
    createdBy: 'Jordan M',
    avatarFile: 'avatars/jordan.jpg',
    avatarColor: '#0891B2',
  },
  {
    name: 'cust_data_copy',
    rows: '1,284,019',
    lastUpdated: '6 months ago',
    createdBy: 'David Chen',
    avatarFile: 'avatars/david.jpg',
    avatarColor: '#059669',
  },
  {
    name: 'customer_data_final',
    rows: '1,147,882',
    lastUpdated: '1 year ago',
    createdBy: 'Mia',
    avatarFile: 'avatars/mia.jpg',
    avatarColor: '#DC2626',
  },
];

export const GOLDEN_ROW_INDEX = 0;

// ---------------------------------------------------------------------------
// Stacked images (cascading fan below the card)
// ---------------------------------------------------------------------------

export type ImageConfig = {
  left: number;
  top: number;
  width: number;
  height: number;
  file: string;
};

export const STACKED_IMAGES: ImageConfig[] = [
  { left: 316, top: 183, width: 550, height: 494, file: 'golden-table/Detailed Analysis1.png' },
  { left: 174, top: 246, width: 550, height: 494, file: 'golden-table/slack.png' },
  { left: 43,  top: 299, width: 450, height: 494, file: 'golden-table/dashboard.png' },
];
