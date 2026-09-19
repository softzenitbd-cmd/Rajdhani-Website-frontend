import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { ShoppingBag, CreditCard, Receipt, CalendarClock, Scale, Plus, RefreshCcw } from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';
import { settingService } from '../services/settingService';
import { saleService } from '../services/saleService';
import { accountingService } from '../services/accountingService';
import { useToast } from '../context/ToastContext';
import { money, toList, MONTHS } from '../utils/apiHelpers';

const StatCard = ({ title, amount, type, icon }) => (
  <div className="stat-card">
    <div className={`icon-box ${type}`}>{icon}</div>
    <div className="stat-info">
      <div className="stat-label">{title}</div>
      <div className="stat-value">
        {money(amount)} <span className="stat-currency">৳</span>
      </div>
    </div>
  </div>
);

// Reads a stat from the dashboard payload trying several likely key spellings
const pick = (obj, ...keys) => {
  for (const k of keys) {
    if (obj && obj[k] !== undefined && obj[k] !== null) return Number(obj[k]) || 0;
  }
  return 0;
};

const ymd = (d) => d.toISOString().split('T')[0];

const Dashboard = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const toast = useToast();
  const [stats, setStats] = useState(null);
  const [series, setSeries] = useState([]);
  const [loading, setLoading] = useState(true);

  const monthName = t(stats?.current_month?.month_name || MONTHS[new Date().getMonth()]);

  const load = async () => {
    try {
      setLoading(true);
      const res = await settingService.getDashboardStats();
      const data = res?.data || res || {};
      setStats(data);

      // Weekly chart: use the backend series if present, otherwise build it from the last 14 days of sales / receives
      const backendSeries = toList(data.weekly || data.chart || data.daily || data.series);
      if (backendSeries.length) {
        setSeries(backendSeries.map((d) => ({
          name: d.name || d.label || d.date,
          sales: pick(d, 'sales', 'sale', 'total_sales'),
          receive: pick(d, 'receive', 'receives', 'total_receive'),
          due: pick(d, 'due', 'total_due'),
        })));
      } else {
        const to = new Date();
        const from = new Date();
        from.setDate(to.getDate() - 13);
        const [sales, receives] = await Promise.all([
          saleService.getSalesInvoices({ from_date: ymd(from), to_date: ymd(to), status: 1 }).catch(() => []),
          accountingService.getReceives({ from_date: ymd(from), to_date: ymd(to) }).catch(() => []),
        ]);
        const byDay = {};
        for (let i = 0; i < 14; i++) {
          const d = new Date(from);
          d.setDate(from.getDate() + i);
          byDay[ymd(d)] = { name: `${d.getDate()} ${MONTHS[d.getMonth()].slice(0, 3)}`, sales: 0, receive: 0, due: 0 };
        }
        toList(sales).forEach((inv) => {
          const k = String(inv.date || inv.created_at || '').split('T')[0];
          if (byDay[k]) {
            byDay[k].sales += Number(inv.grand_total || 0);
            byDay[k].due += Number(inv.total_due || 0);
          }
        });
        toList(receives).forEach((r) => {
          const k = String(r.date || r.created_at || '').split('T')[0];
          if (byDay[k]) byDay[k].receive += Number(r.amount || 0);
        });
        setSeries(Object.values(byDay));
      }
    } catch (e) {
      toast.error(e.message || t("Failed to load dashboard"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // GET /api/erpsetting/dashboard/ → { today: {sales_total, receive_total, expense_total, due, balance}, current_month: {...} }
  const s = stats || {};
  const todayBlock = s.today || {};
  const monthBlock = s.current_month || s.month || {};

  const today = {
    sales: pick(todayBlock, 'sales_total', 'sales'),
    receive: pick(todayBlock, 'receive_total', 'receive'),
    expense: pick(todayBlock, 'expense_total', 'expense'),
    due: pick(todayBlock, 'due'),
  };
  today.balance = todayBlock.balance !== undefined ? Number(todayBlock.balance) : today.receive - today.expense;

  const month = {
    sales: pick(monthBlock, 'sales_total', 'sales'),
    receive: pick(monthBlock, 'receive_total', 'receive'),
    expense: pick(monthBlock, 'expense_total', 'expense'),
    due: pick(monthBlock, 'due'),
  };
  month.balance = monthBlock.balance !== undefined ? Number(monthBlock.balance) : month.receive - month.expense;

  const totalDue = month.due;
  const pieData = useMemo(() => [
    { name: t('dashboard.due'), value: totalDue },
    { name: t('dashboard.sales'), value: month.sales },
    { name: t('dashboard.receive'), value: month.receive },
  ], [totalDue, month.sales, month.receive, t]);

  const COLORS = ['#00e396', '#4318ff', '#ff4560'];

  return (
    <div className="dashboard-content">
      <div className="no-print" style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '8px' }}>
        <button onClick={load} disabled={loading} style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '6px 12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: 'var(--fs-12, 12px)', color: '#475569' }}>
          <RefreshCcw size={14} className={loading ? 'spin' : ''} /> {loading ? t("Loading...") : t("Refresh")}
        </button>
      </div>

      {/* Today Stats */}
      <div className="stats-grid">
        <StatCard title={t('dashboard.today_sales')} amount={today.sales} type="sales" icon={<ShoppingBag />} />
        <StatCard title={t('dashboard.today_receive')} amount={today.receive} type="receive" icon={<CreditCard />} />
        <StatCard title={t('dashboard.today_expense')} amount={today.expense} type="expense" icon={<Receipt />} />
      </div>
      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}>
        <StatCard title={t('dashboard.today_due')} amount={today.due} type="expense" icon={<CalendarClock />} />
        <StatCard title={t('dashboard.today_balance')} amount={today.balance} type="sales" icon={<Scale />} />
      </div>

      {/* This month */}
      <div className="stats-grid">
        <StatCard title={`${monthName} ${t('dashboard.sales')}`} amount={month.sales} type="sales" icon={<ShoppingBag />} />
        <StatCard title={`${monthName} ${t('dashboard.receive')}`} amount={month.receive} type="receive" icon={<CreditCard />} />
        <StatCard title={t("{{v0}} Expense", { v0: monthName })} amount={month.expense} type="expense" icon={<Receipt />} />
      </div>
      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}>
        <StatCard title={`${monthName} ${t('dashboard.due')}`} amount={month.due} type="expense" icon={<CalendarClock />} />
        <StatCard title={t("{{v0}} Balance", { v0: monthName })} amount={month.balance} type="sales" icon={<Scale />} />
      </div>

      {/* Charts */}
      <div className="charts-grid">
        <div className="chart-card">
          <div className="chart-header">
            <h3 className="chart-title">{t('dashboard.sales')} | {t('dashboard.receive')} | {t('dashboard.due')}</h3>
            <p className="chart-subtitle">{t('dashboard.weekly_analysis')}</p>
          </div>
          <div style={{ height: 300 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={series}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e0e5f2" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#a3aed1', fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#a3aed1', fontSize: 12 }} />
                <Tooltip formatter={(v) => `৳ ${money(v)}`} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }} />
                <Legend />
                <Line type="monotone" dataKey="sales" name="Sales" stroke="#00e396" strokeWidth={3} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="receive" name="Receive" stroke="#4318ff" strokeWidth={3} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="due" name="Due" stroke="#ff4560" strokeWidth={3} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="chart-card" style={{ display: 'flex', flexDirection: 'column' }}>
          <div className="chart-header">
            <h3 className="chart-title">{t('dashboard.sales')} | {t('dashboard.receive')} | {t('dashboard.due')}</h3>
            <p className="chart-subtitle">{t('dashboard.total')}</p>
          </div>
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={70} outerRadius={100} paddingAngle={5} dataKey="value">
                  {pieData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(v) => `৳ ${money(v)}`} />
              </PieChart>
            </ResponsiveContainer>
            <div style={{ position: 'absolute', textAlign: 'center', pointerEvents: 'none' }}>
              <div style={{ fontSize: 'var(--fs-20, 20px)', fontWeight: 'bold', color: '#00e396' }}>{t('dashboard.due')}</div>
              <div style={{ fontSize: 'var(--fs-14, 14px)', color: '#a3aed1' }}>{money(totalDue)}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Action Button → new invoice */}
      <div className="fab" onClick={() => navigate('/invoice/add-new')} title={t("New Invoice")} style={{ cursor: 'pointer' }}>
        <Plus size={24} />
      </div>
    </div>
  );
};

export default Dashboard;
