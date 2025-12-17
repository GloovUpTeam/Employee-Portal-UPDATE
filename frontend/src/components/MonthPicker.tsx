import React, { useState, useEffect, useRef, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';
import YearSelect from './YearSelect';
import '../styles/month-picker.css';

/**
 * MonthPicker Component
 * 
 * Renders a popup for selecting a date (Year -> Month -> Day).
 * 
 * Features:
 * - Portaled to document.body to avoid z-index issues.
 * - Anchored to a reference element (anchorRef).
 * - Smart positioning: flips up/left if viewport edges are hit.
 * - Focus trap for accessibility.
 * - Closes on outside click or ESC key.
 * 
 * Usage:
 * <MonthPicker 
 *   anchorRef={buttonRef} 
 *   initialDate={new Date()} 
 *   onSelect={(date) => console.log(date)} 
 *   onClose={() => setOpen(false)} 
 * />
 */

interface MonthPickerProps {
  anchorRef: React.RefObject<HTMLElement>;
  initialDate: Date;
  onSelect: (date: Date) => void;
  onClose: () => void;
}

const MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

const MonthPicker: React.FC<MonthPickerProps> = ({
  anchorRef,
  initialDate,
  onSelect,
  onClose
}) => {
  const [year, setYear] = useState(initialDate.getFullYear());
  const [month, setMonth] = useState(initialDate.getMonth());
  const [selectedDate, setSelectedDate] = useState(initialDate.getDate());
  
  const popupRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState<{ top: number; left: number } | null>(null);

  // 1. Calculate Position with Viewport Collision Detection
  useLayoutEffect(() => {
    if (anchorRef.current && popupRef.current) {
      const anchorRect = anchorRef.current.getBoundingClientRect();
      const popupRect = popupRef.current.getBoundingClientRect();
      
      const GAP = 8;
      const PADDING = 16; // Minimum distance from screen edge

      let top = anchorRect.bottom + GAP + window.scrollY;
      let left = anchorRect.left + window.scrollX;

      // Check Right Edge
      if (left + popupRect.width > window.innerWidth + window.scrollX - PADDING) {
        left = (window.innerWidth + window.scrollX) - popupRect.width - PADDING;
      }
      // Check Left Edge
      if (left < PADDING + window.scrollX) {
        left = PADDING + window.scrollX;
      }

      // Check Bottom Edge
      const viewportBottom = window.innerHeight + window.scrollY;
      if (top + popupRect.height > viewportBottom - PADDING) {
        // Check if there is more space above
        const spaceBelow = viewportBottom - top;
        const spaceAbove = anchorRect.top + window.scrollY - PADDING;
        
        if (spaceAbove > spaceBelow && spaceAbove > popupRect.height) {
           // Flip to top
           top = anchorRect.top + window.scrollY - popupRect.height - GAP;
        }
      }

      setPosition({ top, left });
    }
  }, [anchorRef]);

  // 2. Handle Outside Click & ESC
  useEffect(() => {
    const handleMouseDown = (e: MouseEvent) => {
      // Check if click is outside popup AND outside anchor button
      if (
        popupRef.current && 
        !popupRef.current.contains(e.target as Node) && 
        anchorRef.current && 
        !anchorRef.current.contains(e.target as Node)
      ) {
        onClose();
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose, anchorRef]);

  // 3. Focus Trap
  useEffect(() => {
    const popup = popupRef.current;
    if (!popup) return;

    // Find all focusable elements
    const focusableElements = popup.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    
    if (focusableElements.length === 0) return;

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    const handleTab = (e: KeyboardEvent) => {
      if (e.key === 'Tab') {
        if (e.shiftKey) {
          // Shift + Tab
          if (document.activeElement === firstElement) {
            e.preventDefault();
            lastElement.focus();
          }
        } else {
          // Tab
          if (document.activeElement === lastElement) {
            e.preventDefault();
            firstElement.focus();
          }
        }
      }
    };

    popup.addEventListener('keydown', handleTab);
    
    // Focus the first element (Year selector or first month)
    // We use a small timeout to ensure render is complete and browser is ready
    const timer = setTimeout(() => firstElement.focus(), 50);

    return () => {
      popup.removeEventListener('keydown', handleTab);
      clearTimeout(timer);
    };
  }, []);

  // Calculate days in selected month/year
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  const handleDateClick = (d: number) => {
    const newDate = new Date(year, month, d);
    onSelect(newDate);
  };

  // Render via Portal
  return createPortal(
    <div className="month-picker-portal">
      <div 
        ref={popupRef}
        className="month-picker-popup"
        style={{ 
          top: position ? position.top : -9999, 
          left: position ? position.left : -9999,
          opacity: position ? 1 : 0 // Hide until positioned
        }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="picker-title"
      >
        <div className="picker-header">
          <span id="picker-title" className="picker-title">Select Date</span>
          <YearSelect selectedYear={year} onChange={setYear} />
        </div>

        <div className="month-grid" role="grid" aria-label="Month Selection">
          {MONTHS.map((m, idx) => (
            <button
              key={m}
              type="button"
              className={`month-btn ${month === idx ? 'selected' : ''}`}
              onClick={() => setMonth(idx)}
              aria-selected={month === idx}
              tabIndex={0}
            >
              {m}
            </button>
          ))}
        </div>

        <div className="days-container" role="listbox" aria-label="Day Selection">
          {days.map(d => (
            <button
              key={d}
              type="button"
              className={`day-btn ${selectedDate === d ? 'selected' : ''}`}
              onClick={() => handleDateClick(d)}
              aria-selected={selectedDate === d}
              tabIndex={0}
            >
              {d}
            </button>
          ))}
        </div>
      </div>
    </div>,
    document.body
  );
};

export default MonthPicker;
