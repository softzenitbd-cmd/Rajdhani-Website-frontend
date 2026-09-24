import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, X, ChevronDown, ChevronUp } from 'lucide-react';

/**
 * SearchableSelect dropdown matching Image 2 UI:
 * - Trigger box showing currently selected option or placeholder
 * - Popup with dedicated grey search input bar at top
 * - Bright blue background (#2563eb) for active/highlighted item with white text
 * - Full Keyboard Navigation (ArrowUp / ArrowDown / Enter / Escape)
 * - Auto-focus search input when opened & continuous entry support
 */
const SearchableSelect = ({
  options = [],
  value = '',
  onChange,
  placeholder = 'Select...',
  onAddClick,
  disabled = false,
  clearOnSelect = false,
  hideOptionsUntilSearch = false,
  searchPlaceholder = '',
  pushContentBelow = false,
  className = '',
  style = {}
}) => {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(0);

  const containerRef = useRef(null);
  const searchInputRef = useRef(null);
  const listRef = useRef(null);

  // Find currently selected option
  const selectedOption = options.find((opt) => String(opt.value) === String(value));

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen]);

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // A "type to search" select waits for 2 characters before listing anything,
  // the same as the CRM this screen mirrors.
  const MIN_SEARCH_CHARS = 2;
  const needsMoreChars =
    hideOptionsUntilSearch && searchTerm.trim().length < MIN_SEARCH_CHARS;

  // Filter options based on search term
  const filteredOptions = options.filter((opt) => {
    if (needsMoreChars) return false;
    if (!searchTerm) return true;
    const query = searchTerm.toLowerCase();
    const labelMatch = (opt.label || '').toLowerCase().includes(query);
    const searchValMatch = opt.searchValue ? (opt.searchValue || '').toLowerCase().includes(query) : false;
    return labelMatch || searchValMatch;
  });

  // Reset highlighted index when search term or options change
  useEffect(() => {
    setHighlightedIndex(0);
  }, [searchTerm, options.length]);

  // Scroll highlighted item into view
  useEffect(() => {
    if (isOpen && listRef.current) {
      const items = listRef.current.querySelectorAll('.searchable-option-item');
      if (items[highlightedIndex]) {
        items[highlightedIndex].scrollIntoView({ block: 'nearest' });
      }
    }
  }, [highlightedIndex, isOpen]);

  const toggleDropdown = () => {
    if (disabled) return;
    setIsOpen((prev) => !prev);
  };

  const handleSelectOption = (opt) => {
    if (!opt) return;
    onChange(opt.value);
    if (clearOnSelect) {
      setSearchTerm('');
      setIsOpen(true);
      setTimeout(() => {
        if (searchInputRef.current) searchInputRef.current.focus();
      }, 30);
    } else {
      setIsOpen(false);
    }
  };

  const handleKeyDown = (e) => {
    if (disabled) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (!isOpen) {
        setIsOpen(true);
        return;
      }
      if (filteredOptions.length > 0) {
        setHighlightedIndex((prev) => (prev + 1) % filteredOptions.length);
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (!isOpen) {
        setIsOpen(true);
        return;
      }
      if (filteredOptions.length > 0) {
        setHighlightedIndex((prev) => (prev - 1 + filteredOptions.length) % filteredOptions.length);
      }
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (isOpen && filteredOptions.length > 0) {
        const target = filteredOptions[highlightedIndex] || filteredOptions[0];
        if (target) {
          handleSelectOption(target);
        }
      } else if (!isOpen) {
        setIsOpen(true);
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setIsOpen(false);
    }
  };

  const handleClear = (e) => {
    e.stopPropagation();
    onChange('');
    setSearchTerm('');
    setIsOpen(false);
  };

  return (
    <div
      ref={containerRef}
      style={{ position: 'relative', width: '100%', ...style }}
      className={`searchable-select-container ${className}`}
    >
      {/* Outer Trigger Box (Top Header) */}
      <div
        className="input-with-append"
        style={{
          display: 'flex',
          alignItems: 'center',
          border: '1px solid #cbd5e1',
          borderRadius: '4px',
          background: disabled ? '#f1f5f9' : 'white',
          overflow: 'hidden'
        }}
      >
        <div
          onClick={toggleDropdown}
          onKeyDown={handleKeyDown}
          tabIndex={disabled ? -1 : 0}
          style={{
            position: 'relative',
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '10px 32px 10px 12px',
            fontSize: 'var(--fs-13, 13px)',
            color: selectedOption ? '#0f172a' : '#64748b',
            fontWeight: selectedOption ? '600' : 'normal',
            cursor: disabled ? 'not-allowed' : 'pointer',
            userSelect: 'none',
            outline: 'none'
          }}
        >
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {selectedOption ? selectedOption.label : placeholder}
          </span>

          <div
            style={{
              position: 'absolute',
              right: '8px',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            {value && !clearOnSelect ? (
              <button
                type="button"
                className="clear-btn"
                onClick={handleClear}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#64748b',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  padding: '2px'
                }}
                title={t("Clear selection")}
              >
                <X size={16} />
              </button>
            ) : (
              isOpen ? <ChevronUp size={16} style={{ color: '#64748b' }} /> : <ChevronDown size={16} style={{ color: '#94a3b8' }} />
            )}
          </div>
        </div>

        {onAddClick && (
          <button
            type="button"
            className="append-btn"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onAddClick(e);
            }}
            disabled={disabled}
            style={{
              background: '#10b981',
              color: 'white',
              border: 'none',
              padding: '10px 14px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}
            title={t("Add New")}
          >
            <Plus size={18} />
          </button>
        )}
      </div>

      {/* Dropdown Popup Container matching Image 2.
          `pushContentBelow` keeps the list in the flow so it moves whatever is
          under it further down instead of covering it — the invoice product
          picker needs that, otherwise the list hides the items table. */}
      {isOpen && !disabled && (
        <div
          style={{
            position: pushContentBelow ? 'relative' : 'absolute',
            top: pushContentBelow ? 'auto' : '100%',
            left: 0,
            right: 0,
            marginTop: '4px',
            background: 'white',
            border: '1px solid #94a3b8',
            borderRadius: '4px',
            boxShadow: '0 8px 20px rgba(0, 0, 0, 0.18)',
            zIndex: 1000,
            overflow: 'hidden'
          }}
        >
          {/* Top Grey Search Input Container (Image 2 style) */}
          <div
            style={{
              padding: '6px',
              background: '#e2e8f0',
              borderBottom: '1px solid #cbd5e1'
            }}
          >
            <input
              ref={searchInputRef}
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={searchPlaceholder}
              style={{
                width: '100%',
                padding: '5px 8px',
                border: '1px solid #475569',
                borderRadius: '2px',
                background: '#cbd5e1',
                fontSize: 'var(--fs-13, 13px)',
                color: '#0f172a',
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />
          </div>

          {/* Options List */}
          <div
            ref={listRef}
            style={{
              maxHeight: '220px',
              overflowY: 'auto',
              fontSize: 'var(--fs-13, 13px)'
            }}
          >
            {needsMoreChars ? (
              <div style={{ padding: '10px 12px', color: '#475569' }}>
                {t("Please enter {{count}} or more characters", { count: MIN_SEARCH_CHARS })}
              </div>
            ) : filteredOptions.length === 0 ? (
              <div style={{ padding: '12px', textAlign: 'center', color: '#94a3b8' }}>
                {t("No matches found")}
              </div>
            ) : (
              filteredOptions.map((opt, idx) => {
                const isSelected = String(opt.value) === String(value);
                const isHighlighted = idx === highlightedIndex;

                return (
                  <div
                    key={opt.value}
                    className="searchable-option-item"
                    onClick={() => handleSelectOption(opt)}
                    onMouseEnter={() => setHighlightedIndex(idx)}
                    style={{
                      padding: '7px 12px',
                      cursor: 'pointer',
                      background: isHighlighted ? '#2563eb' : (isSelected ? '#3b82f6' : 'white'),
                      color: isHighlighted || isSelected ? '#ffffff' : '#0f172a',
                      fontWeight: isHighlighted || isSelected ? '600' : 'normal',
                      borderBottom: '1px solid #f1f5f9',
                      transition: 'background 0.05s ease'
                    }}
                  >
                    {opt.label}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchableSelect;

