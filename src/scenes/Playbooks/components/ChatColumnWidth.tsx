import React from 'react';
import { LAYOUT } from '../constants';

/**
 * Live chat-column inner width.
 *
 * Pre-Phase-7 the left side is centered in the full browser body and
 * the chat content uses the original LAYOUT.bubbleWidth (800px). During
 * the Phase 7 split this value lerps down to LAYOUT.leftColWidthSplit
 * so the bubble, conversation viewport, and follow-up input reflow
 * into the contracted left column.
 *
 * The default mirrors the pre-split value so any component that
 * happens to render outside the provider keeps its current behavior.
 */
export const ChatColumnWidthContext = React.createContext<number>(
  LAYOUT.bubbleWidth,
);

export const useChatColumnWidth = (): number =>
  React.useContext(ChatColumnWidthContext);
