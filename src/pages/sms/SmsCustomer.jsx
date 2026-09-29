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
    crmService.getClients({ page_size: 5000 })
      .then((r) => setContacts(toList(r).map((c) => ({
        id: c.id || c.uuid,
        name: c.name,
        phone: c.phone || c.mobile,
        group: c.group,
        address: c.address || c.client_address || (c.details && c.details.address) || '',
        client_id: c.client_id || c.customer_id || c.code || '',
        due: Number(c.due || c.current_due || c.total_due || c.balance || c.previous_due || 0),
        due_date: c.due_date ? c.due_date.split('T')[0] : null
      }))))
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
