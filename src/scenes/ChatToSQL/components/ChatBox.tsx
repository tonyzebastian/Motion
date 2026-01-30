import React from 'react';
import {
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
} from 'remotion';
import { COLORS, TIMING, CHAT_PROMPT, LAYOUT } from '../constants';

// ============================================
// Blinking Cursor Component
// ============================================

const Cursor: React.FC<{ frame: number; blinkFrames: number; opacity: number; fontSize: number }> = ({
  frame,
  blinkFrames,
  opacity: cursorOpacity,
  fontSize,
}) => {
  const blinkOpacity = interpolate(
    frame % blinkFrames,
    [0, blinkFrames / 2, blinkFrames],
    [1, 0, 1],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  return (
    <span
      style={{
        opacity: blinkOpacity * cursorOpacity,
        color: COLORS.purple,
        fontWeight: 500,
        fontSize: fontSize + 8, // Larger than text
        lineHeight: 1,
        display: 'inline',
        marginLeft: 1,
        position: 'relative',
        top: -2, // Move up slightly
      }}
    >
      |
    </span>
  );
};

// ============================================
// Arrow Button Component
// ============================================

const ArrowButton: React.FC<{ hasContent: boolean; opacity: number }> = ({ hasContent, opacity }) => {
  if (opacity <= 0) return null;
  
  return (
    <div
      style={{
        width: 32,
        height: 32,
        borderRadius: '50%',
        backgroundColor: hasContent ? COLORS.purpleLight : 'rgba(0, 0, 0, 0.04)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        opacity,
      }}
    >
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke={hasContent ? COLORS.purple : 'rgba(0, 0, 0, 0.4)'}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <line x1="12" y1="19" x2="12" y2="5" />
        <polyline points="5 12 12 5 19 12" />
      </svg>
    </div>
  );
};

// ============================================
// Main ChatBox Component (unified input + bubble)
// ============================================

export const ChatBox: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Calculate typed text based on frame
  const typingProgress = Math.max(0, frame - TIMING.typingStart);
  const charCount = Math.min(
    Math.floor(typingProgress * TIMING.charsPerFrame),
    CHAT_PROMPT.length
  );
  const typedText = CHAT_PROMPT.slice(0, charCount);
  const isTypingComplete = charCount >= CHAT_PROMPT.length;

  // Transition progress (center → final position, together with SQL card)
  const transitionProgress =
    frame >= TIMING.transitionStart
      ? spring({
          frame: frame - TIMING.transitionStart,
          fps,
          config: { damping: 200 },
        })
      : 0;

  // ============================================
  // Animated Properties (morphing from input to bubble)
  // ============================================

  // Position calculation - bubble moves to LEFT side
  const centerX = (LAYOUT.sceneWidth - LAYOUT.chatInputWidth) / 2;
  const centerY = (LAYOUT.sceneHeight - 70) / 2;
  
  // Left position: center → left margin
  const posLeft = interpolate(transitionProgress, [0, 1], [centerX, LAYOUT.chatBubbleLeft]);
  
  // Y position: center → final position (directly to Y2)
  const posY = interpolate(transitionProgress, [0, 1], [centerY, LAYOUT.chatBubbleY2]);

  
  // Padding: 20px → 14px 18px
  const paddingV = interpolate(transitionProgress, [0, 1], [20, 14]);
  const paddingH = interpolate(transitionProgress, [0, 1], [20, 18]);

  // Border radius: 16 → 14
  const borderRadius = interpolate(transitionProgress, [0, 1], [16, 14]);

  // Font size: 18 → 16
  const fontSize = interpolate(transitionProgress, [0, 1], [18, 16]);

  // Cursor opacity: fade out during transition
  const cursorOpacity = interpolate(
    transitionProgress,
    [0, 0.3],
    [1, 0],
    { extrapolateRight: 'clamp' }
  );

  // Arrow button opacity: fade out during transition
  const arrowOpacity = interpolate(
    transitionProgress,
    [0, 0.3],
    [1, 0],
    { extrapolateRight: 'clamp' }
  );

  // Show cursor only before transition and while typing/waiting
  const showCursor = frame < TIMING.transitionStart;

  // Box shadow transition (larger → smaller)
  const shadowOpacity = interpolate(transitionProgress, [0, 1], [0.06, 0.04]);

  // Determine what text to show
  const displayText = typedText || '';
  const showPlaceholder = !typedText && frame < TIMING.typingStart;

  // Two distinct states for flex/arrow behavior (but width now animates smoothly)
  const isInputState = transitionProgress < 0.95;
  
  // Width animates smoothly from input width to bubble width
  const boxWidth = interpolate(transitionProgress, [0, 1], [LAYOUT.chatInputWidth, LAYOUT.chatBubbleWidth]);

  return (
    <div
      style={{
        position: 'absolute',
        left: posLeft,
        top: posY,
        // Width animates simultaneously with position
        width: boxWidth,
        transformOrigin: 'top left',
      }}
    >
      <div
        style={{
          backgroundColor: COLORS.cardBg,
          borderRadius,
          border: '1px solid rgba(0, 0, 0, 0.15)',
          boxShadow: `0px 20px 60px -12px rgba(164, 61, 245, ${shadowOpacity}), 0px 8px 32px -8px rgba(164, 61, 245, ${shadowOpacity * 0.7})`,
          padding: `${paddingV}px ${paddingH}px`,
          // Fill parent width throughout the animation
          width: '100%',
          display: isInputState ? 'flex' : 'inline-flex',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            width: isInputState ? '100%' : 'auto',
          }}
        >
          {/* Text area - flex: 1 during input to push arrow to right */}
          <div
            style={{
              flex: isInputState ? 1 : 'none',
              fontSize,
              fontWeight: 500,
              color: displayText ? COLORS.text : 'rgba(0, 0, 0, 0.3)',
              fontFamily: "'Work Sans', system-ui, sans-serif",
              letterSpacing: interpolate(transitionProgress, [0, 1], [-0.5, -0.3]),
              lineHeight: 1.5,
              minHeight: interpolate(transitionProgress, [0, 1], [28, 22]),
              display: 'flex',
              alignItems: 'center',
              whiteSpace: 'nowrap',
            }}
          >
            {showPlaceholder ? (
              // Placeholder with cursor at beginning
              <>
                {showCursor && (
                  <Cursor 
                    frame={frame} 
                    blinkFrames={TIMING.cursorBlinkFrames} 
                    opacity={cursorOpacity}
                    fontSize={fontSize}
                  />
                )}
                <span style={{ color: 'rgba(0, 0, 0, 0.3)' }}>Ask anything...</span>
              </>
            ) : (
              // Typed text with cursor at end (only show cursor before transition)
              <span>{displayText}</span>
            )}
            {/* Blinking cursor - only during input state, not in bubble */}
            {showCursor && !showPlaceholder && (
              <Cursor 
                frame={frame} 
                blinkFrames={TIMING.cursorBlinkFrames} 
                opacity={cursorOpacity}
                fontSize={fontSize}
              />
            )}
          </div>

          {/* Arrow button - fixed on right during input, fades out during transition */}
          <ArrowButton hasContent={isTypingComplete} opacity={arrowOpacity} />
        </div>
      </div>
    </div>
  );
};
