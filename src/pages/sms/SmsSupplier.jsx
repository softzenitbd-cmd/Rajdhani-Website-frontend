import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import SmsComposer from '../../components/SmsComposer';
import { crmService } from '../../services/crmService';
import { toList } from '../../utils/apiHelpers';
import { useTranslation } from 'react-i18next';

const SmsSupplier = () => {
  const { t } = useTranslation();
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
      title={t("Send SMS to Supplier")}
      recipientType="supplier"
      contacts={contacts}
      loading={loading}
      onAddNew={() => navigate('/crm/supplier-create')}
    />
  );
};

export default SmsSupplier;
