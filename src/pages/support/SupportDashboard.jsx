import React from 'react';
import { CreditCard, User, Bookmark, FileText, CheckCircle, Ticket, MessageSquare, Briefcase, HelpCircle, Monitor } from 'lucide-react';

// Vendor support portal (no API in this project – opens the Softzen IT support site)
const SUPPORT_URL = 'https://softzenit.com';
const openSupport = () => window.open(SUPPORT_URL, '_blank', 'noopener');

const SupportDashboard = () => {
  return (
    <div style={{ padding: '24px', background: '#f8fafc', minHeight: '100vh', fontFamily: 'sans-serif' }}>
      <div style={{ display: 'flex', gap: '24px', maxWidth: '1200px', margin: '0 auto' }}>
        
        {/* Left Column */}
        <div style={{ width: '280px', display: 'flex', flexDirection: 'column', gap: '24px', flexShrink: 0 }}>
          
          {/* Available Funds */}
          <div style={{ background: 'white', borderRadius: '12px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#10b981', fontWeight: 'bold', marginBottom: '16px' }}>
              <CreditCard size={20} />
              <span>Available Funds</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '28px', fontWeight: 'bold' }}>0</span>
              <button onClick={openSupport} style={{ border: '1px solid #10b981', background: 'transparent', color: '#10b981', padding: '6px 12px', borderRadius: '20px', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
                + Add
              </button>
            </div>
          </div>

          {/* Your Info */}
          <div style={{ background: 'white', borderRadius: '12px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#3b82f6', fontWeight: 'bold', marginBottom: '16px' }}>
              <User size={20} />
              <span>Your Info</span>
            </div>
            <div style={{ fontSize: '13px', color: '#475569', lineHeight: '1.6' }}>
              <div style={{ fontWeight: 'bold', color: '#0f172a', marginBottom: '4px' }}>Md Rofiqul Islam Rofiq</div>
              <div>rajdhani013@gmail.com</div>
              <div>01727902498</div>
              <div style={{ marginTop: '8px' }}>Moonsur Plaza,Main Bus stand<br/>Kaligonj</div>
            </div>
          </div>

          {/* Shortcuts */}
          <div style={{ background: 'white', borderRadius: '12px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#f59e0b', fontWeight: 'bold', marginBottom: '16px' }}>
              <Bookmark size={20} />
              <span>Shortcuts</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#10b981' }}>
              <span style={{ cursor: 'pointer' }}>Tickets</span>
              <span style={{ cursor: 'pointer' }}>Invoices</span>
            </div>
            <div style={{ marginTop: '16px', fontSize: '13px', color: '#475569', cursor: 'pointer' }}>Services</div>
          </div>

        </div>

        {/* Right Column */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Top 4 Stats Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
            {/* Billing */}
            <div style={{ background: 'white', borderRadius: '12px', padding: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <span style={{ background: '#ecfdf5', color: '#10b981', padding: '4px 12px', borderRadius: '16px', fontSize: '12px', fontWeight: '500' }}>Billing</span>
                <FileText size={18} color="#10b981" />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '13px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#64748b' }}>Total Invoice</span><span style={{ fontWeight: 'bold' }}>32500</span></div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#64748b' }}>Renewal Bill</span><span style={{ fontWeight: 'bold' }}>5000</span></div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#64748b' }}>Total Services</span><span style={{ fontWeight: 'bold' }}>7</span></div>
              </div>
            </div>

            {/* Payment */}
            <div style={{ background: 'white', borderRadius: '12px', padding: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <span style={{ background: '#ecfdf5', color: '#10b981', padding: '4px 12px', borderRadius: '16px', fontSize: '12px', fontWeight: '500' }}>Payment</span>
                <CreditCard size={18} color="#10b981" />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '13px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#64748b' }}>Total Bill</span><span style={{ fontWeight: 'bold' }}>37500.00</span></div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#64748b' }}>Total Paid</span><span style={{ fontWeight: 'bold' }}>23000.00</span></div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#64748b' }}>Due Amount</span><span style={{ fontWeight: 'bold', color: '#ef4444' }}>14500</span></div>
              </div>
            </div>

            {/* Tickets */}
            <div style={{ background: 'white', borderRadius: '12px', padding: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <span style={{ background: '#fffbeb', color: '#f59e0b', padding: '4px 12px', borderRadius: '16px', fontSize: '12px', fontWeight: '500' }}>Tickets</span>
                <MessageSquare size={18} color="#f59e0b" />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '13px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#64748b' }}>Total</span><span style={{ fontWeight: 'bold' }}>41</span></div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#64748b' }}>Open</span><span style={{ fontWeight: 'bold' }}>0</span></div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#64748b' }}>Conversations</span><span style={{ fontWeight: 'bold' }}>72</span></div>
              </div>
            </div>

            {/* Status */}
            <div style={{ background: 'white', borderRadius: '12px', padding: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <span style={{ background: '#eff6ff', color: '#3b82f6', padding: '4px 12px', borderRadius: '16px', fontSize: '12px', fontWeight: '500' }}>Status</span>
                <CheckCircle size={18} color="#3b82f6" />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '13px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#64748b' }}>Pending</span><span style={{ fontWeight: 'bold' }}>0</span></div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#64748b' }}>Working</span><span style={{ fontWeight: 'bold' }}>0</span></div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#64748b' }}>Solved</span><span style={{ fontWeight: 'bold' }}>41</span></div>
              </div>
            </div>
          </div>

          {/* Latest Ticket */}
          <div style={{ background: 'white', borderRadius: '12px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#10b981', fontWeight: 'bold', fontSize: '16px' }}>
                <Ticket size={20} />
                <span>Latest Ticket</span>
              </div>
              <button onClick={openSupport} style={{ background: '#10b981', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '20px', fontWeight: '500', fontSize: '13px', cursor: 'pointer' }}>
                + Ticket List
              </button>
            </div>
            
            <table style={{ width: '100%', fontSize: '13px', textAlign: 'left', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #f1f5f9', color: '#0f172a' }}>
                  <th style={{ padding: '12px 0', fontWeight: 'bold' }}>Department</th>
                  <th style={{ padding: '12px 0', fontWeight: 'bold' }}>Subject</th>
                  <th style={{ padding: '12px 0', fontWeight: 'bold' }}>Services</th>
                  <th style={{ padding: '12px 0', fontWeight: 'bold' }}>Status</th>
                  <th style={{ padding: '12px 0', fontWeight: 'bold' }}>Last Updated</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={{ padding: '16px 0' }}>
                    <span style={{ background: '#f1f5f9', color: '#475569', padding: '4px 10px', borderRadius: '12px', fontSize: '11px' }}>technical</span>
                  </td>
                  <td style={{ padding: '16px 0' }}>
                    <div style={{ color: '#10b981', fontWeight: '500', marginBottom: '4px' }}>Ticket No: #860</div>
                    <div style={{ color: '#94a3b8', fontSize: '12px' }}>Add new image uploading for image</div>
                  </td>
                  <td style={{ padding: '16px 0' }}></td>
                  <td style={{ padding: '16px 0' }}>
                    <span style={{ background: '#a855f7', color: 'white', padding: '4px 12px', borderRadius: '12px', fontSize: '11px', fontWeight: '500' }}>Completed</span>
                  </td>
                  <td style={{ padding: '16px 0', color: '#0f172a' }}>
                    <div style={{ fontWeight: '500', marginBottom: '4px' }}>09 Aug 2026</div>
                    <div style={{ color: '#94a3b8', fontSize: '12px' }}>3 weeks ago</div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Bottom Two Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
            
            {/* Active Services */}
            <div style={{ background: 'white', borderRadius: '12px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#10b981', fontWeight: 'bold', fontSize: '16px' }}>
                  <Briefcase size={20} />
                  <span>Active Services</span>
                </div>
                <span style={{ color: '#10b981', fontSize: '13px', cursor: 'pointer' }}>List</span>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {[
                  "Billing Inventory Software (Sub-Domain)",
                  "Yearly renewal Domain",
                  "Yearly renewal Hosting 1GB",
                  "Yearly renewal Domain"
                ].map((service, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: idx < 3 ? '1px solid #f1f5f9' : 'none', paddingBottom: idx < 3 ? '16px' : '0' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                      <span style={{ background: '#10b981', color: 'white', padding: '2px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: '500' }}>Active</span>
                      <span style={{ fontSize: '13px', color: '#0f172a', fontWeight: '500' }}>{service}</span>
                    </div>
                    <span style={{ color: '#64748b', fontSize: '12px', cursor: 'pointer' }}>Details</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Invoices */}
            <div style={{ background: 'white', borderRadius: '12px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#0f172a', fontWeight: 'bold', fontSize: '16px' }}>
                  <Monitor size={20} color="#10b981" />
                  <span>Invoices</span>
                </div>
                <span style={{ color: '#10b981', fontSize: '13px', cursor: 'pointer' }}>Invoice List</span>
              </div>

              <table style={{ width: '100%', fontSize: '12px', textAlign: 'left', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #f1f5f9', color: '#0f172a' }}>
                    <th style={{ padding: '12px 0', fontWeight: 'bold' }}>Invoice #</th>
                    <th style={{ padding: '12px 0', fontWeight: 'bold' }}>Issued</th>
                    <th style={{ padding: '12px 0', fontWeight: 'bold' }}>Total</th>
                    <th style={{ padding: '12px 0', fontWeight: 'bold' }}>Status</th>
                    <th style={{ padding: '12px 0', fontWeight: 'bold' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { id: '#S-250419196', date: '19 Apr 2025', total: '5000.00', status: 'Partial', color: '#f59e0b' },
                    { id: '#S-251217336', date: '17 Dec 2025', total: '6000.00', status: 'Unpaid', color: '#ef4444' },
                    { id: '#S-251218339', date: '18 Dec 2025', total: '15500.00', status: 'Partial', color: '#f59e0b' },
                  ].map((inv, idx) => (
                    <tr key={idx} style={{ borderBottom: idx < 2 ? '1px solid #f1f5f9' : 'none' }}>
                      <td style={{ padding: '16px 0', color: '#10b981', fontWeight: '500' }}>{inv.id}</td>
                      <td style={{ padding: '16px 0', color: '#0f172a' }}>{inv.date}</td>
                      <td style={{ padding: '16px 0', color: '#0f172a', fontWeight: 'bold' }}>{inv.total}</td>
                      <td style={{ padding: '16px 0' }}>
                        <span style={{ background: inv.color, color: 'white', padding: '2px 8px', borderRadius: '4px', fontSize: '10px' }}>{inv.status}</span>
                      </td>
                      <td style={{ padding: '16px 0' }}>
                        <button onClick={openSupport} style={{ background: '#facc15', color: '#422006', border: 'none', padding: '4px 12px', borderRadius: '4px', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: '500', cursor: 'pointer' }}>
                          <FileText size={12} /> View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

          </div>

        </div>
      </div>
      
      {/* Floating Action Button */}
      <div style={{ position: 'fixed', bottom: '24px', right: '24px' }}>
        <button onClick={openSupport} style={{ background: '#10b981', color: 'white', border: 'none', padding: '12px 20px', borderRadius: '30px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: '500', boxShadow: '0 4px 6px rgba(16, 185, 129, 0.3)', cursor: 'pointer' }}>
          <HelpCircle size={18} /> Online Help & sup
        </button>
      </div>
    </div>
  );
};

export default SupportDashboard;
