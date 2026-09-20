import React from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { format, parseISO, isValid, parse } from 'date-fns';

const CustomDatePicker = ({ value, onChange, name, style, className, disabled, required, placeholder }) => {
  let selectedDate = null;
  if (value) {
    if (value instanceof Date && isValid(value)) {
      selectedDate = value;
    } else if (typeof value === 'string') {
      let parsed = parseISO(value);
      if (!isValid(parsed)) {
        parsed = parse(value, 'yyyy-MM-dd', new Date());
      }
      if (isValid(parsed)) {
        selectedDate = parsed;
      }
    }
  }

  const handleChange = (date) => {
    if (onChange) {
      const fakeEvent = {
        target: {
          name: name || '',
          value: date ? format(date, 'yyyy-MM-dd') : '',
          type: 'date'
        }
      };
      onChange(fakeEvent);
    }
  };

  return (
    <div className="custom-datepicker-wrapper" style={{ width: style?.width || '100%', height: style?.height || '100%' }}>
      <DatePicker
        selected={selectedDate}
        onChange={handleChange}
        dateFormat="dd-MM-yyyy"
        placeholderText={placeholder || "dd-mm-yyyy"}
        name={name}
        disabled={disabled}
        required={required}
        className={`custom-datepicker-input ${className || ''}`}
        customInput={<input style={{ ...style, width: '100%' }} />}
      />
    </div>
  );
};

export default CustomDatePicker;
