import React, { useState, useEffect } from 'react';
import { useToast } from '../context/ToastContext';

const AddOptionModal = ({ isOpen, onClose, onSave, title, label, placeholder, initialValue = '' }) => {
  const [inputValue, setInputValue] = useState('');
  const toast = useToast();

  useEffect(() => {
    if (isOpen) {
      setInputValue(initialValue);
    }
  }, [isOpen, initialValue]);

  if (!isOpen) return null;

  const handleSave = () => {
    if (!inputValue.trim()) {
      toast.error(`Please enter ${label ? label.toLowerCase() : 'a value'}`);
      return;
    }
    onSave(inputValue.trim());
    toast.success("Saved successfully!");
    setInputValue('');
    onClose();
  };

  const handleClose = () => {
    setInputValue('');
    onClose();
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
    }}>
      <div style={{ background: 'white', borderRadius: '8px', width: '400px', overflow: 'hidden' }}>
        <div style={{ padding: '16px 24px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ margin: 0, fontSize: '16px' }}>{title || 'Add Option'}</h3>
          <button type="button" onClick={handleClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '20px' }}>&times;</button>
        </div>
        <div style={{ padding: '24px' }}>
          <div className="form-group" style={{ marginBottom: '16px' }}>
            {label && <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px' }}>{label}</label>}
            <div className="form-input">
              <input 
                type="text" 
                value={inputValue} 
                onChange={(e) => setInputValue(e.target.value)} 
                placeholder={placeholder || `Enter ${label ? label.toLowerCase() : 'value'}`}
                style={{ width: '100%', padding: '8px', border: '1px solid #e2e8f0', borderRadius: '4px' }}
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleSave();
                  }
                }}
              />
            </div>
          </div>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
            <button type="button" onClick={handleClose} style={{ padding: '8px 16px', border: '1px solid #e2e8f0', background: 'white', borderRadius: '4px', cursor: 'pointer' }}>Cancel</button>
            <button type="button" onClick={handleSave} style={{ padding: '8px 16px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Save</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddOptionModal;
