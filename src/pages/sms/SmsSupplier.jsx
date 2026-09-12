import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import SmsComposer from '../../components/SmsComposer';
import { crmService } from '../../services/crmService';
import { toList } from '../../utils/apiHelpers';

const SmsSupplier = () => {
  const navigate = useNavigate();
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    crmService
      .getSuppliers()
      .then((r) => setContacts(toList(r).map((s) => ({ id: s.id || s.uuid, name: s.name, phone: s.phone || s.mobile, group: s.group }))))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <SmsComposer
      title="Send SMS to Supplier"
      recipientType="supplier"
      contacts={contacts}
      loading={loading}
      onAddNew={() => navigate('/crm/supplier-create')}
    />
  );
};

export default SmsSupplier;
