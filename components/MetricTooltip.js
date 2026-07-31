'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Info } from 'lucide-react';

/**
 * MetricTooltip
 * Interactive definition popover for desktop (hover) and mobile (tap/click).
 *
 * Props:
 * - title: string (e.g. "Readiness Score")
 * - description: string | ReactNode (Detailed explanation)
 * - formula: string (Optional formula representation)
 * - tiers: Array<{ label: string, range: string, color: string, text: string }> (Optional score ranges)
 * - position: 'top' | 'bottom' | 'left' | 'right' (default 'top')
 * - iconSize: number (default 15)
 * - style: object (Optional wrapper style overrides)
 */
export default function MetricTooltip({
  title,
  description,
  formula,
  tiers,
  position = 'top',
  iconSize = 15,
  style = {}
}) {
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef(null);

  // Close when clicking outside or pressing Escape
  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }

    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const toggleOpen = (e) => {
    e.stopPropagation();
    setIsOpen(prev => !prev);
  };

  return (
    <span
      className="metric-tooltip-wrapper"
      ref={wrapperRef}
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
      style={style}
    >
      <button
        type="button"
        className={`metric-tooltip-trigger ${isOpen ? 'active' : ''}`}
        onClick={toggleOpen}
        aria-label={`Definition for ${title || 'metric'}`}
        title={`View definition for ${title || 'metric'}`}
      >
        <Info size={iconSize} />
      </button>

      {isOpen && (
        <div className={`metric-tooltip-popover pos-${position}`} role="tooltip">
          {title && <h4 className="tooltip-title">{title}</h4>}
          
          {description && (
            <div className="tooltip-description">
              {typeof description === 'string' ? <p>{description}</p> : description}
            </div>
          )}

          {formula && (
            <div className="tooltip-formula-box">
              <span className="tooltip-formula-label">FORMULA</span>
              <code className="tooltip-formula-code">{formula}</code>
            </div>
          )}

          {tiers && tiers.length > 0 && (
            <div className="tooltip-tiers-list">
              <span className="tooltip-tiers-header">SCORE TIERS & BREAKDOWN</span>
              {tiers.map((tier, idx) => (
                <div key={idx} className="tooltip-tier-item">
                  <span
                    className="tooltip-tier-badge"
                    style={{ backgroundColor: tier.color || 'var(--color-accent)' }}
                  >
                    {tier.range}
                  </span>
                  <span className="tooltip-tier-text">
                    <strong>{tier.label}:</strong> {tier.text}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </span>
  );
}
