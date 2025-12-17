import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';

interface YearSelectProps {
  selectedYear: number;
  onChange: (year: number) => void;
}

const YearSelect: React.FC<YearSelectProps> = ({ selectedYear, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Generate years range (e.g., 2020 - 2030)
  const years = Array.from({ length: 11 }, (_, i) => 2020 + i);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
        e.preventDefault();
        setIsOpen(true);
        setFocusedIndex(years.indexOf(selectedYear));
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setFocusedIndex(prev => (prev < years.length - 1 ? prev + 1 : prev));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setFocusedIndex(prev => (prev > 0 ? prev - 1 : prev));
        break;
      case 'Enter':
      case ' ':
        e.preventDefault();
        if (focusedIndex >= 0) {
          onChange(years[focusedIndex]);
          setIsOpen(false);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setIsOpen(false);
        break;
    }
  };

  // Scroll focused item into view
  useEffect(() => {
    if (isOpen && listRef.current && focusedIndex >= 0) {
      const list = listRef.current;
      const item = list.children[focusedIndex] as HTMLElement;
      if (item) {
        const itemTop = item.offsetTop;
        const itemBottom = itemTop + item.offsetHeight;
        const listTop = list.scrollTop;
        const listBottom = listTop + list.offsetHeight;

        if (itemTop < listTop) {
          list.scrollTop = itemTop;
        } else if (itemBottom > listBottom) {
          list.scrollTop = itemBottom - list.offsetHeight;
        }
      }
    }
  }, [focusedIndex, isOpen]);

  return (
    <div className="year-select-container" ref={containerRef}>
      <button
        type="button"
        className="year-select-trigger"
        onClick={() => setIsOpen(!isOpen)}
        onKeyDown={handleKeyDown}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        {selectedYear}
        <ChevronDown size={14} />
      </button>

      {isOpen && (
        <div className="year-dropdown" role="listbox" ref={listRef}>
          {years.map((year, index) => (
            <div
              key={year}
              role="option"
              aria-selected={year === selectedYear}
              className={`year-option ${year === selectedYear ? 'selected' : ''} ${index === focusedIndex ? 'focused' : ''}`}
              onClick={() => {
                onChange(year);
                setIsOpen(false);
              }}
              onMouseEnter={() => setFocusedIndex(index)}
            >
              {year}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default YearSelect;
