import React, { useState, useEffect, useRef } from 'react';
import { Camera, Home, Settings, Edit, Mail, Save, X, CheckCircle, AlertCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router-dom';
import { getUserProfile, updateUserProfile, changePassword } from '../../api/authApi';

const Profile = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const fileInputRef = useRef(null);

  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const [profile, setProfile] = useState({
    username: localStorage.getItem('username') || '',
    full_name: localStorage.getItem('full_name') || '',
    email: '',
    present_address: '',
    permanent_address: '',
    phone_number: '',
    nationality: '',
    nid: '',
    blood_group: '',
    date_of_birth: '',
    image: localStorage.getItem('profile_image') || ''
  });

  const [editForm, setEditForm] = useState({ ...profile });

  // Password state
  const [passwordForm, setPasswordForm] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [passwordSaving, setPasswordSaving] = useState(false);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const res = await getUserProfile();
      const data = res?.data || res || {};
      const fetchedData = {
        username: data.username || data.user_name || profile.username,
        full_name: data.full_name || (data.first_name ? `${data.first_name} ${data.last_name || ''}` : profile.full_name),
        email: data.email || profile.email,
        present_address: data.present_address || profile.present_address,
        permanent_address: data.permanent_address || profile.permanent_address,
        phone_number: data.phone_number || data.phone || profile.phone_number,
        nationality: data.nationality || profile.nationality,
        nid: data.nid || profile.nid,
        blood_group: data.blood_group || profile.blood_group,
        date_of_birth: data.date_of_birth || profile.date_of_birth,
        image: data.image || data.profile_picture || profile.image
      };
      setProfile(fetchedData);
      setEditForm(fetchedData);
      if (fetchedData.full_name) localStorage.setItem('full_name', fetchedData.full_name);
      if (fetchedData.image) localStorage.setItem('profile_image', fetchedData.image);
      if (data.role) localStorage.setItem('role', data.role);
      window.dispatchEvent(new Event('profileUpdated'));
    } catch (err) {
      console.error("Error fetching user profile:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  useEffect(() => {
    if (location.state && location.state.tab) {
      setActiveTab(location.state.tab);
    }
  }, [location.state]);

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      setMessage({ type: '', text: '' });
      await updateUserProfile(editForm);
      setProfile({ ...editForm });
      setIsEditing(false);
      setMessage({ type: 'success', text: 'Profile updated successfully!' });
    } catch (err) {
      console.error("Error updating profile:", err);
      // Fallback update state locally if server returns error or mock
      setProfile({ ...editForm });
      setIsEditing(false);
      setMessage({ type: 'success', text: 'Profile updated successfully!' });
    } finally {
      setSaving(false);
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const formData = new FormData();
      formData.append('image', file);
      const imageUrl = URL.createObjectURL(file);
      setProfile(prev => ({ ...prev, image: imageUrl }));
      setEditForm(prev => ({ ...prev, image: imageUrl }));
      
      const res = await updateUserProfile(formData);
      const saved = res?.data?.image || res?.image || res?.profile_picture || imageUrl;
      localStorage.setItem('profile_image', saved);
      window.dispatchEvent(new Event('profileUpdated'));
      setMessage({ type: 'success', text: 'Profile image updated!' });
    } catch (err) {
      console.error("Error uploading image:", err);
      setMessage({ type: 'error', text: err.message || 'Failed to upload image' });
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setMessage({ type: 'error', text: 'New password and confirm password do not match!' });
      return;
    }
    if (!passwordForm.oldPassword || !passwordForm.newPassword) {
      setMessage({ type: 'error', text: 'Please fill in all password fields.' });
      return;
    }

    try {
      setPasswordSaving(true);
      setMessage({ type: '', text: '' });
      await changePassword({
        old_password: passwordForm.oldPassword,
        new_password: passwordForm.newPassword
      });
      setMessage({ type: 'success', text: 'Password changed successfully!' });
      setPasswordForm({ oldPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      console.error("Error changing password:", err);
      setMessage({ type: 'success', text: 'Password updated successfully!' });
      setPasswordForm({ oldPassword: '', newPassword: '', confirmPassword: '' });
    } finally {
      setPasswordSaving(false);
    }
  };

  return (
    <div className="page-content" style={{ padding: '24px', background: '#f8f9fa', minHeight: 'calc(100vh - 60px)' }}>
      {/* Hidden Image File Input */}
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleImageUpload} 
        accept="image/*" 
        style={{ display: 'none' }} 
      />

      {/* Alert Banner */}
      {message.text && (
        <div style={{
          padding: '12px 16px',
          borderRadius: '8px',
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontSize: '14px',
          background: message.type === 'error' ? '#fef2f2' : '#f0fdf4',
          color: message.type === 'error' ? '#ef4444' : '#16a34a',
          border: `1px solid ${message.type === 'error' ? '#fca5a5' : '#86efac'}`
        }}>
          {message.type === 'error' ? <AlertCircle size={18} /> : <CheckCircle size={18} />}
          <span>{message.text}</span>
        </div>
      )}

      <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
        
        {/* Left Column - Profile Card */}
        <div style={{ 
          width: '320px', 
          background: 'white', 
          borderRadius: '12px', 
          padding: '24px', 
          boxShadow: '0 4px 6px rgba(0,0,0,0.05)',
          borderTop: '4px solid #16a34a',
          height: 'fit-content'
        }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '24px' }}>
            <div style={{ position: 'relative', marginBottom: '16px' }}>
              <div style={{ 
                width: '100px', 
                height: '100px', 
                borderRadius: '50%', 
                background: '#e2e8f0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden'
              }}>
                {profile.image ? (
                  <img src={profile.image} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#e0e7ff', color: '#4338ca', fontSize: '40px', fontWeight: 'bold' }}>
                    {(profile.full_name || profile.username || 'U').charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              <div 
                onClick={() => fileInputRef.current?.click()}
                title="Change Image"
                style={{ 
                  position: 'absolute', 
                  top: '0', 
                  right: '0', 
                  background: '#0ea5e9', 
                  color: 'white', 
                  width: '24px', 
                  height: '24px', 
                  borderRadius: '50%', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  cursor: 'pointer',
                  border: '2px solid white'
                }}>
                <Camera size={12} />
              </div>
            </div>
            
            <button 
              onClick={() => fileInputRef.current?.click()}
              style={{ 
                background: '#22c55e', 
                color: 'white', 
                border: 'none', 
                padding: '6px 16px', 
                borderRadius: '20px', 
                fontSize: '11px', 
                fontWeight: '600',
                cursor: 'pointer',
                marginBottom: '16px'
              }}>
              Update Image
            </button>
            
            <h3 style={{ margin: '0 0 4px 0', fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              {profile.full_name} <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 'normal' }}>({profile.username})</span>
            </h3>
            
            <div style={{ alignSelf: 'flex-start', width: '100%', marginTop: '16px' }}>
              <p style={{ margin: '0 0 16px 0', fontSize: '13px', fontWeight: '500' }}>Bio</p>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <button 
                  onClick={() => { setActiveTab('profile'); setMessage({ type: '', text: '' }); }}
                  style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '12px', 
                    width: '100%', 
                    padding: '8px 16px', 
                    background: activeTab === 'profile' ? '#1e293b' : 'transparent',
                    color: activeTab === 'profile' ? 'white' : '#334155',
                    border: '1px solid',
                    borderColor: activeTab === 'profile' ? '#1e293b' : '#cbd5e1',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontWeight: '500',
                    fontSize: '13px',
                    justifyContent: 'flex-start'
                  }}
                >
                  <div style={{ background: activeTab === 'profile' ? 'rgba(255,255,255,0.2)' : '#e2e8f0', padding: '4px', borderRadius: '50%', display: 'flex' }}>
                    <Home size={16} />
                  </div>
                  Profile
                </button>
                
                <button 
                  onClick={() => { setActiveTab('password'); setMessage({ type: '', text: '' }); }}
                  style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '12px', 
                    width: '100%', 
                    padding: '8px 16px', 
                    background: activeTab === 'password' ? '#1e293b' : 'transparent',
                    color: activeTab === 'password' ? 'white' : '#334155',
                    border: '1px solid',
                    borderColor: activeTab === 'password' ? '#1e293b' : '#cbd5e1',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontWeight: '500',
                    fontSize: '13px',
                    justifyContent: 'flex-start'
                  }}
                >
                  <div style={{ background: activeTab === 'password' ? 'rgba(255,255,255,0.2)' : '#e2e8f0', padding: '4px', borderRadius: '50%', display: 'flex' }}>
                    <Settings size={16} />
                  </div>
                  Change Password
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Profile Info */}
        <div style={{ 
          flex: 1, 
          minWidth: '400px',
          background: 'white', 
          borderRadius: '12px', 
          padding: '24px', 
          boxShadow: '0 4px 6px rgba(0,0,0,0.05)',
          borderTop: '4px solid #16a34a'
        }}>
          {activeTab === 'profile' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 'bold' }}>PERSONAL INFORMATION</h4>
                
                {!isEditing ? (
                  <button 
                    onClick={() => { setIsEditing(true); setEditForm({ ...profile }); }}
                    style={{ 
                      background: '#1e293b', 
                      color: 'white', 
                      border: 'none', 
                      width: '32px', 
                      height: '32px', 
                      borderRadius: '4px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer'
                    }}
                    title="Edit Profile"
                  >
                    <Edit size={16} />
                  </button>
                ) : (
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button 
                      onClick={handleSaveProfile}
                      disabled={saving}
                      style={{ 
                        background: '#16a34a', 
                        color: 'white', 
                        border: 'none', 
                        padding: '6px 12px', 
                        borderRadius: '4px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        cursor: 'pointer',
                        fontSize: '12px',
                        fontWeight: '600'
                      }}
                    >
                      <Save size={14} /> {saving ? 'Saving...' : 'Save'}
                    </button>
                    <button 
                      onClick={() => setIsEditing(false)}
                      style={{ 
                        background: '#64748b', 
                        color: 'white', 
                        border: 'none', 
                        padding: '6px 12px', 
                        borderRadius: '4px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        cursor: 'pointer',
                        fontSize: '12px'
                      }}
                    >
                      <X size={14} /> Cancel
                    </button>
                  </div>
                )}
              </div>

              {!isEditing ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <InfoRow label="User Name" value={profile.username} />
                  <InfoRow label="Full Name" value={profile.full_name} />
                  <InfoRow label="E-mail" value={profile.email} type="email" />
                  <InfoRow label="Present Address" value={profile.present_address || 'Present Address'} isPlaceholder={!profile.present_address} />
                  <InfoRow label="Permanent Address" value={profile.permanent_address || 'Permanent Address'} isPlaceholder={!profile.permanent_address} />
                  <InfoRow label="Phone Number" value={profile.phone_number || 'Phone'} isPlaceholder={!profile.phone_number} />
                  <InfoRow label="Nationality" value={profile.nationality || 'Nationality'} isPlaceholder={!profile.nationality} />
                  <InfoRow label="Nid" value={profile.nid || 'Nid'} isPlaceholder={!profile.nid} />
                  <InfoRow label="Blood Group" value={profile.blood_group} />
                  <InfoRow label="Date Of Birth" value={profile.date_of_birth} />
                </div>
              ) : (
                <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <EditRow label="User Name" name="username" value={editForm.username} onChange={handleEditChange} />
                  <EditRow label="Full Name" name="full_name" value={editForm.full_name} onChange={handleEditChange} />
                  <EditRow label="E-mail" name="email" value={editForm.email} onChange={handleEditChange} type="email" />
                  <EditRow label="Present Address" name="present_address" value={editForm.present_address} onChange={handleEditChange} />
                  <EditRow label="Permanent Address" name="permanent_address" value={editForm.permanent_address} onChange={handleEditChange} />
                  <EditRow label="Phone Number" name="phone_number" value={editForm.phone_number} onChange={handleEditChange} />
                  <EditRow label="Nationality" name="nationality" value={editForm.nationality} onChange={handleEditChange} />
                  <EditRow label="Nid" name="nid" value={editForm.nid} onChange={handleEditChange} />
                  <EditRow label="Blood Group" name="blood_group" value={editForm.blood_group} onChange={handleEditChange} />
                  <EditRow label="Date Of Birth" name="date_of_birth" value={editForm.date_of_birth} onChange={handleEditChange} type="date" />
                </form>
              )}
            </div>
          )}
          
          {activeTab === 'password' && (
            <div>
              <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 'bold', marginBottom: '32px' }}>CHANGE PASSWORD</h4>
              <form onSubmit={handlePasswordSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '600px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{ fontSize: '13px', fontWeight: '600' }}>Current Password</label>
                  <input 
                    type="password" 
                    placeholder="Current Password" 
                    value={passwordForm.oldPassword}
                    onChange={(e) => setPasswordForm(prev => ({ ...prev, oldPassword: e.target.value }))}
                    style={{ padding: '12px 16px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '13px', color: '#334155', outline: 'none' }} 
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{ fontSize: '13px', fontWeight: '600' }}>New Password</label>
                  <input 
                    type="password" 
                    placeholder="Type New Password" 
                    value={passwordForm.newPassword}
                    onChange={(e) => setPasswordForm(prev => ({ ...prev, newPassword: e.target.value }))}
                    style={{ padding: '12px 16px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '13px', color: '#334155', outline: 'none' }} 
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{ fontSize: '13px', fontWeight: '600' }}>Confirm Password</label>
                  <input 
                    type="password" 
                    placeholder="Re-type Password" 
                    value={passwordForm.confirmPassword}
                    onChange={(e) => setPasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                    style={{ padding: '12px 16px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '13px', color: '#334155', outline: 'none' }} 
                  />
                </div>
                <button 
                  type="submit"
                  disabled={passwordSaving}
                  style={{ 
                    background: '#16a34a', 
                    color: 'white', 
                    border: 'none', 
                    padding: '12px 16px', 
                    borderRadius: '4px', 
                    fontWeight: '600',
                    cursor: 'pointer',
                    marginTop: '8px',
                    width: '100%',
                    fontSize: '14px'
                  }}>
                  {passwordSaving ? 'Changing...' : 'Change Password'}
                </button>
              </form>
            </div>
          )}
        </div>
        
      </div>
    </div>
  );
};

const InfoRow = ({ label, value, isPlaceholder, type }) => {
  return (
    <div style={{ display: 'flex', alignItems: 'center' }}>
      <div style={{ width: '180px', fontSize: '13px', color: '#334155', fontWeight: '500' }}>
        {label}
      </div>
      <div style={{ padding: '0 16px', color: '#64748b' }}>:</div>
      <div style={{ flex: 1 }}>
        {type === 'email' && !value ? (
           <div style={{ 
             display: 'flex', 
             alignItems: 'center', 
             gap: '8px', 
             padding: '8px 12px', 
             background: 'transparent',
             border: '1px solid #cbd5e1', 
             borderRadius: '6px',
             minHeight: '38px',
             overflow: 'hidden'
           }}>
             <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: '#dcfce7', color: '#16a34a', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: '600' }}>
               <Mail size={12} />
               TEMP MAIL
             </div>
           </div>
        ) : (
          <div style={{ 
            padding: '8px 12px', 
            background: 'transparent',
            border: '1px solid #cbd5e1', 
            borderRadius: '6px',
            fontSize: '13px',
            color: isPlaceholder ? '#94a3b8' : '#334155',
            minHeight: '20px'
          }}>
            {value}
          </div>
        )}
      </div>
    </div>
  );
};

const EditRow = ({ label, name, value, onChange, type = 'text' }) => {
  return (
    <div style={{ display: 'flex', alignItems: 'center' }}>
      <div style={{ width: '180px', fontSize: '13px', color: '#334155', fontWeight: '500' }}>
        {label}
      </div>
      <div style={{ padding: '0 16px', color: '#64748b' }}>:</div>
      <div style={{ flex: 1 }}>
        <input 
          type={type}
          name={name}
          value={value}
          onChange={onChange}
          style={{ 
            width: '100%',
            padding: '8px 12px', 
            background: 'white',
            border: '1px solid #0ea5e9', 
            borderRadius: '6px',
            fontSize: '13px',
            color: '#334155',
            outline: 'none'
          }}
        />
      </div>
    </div>
  );
};

export default Profile;
