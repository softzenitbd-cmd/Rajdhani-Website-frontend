import React, { useEffect, useState } from 'react';
import SmsComposer from '../../components/SmsComposer';
import { crmService } from '../../services/crmService';
import { toList } from '../../utils/apiHelpers';

const SmsCustomerGroup = () => {
  const [contacts, setContacts] = useState([]);
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([crmService.getClients(), crmService.getClientGroups()])
      .then(([c, g]) => {
        setContacts(toList(c).map((x) => ({ id: x.id || x.uuid, name: x.name, phone: x.phone || x.mobile, group: x.group })));
        setGroups(toList(g));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return <SmsComposer title="Send SMS to Client Group" recipientType="client_group" contacts={contacts} groups={groups} loading={loading} />;
};

export default SmsCustomerGroup;
