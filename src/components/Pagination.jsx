import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const Pagination = ({ currentPage, totalItems, pageSize, onPageChange }) => {
  const { t } = useTranslation();
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  
  if (totalItems === 0) return null;

  const startItem = (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems);

  // Calculate page numbers to show
  const getPageNumbers = () => {
    const pages = [];
    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (currentPage <= 3) {
        pages.push(1, 2, 3, 4, '...', totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
      } else {
        pages.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages);
      }
    }
    return pages;
  };

  const btnStyle = {
    padding: '6px 12px',
    border: '1px solid #cbd5e1',
    background: 'white',
    color: '#334155',
    cursor: 'pointer',
    borderRadius: '4px',
    fontWeight: '500',
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
  };

  const activeBtnStyle = {
    ...btnStyle,
    background: '#3b82f6',
    color: 'white',
    borderColor: '#3b82f6',
  };

  const disabledBtnStyle = {
    ...btnStyle,
    opacity: 0.5,
    cursor: 'not-allowed',
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px', flexWrap: 'wrap', gap: '16px' }}>
      <div style={{ fontSize: 'var(--fs-13, 13px)', color: '#64748b' }}>
        {t("Showing")} <span style={{ fontWeight: 'bold', color: '#334155' }}>{startItem}</span> {t("to")} <span style={{ fontWeight: 'bold', color: '#334155' }}>{endItem}</span> {t("of")} <span style={{ fontWeight: 'bold', color: '#334155' }}>{totalItems}</span> {t("entries")}
      </div>

      <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '4px' }}>
        <button 
          onClick={() => currentPage > 1 && onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          style={currentPage === 1 ? disabledBtnStyle : btnStyle}
        >
          <ChevronLeft size={16} /> {t("Previous")}
        </button>

        {getPageNumbers().map((num, i) => (
          num === '...' ? (
            <span key={`dots-${i}`} style={{ padding: '6px 8px', color: '#64748b' }}>...</span>
          ) : (
            <button
              key={num}
              onClick={() => onPageChange(num)}
              style={currentPage === num ? activeBtnStyle : btnStyle}
            >
              {num}
            </button>
          )
        ))}

        <button 
          onClick={() => currentPage < totalPages && onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          style={currentPage === totalPages ? disabledBtnStyle : btnStyle}
        >
          {t("Next")} <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
};

export default Pagination;
