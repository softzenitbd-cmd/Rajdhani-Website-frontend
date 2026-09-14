import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import SmsComposer from '../../components/SmsComposer';
import { crmService } from '../../services/crmService';
import { toList } from '../../utils/apiHelpers';
import { useTranslation } from 'react-i18next';

const SmsCustomer = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    crmService
      .getClients()
      .then((r) => setContacts(toList(r).map((c) => ({ id: c.id || c.uuid, name: c.name, phone: c.phone || c.mobile, group: c.group }))))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <SmsComposer
      title={t("Send SMS to Client")}
      recipientType="client"
      contacts={contacts}
      loading={loading}
      onAddNew={() => navigate('/crm/client-create')}
    />
  );
};

export default SmsCustomer;
