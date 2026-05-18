import React from 'react';
import { REPORT_PALETTE } from '../../Playbooks/constants';

const FONT_FAMILY = "'Work Sans', system-ui, sans-serif";

type Props = {
  /** Section label, e.g. "LLM description" or "Content". */
  heading: string;
  /** Optional short description rendered below the heading. */
  subtitle?: string;
  children: React.ReactNode;
};

/**
 * One "form-style" section inside a playbook detail body: a small
 * uppercase label, an optional helper line, and the section body.
 * Mirrors the section style in the screenshot reference (LLM
 * DESCRIPTION / CONTENT) without rendering any form chrome.
 */
export const PlaybookDetailSection: React.FC<Props> = ({
  heading,
  subtitle,
  children,
}) => (
  <section style={{ marginBottom: 28 }}>
    <div
      style={{
        fontFamily: FONT_FAMILY,
        fontSize: 11,
        fontWeight: 600,
        letterSpacing: '1px',
        textTransform: 'uppercase',
        color: REPORT_PALETTE.mutedText,
        marginBottom: 6,
      }}
    >
      {heading}
    </div>
    {subtitle ? (
      <div
        style={{
          fontFamily: FONT_FAMILY,
          fontSize: 12.5,
          lineHeight: '18px',
          color: REPORT_PALETTE.mutedText,
          marginBottom: 12,
        }}
      >
        {subtitle}
      </div>
    ) : null}
    <div
      style={{
        // Card-style framing so the section reads like the form
        // preview in the screenshot without the input chrome.
        border: `1px solid ${REPORT_PALETTE.cardBorder}`,
        borderRadius: 10,
        padding: '14px 16px',
        backgroundColor: REPORT_PALETTE.sectionBackground,
        fontFamily: FONT_FAMILY,
        color: REPORT_PALETTE.bodyText,
      }}
    >
      {children}
    </div>
  </section>
);
