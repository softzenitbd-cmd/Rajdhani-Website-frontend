import React, { useState } from 'react';
import { User, MapPin, Phone, Wallet, Settings, List, ShieldAlert } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { loanService } from '../../services/loanService';
import PrintHeader from '../../components/PrintHeader';
import { useToast } from '../../context/ToastContext';

const LoanClientCreate = () => {
  const toast = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: '',
    previous_due: '',
    max_due_limit: ''
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.phone) {
      toast.error("Loan Account Name and Phone Number are required.");
      return;
    }

    try {
      setLoading(true);
      await loanService.createLoanAccount({
        name: formData.name,
        phone: formData.phone,
        address: formData.address || '',
        previous_due: formData.previous_due || '0.00',
        max_due_limit: formData.max_due_limit || '0.00'
      });
      toast.success("Loan Account created successfully!");
      navigate('/loan/client-list');
    } catch (error) {
      console.error("Error creating loan account:", error);
      toast.error("Failed to create loan account. Please verify input and try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="premium-card">
      <PrintHeader />
      <div className="premium-header">
        <h2 className="premium-title" style={{ textTransform: 'uppercase' }}>Add New Loan Account</h2>
        <div className="header-actions">
          <button className="btn-icon">
            <Settings size={18} />
          </button>
          <button className="btn-gray-outline" onClick={() => navigate('/loan/client-list')}>
            <List size={16} /> Account List
          </button>
        </div>
      </div>

      <div className="premium-body" style={{ padding: '32px' }}>
        <form onSubmit={handleSubmit}>
          <div className="form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            
            {/* Account Name */}
            <div className="form-group">
              <div className="form-input floating-label">
                <User size={18} className="input-icon" />
                <input type="text" name="name" placeholder=" " value={formData.name} onChange={handleChange} required />
                <label>Loan Account Title (e.g. IDLC LOAN) *</label>
              </div>
            </div>

            {/* Phone */}
            <div className="form-group">
              <div className="form-input floating-label">
                <Phone size={18} className="input-icon" />
                <input type="text" name="phone" placeholder=" " value={formData.phone} onChange={handleChange} required />
                <label>Phone Number *</label>
              </div>
            </div>

            {/* Address */}
            <div className="form-group">
              <div className="form-input floating-label">
                <MapPin size={18} className="input-icon" />
                <input type="text" name="address" placeholder=" " value={formData.address} onChange={handleChange} />
                <label>Address</label>
              </div>
            </div>

            {/* Previous Due */}
            <div className="form-group">
              <div className="form-input floating-label">
                <Wallet size={18} className="input-icon" />
                <input type="number" step="0.01" name="previous_due" placeholder=" " value={formData.previous_due} onChange={handleChange} />
                <label>Previous Due Amount</label>
              </div>
            </div>

            {/* Max Due Limit */}
            <div className="form-group" style={{ gridColumn: 'span 2' }}>
              <div className="form-input floating-label">
                <ShieldAlert size={18} className="input-icon" />
                <input type="number" step="0.01" name="max_due_limit" placeholder=" " value={formData.max_due_limit} onChange={handleChange} />
                <label>Max Due Limit</label>
              </div>
            </div>

          </div>

          <button type="submit" className="btn-green" style={{ width: '100%', padding: '14px', fontSize: '16px', marginTop: '24px', background: 'var(--success)', color: 'white', border: 'none', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer' }} disabled={loading}>
            {loading ? 'Creating Loan Account...' : 'Add Loan Account'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default LoanClientCreate;
