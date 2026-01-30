import React from 'react';
import { useCurrentFrame } from 'remotion';
import { COLORS, TIMING, SQL_CONTENT } from '../constants';

// ============================================
// SQL Token Types
// ============================================

type TokenType = 'keyword' | 'identifier' | 'string' | 'comment' | 'number' | 'operator' | 'text';

interface Token {
  type: TokenType;
  value: string;
}

// ============================================
// SQL Keywords (blue)
// ============================================

const SQL_KEYWORDS = [
  'WITH', 'AS', 'SELECT', 'FROM', 'WHERE', 'AND', 'OR', 'GROUP', 'BY',
  'ORDER', 'CASE', 'WHEN', 'THEN', 'ELSE', 'END', 'IN', 'NOT', 'NULL',
  'LIKE', 'BETWEEN', 'JOIN', 'LEFT', 'RIGHT', 'INNER', 'OUTER', 'ON',
  'HAVING', 'LIMIT', 'OFFSET', 'UNION', 'ALL', 'DISTINCT', 'INSERT',
  'UPDATE', 'DELETE', 'CREATE', 'ALTER', 'DROP', 'TABLE', 'INDEX',
  'OVER', 'CAST', 'SUM', 'COUNT', 'AVG', 'MIN', 'MAX', 'DOUBLE',
];

// ============================================
// SQL Identifiers (pink) - column names, etc.
// ============================================

const SQL_IDENTIFIERS = [
  'timestamp', 'country', 'revenue', 'region', 'country_new', 'value',
  'total_revenue', 'country_count', 'revenue_percentage',
];

// ============================================
// Tokenizer
// ============================================

const tokenize = (sql: string): Token[] => {
  const tokens: Token[] = [];
  let remaining = sql;

  while (remaining.length > 0) {
    // Check for comments
    if (remaining.startsWith('--')) {
      const endOfLine = remaining.indexOf('\n');
      const commentEnd = endOfLine === -1 ? remaining.length : endOfLine;
      tokens.push({ type: 'comment', value: remaining.slice(0, commentEnd) });
      remaining = remaining.slice(commentEnd);
      continue;
    }

    // Check for strings (single quotes)
    if (remaining.startsWith("'")) {
      const endQuote = remaining.indexOf("'", 1);
      if (endQuote !== -1) {
        tokens.push({ type: 'string', value: remaining.slice(0, endQuote + 1) });
        remaining = remaining.slice(endQuote + 1);
        continue;
      }
    }

    // Check for numbers
    const numberMatch = remaining.match(/^(\d+\.?\d*)/);
    if (numberMatch && (tokens.length === 0 || /[\s,(\[]/.test(tokens[tokens.length - 1]?.value?.slice(-1) || ' '))) {
      tokens.push({ type: 'number', value: numberMatch[1] });
      remaining = remaining.slice(numberMatch[1].length);
      continue;
    }

    // Check for words (keywords, identifiers)
    const wordMatch = remaining.match(/^([a-zA-Z_][a-zA-Z0-9_]*)/);
    if (wordMatch) {
      const word = wordMatch[1];
      const upperWord = word.toUpperCase();
      const lowerWord = word.toLowerCase();

      if (SQL_KEYWORDS.includes(upperWord)) {
        tokens.push({ type: 'keyword', value: word });
      } else if (SQL_IDENTIFIERS.includes(lowerWord) || SQL_IDENTIFIERS.includes(word)) {
        tokens.push({ type: 'identifier', value: word });
      } else {
        tokens.push({ type: 'text', value: word });
      }
      remaining = remaining.slice(word.length);
      continue;
    }

    // Check for operators and punctuation
    const opMatch = remaining.match(/^(>=|<=|<>|!=|[=<>(),;.*+\-/\[\]])/);
    if (opMatch) {
      tokens.push({ type: 'operator', value: opMatch[1] });
      remaining = remaining.slice(opMatch[1].length);
      continue;
    }

    // Whitespace and other characters
    tokens.push({ type: 'text', value: remaining.charAt(0) });
    remaining = remaining.slice(1);
  }

  return tokens;
};

// ============================================
// Get Color for Token Type (Figma colors)
// ============================================

const getTokenColor = (type: TokenType): string => {
  switch (type) {
    case 'keyword':
      return COLORS.sqlKeyword;      // Blue #2372e9
    case 'identifier':
      return COLORS.sqlIdentifier;   // Pink #fd2b68
    case 'string':
      return COLORS.sqlString;       // Green
    case 'comment':
      return COLORS.sqlComment;      // Gray
    case 'number':
      return COLORS.text;
    case 'operator':
      return COLORS.text;
    default:
      return COLORS.text;
  }
};

// ============================================
// Render SQL with Syntax Highlighting
// ============================================

const HighlightedSQL: React.FC<{ sql: string }> = ({ sql }) => {
  const tokens = tokenize(sql);

  // Group tokens by line for line numbers
  const lineElements: React.ReactNode[] = [];
  let currentLineTokens: Token[] = [];
  let lineNumber = 1;

  for (const token of tokens) {
    if (token.value.includes('\n')) {
      // Handle tokens with newlines
      const parts = token.value.split('\n');
      for (let i = 0; i < parts.length; i++) {
        if (parts[i]) {
          currentLineTokens.push({ ...token, value: parts[i] });
        }
        if (i < parts.length - 1) {
          // End of line - render it
          lineElements.push(
            <div key={lineNumber} style={{ display: 'flex', minHeight: 20 }}>
              <span
                style={{
                  width: 24,
                  color: COLORS.text,
                  opacity: 0.3,
                  fontSize: 14,
                  fontFamily: "'Roboto Mono', 'Inconsolata', monospace",
                  textAlign: 'right',
                  paddingRight: 12,
                  flexShrink: 0,
                  userSelect: 'none',
                  letterSpacing: -0.5,
                }}
              >
                {lineNumber}
              </span>
              <span style={{ flex: 1 }}>
                {currentLineTokens.map((t, idx) => (
                  <span
                    key={idx}
                    style={{
                      color: getTokenColor(t.type),
                      fontFamily: "'Inconsolata', 'Roboto Mono', monospace",
                      fontSize: 15,
                      lineHeight: '20px',
                      letterSpacing: -0.5,
                    }}
                  >
                    {t.value}
                  </span>
                ))}
              </span>
            </div>
          );
          lineNumber++;
          currentLineTokens = [];
        }
      }
    } else {
      currentLineTokens.push(token);
    }
  }

  // Add last line if there are remaining tokens
  if (currentLineTokens.length > 0) {
    lineElements.push(
      <div key={lineNumber} style={{ display: 'flex', minHeight: 20 }}>
        <span
          style={{
            width: 24,
            color: COLORS.text,
            opacity: 0.3,
            fontSize: 14,
            fontFamily: "'Roboto Mono', 'Inconsolata', monospace",
            textAlign: 'right',
            paddingRight: 12,
            flexShrink: 0,
            userSelect: 'none',
            letterSpacing: -0.5,
          }}
        >
          {lineNumber}
        </span>
        <span style={{ flex: 1 }}>
          {currentLineTokens.map((t, idx) => (
            <span
              key={idx}
              style={{
                color: getTokenColor(t.type),
                fontFamily: "'Inconsolata', 'Roboto Mono', monospace",
                fontSize: 15,
                lineHeight: '20px',
                letterSpacing: -0.5,
              }}
            >
              {t.value}
            </span>
          ))}
        </span>
      </div>
    );
  }

  return <>{lineElements}</>;
};

// ============================================
// Main SQLContent Component
// ============================================

export const SQLContent: React.FC = () => {
  const frame = useCurrentFrame();

  // Calculate how much SQL to show based on streaming animation
  const streamingProgress = Math.max(0, frame - TIMING.sqlStreamStart);
  const charCount = Math.min(
    Math.floor(streamingProgress * TIMING.sqlCharsPerFrame),
    SQL_CONTENT.length
  );
  const visibleSQL = SQL_CONTENT.slice(0, charCount);

  return (
    <div
      style={{
        lineHeight: 1.4,
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          display: 'flex',
          gap: 12,
        }}
      >
        <div style={{ flex: 1 }}>
          <HighlightedSQL sql={visibleSQL} />
        </div>
      </div>
    </div>
  );
};
