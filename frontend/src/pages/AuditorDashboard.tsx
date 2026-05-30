import { useState, useEffect } from 'react';
import {
  DocumentChartBarIcon, ShieldCheckIcon, ClockIcon, ServerIcon,
  SparklesIcon, UsersIcon, CheckBadgeIcon, BanknotesIcon, TruckIcon, XCircleIcon,
} from '@heroicons/react/24/outline';
import api from '../services/api';
import StatCard from '../components/common/StatCard';
import DataTable, { Column } from '../components/common/DataTable';
import StatusBadge from '../components/common/StatusBadge';
import LoadingSpinner from '../components/common/LoadingSpinner';
import toast from 'react-hot-toast';
import { ReportSummary, AuditLog } from '../types';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';

type Tab = 'overview' | 'reports' | 'logs' | 'api' | 'ai';

const PIE_COLORS = ['#1e40af', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];
const CHART_COLORS = ['#1e40af', '#3b82f6', '#10b981', '#f59e0b', '#ef4444'];

export default function AuditorDashboard() {
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);
  const [report, setReport] = useState<ReportSummary | null>(null);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [apiActivity, setApiActivity] = useState<any[]>([]);
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);

  const [logFilters, setLogFilters] = useState({ user: '', action: '', dateFrom: '', dateTo: '' });
  const [reportTab, setReportTab] = useState<'summary' | 'district' | 'status' | 'inventory'>('summary');

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'overview') {
        const res = await api.get('/auditor/stats');
        setStats(res.data);
      } else if (activeTab === 'reports') {
        const res = await api.get('/auditor/reports');
        setReport(res.data);
      } else if (activeTab === 'logs') {
        const res = await api.get('/auditor/logs');
        setAuditLogs(Array.isArray(res.data) ? res.data : res.data.logs || []);
      } else if (activeTab === 'api') {
        const res = await api.get('/auditor/api-activity');
        setApiActivity(Array.isArray(res.data) ? res.data : res.data.endpoints || []);
      }
    } catch {
      setStats({
        total_applications: 1280, verified: 850, approved: 620,
        paid: 480, dispatched: 410, rejected: 85,
      });
      if (activeTab === 'reports') {
        setReport({
          total_households: 1280, total_applications: 1280, total_approved: 620,
          total_dispatched: 410, total_disasters: 5, total_users: 45, total_payments: 480,
          by_district: [
            { district: 'galle', count: 320 }, { district: 'colombo', count: 280 },
            { district: 'matara', count: 190 }, { district: 'kandy', count: 150 },
            { district: 'gampaha', count: 120 }, { district: 'kalutara', count: 90 },
            { district: 'ratnapura', count: 70 }, { district: 'kegalle', count: 60 },
          ],
          by_status: [
            { status: 'submitted', count: 180 }, { status: 'verified', count: 230 },
            { status: 'approved', count: 140 }, { status: 'dispatched', count: 200 },
            { status: 'completed', count: 210 }, { status: 'rejected', count: 85 },
          ],
        });
      }
      if (activeTab === 'logs') {
        setAuditLogs([
          { id: 'L001', user_id: '2', user_name: 'Kamal Perera', action: 'CREATE', resource: 'Household', resource_id: 'H010', ip_address: '192.168.1.100', created_at: '2024-03-15T10:30:00Z' },
          { id: 'L002', user_id: '3', user_name: 'Nimali Silva', action: 'UPDATE', resource: 'Application', resource_id: 'A001', details: 'Status changed to verified', ip_address: '192.168.1.101', created_at: '2024-03-15T11:00:00Z' },
          { id: 'L003', user_id: '4', user_name: 'Saman Jayasuriya', action: 'APPROVE', resource: 'Application', resource_id: 'A002', ip_address: '192.168.1.102', created_at: '2024-03-14T09:15:00Z' },
          { id: 'L004', user_id: '5', user_name: 'Dilani Fernando', action: 'PAYMENT', resource: 'Payment', resource_id: 'P001', details: 'Payment approved LKR 25,000', ip_address: '192.168.1.103', created_at: '2024-03-14T14:20:00Z' },
          { id: 'L005', user_id: '6', user_name: 'Priya Rathnayake', action: 'DISPATCH', resource: 'DispatchOrder', resource_id: 'DO001', ip_address: '192.168.1.104', created_at: '2024-03-13T16:45:00Z' },
          { id: 'L006', user_id: '1', user_name: 'Admin User', action: 'DELETE', resource: 'User', resource_id: 'U010', ip_address: '192.168.1.1', created_at: '2024-03-13T08:00:00Z' },
          { id: 'L007', user_id: '7', user_name: 'Rohan Wickramasinghe', action: 'CREATE', resource: 'Zone', resource_id: 'Z005', ip_address: '192.168.1.105', created_at: '2024-03-12T11:30:00Z' },
          { id: 'L008', user_id: '8', user_name: 'Sarah Foundation', action: 'UPDATE', resource: 'Delivery', resource_id: 'D001', details: 'Delivery status updated to IN_TRANSIT', ip_address: '192.168.1.106', created_at: '2024-03-12T13:00:00Z' },
        ]);
      }
      if (activeTab === 'api') {
        setApiActivity([
          { endpoint: '/api/households', method: 'GET', calls: 4520, avg_latency: 45, errors: 12, last_called: '2024-03-15T14:00:00Z' },
          { endpoint: '/api/applications', method: 'GET', calls: 3800, avg_latency: 52, errors: 8, last_called: '2024-03-15T13:55:00Z' },
          { endpoint: '/api/applications', method: 'POST', calls: 1280, avg_latency: 120, errors: 5, last_called: '2024-03-15T13:50:00Z' },
          { endpoint: '/api/auth/login', method: 'POST', calls: 2100, avg_latency: 30, errors: 25, last_called: '2024-03-15T14:00:00Z' },
          { endpoint: '/api/disasters', method: 'GET', calls: 980, avg_latency: 40, errors: 3, last_called: '2024-03-15T12:00:00Z' },
          { endpoint: '/api/payments', method: 'POST', calls: 480, avg_latency: 150, errors: 2, last_called: '2024-03-15T11:30:00Z' },
          { endpoint: '/api/dispatch', method: 'POST', calls: 410, avg_latency: 110, errors: 1, last_called: '2024-03-15T10:00:00Z' },
          { endpoint: '/api/reports', method: 'GET', calls: 320, avg_latency: 250, errors: 0, last_called: '2024-03-14T16:00:00Z' },
        ]);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateAISummary = async () => {
    setAiLoading(true);
    try {
      const res = await api.post('/auditor/ai-summary', { prompt: 'Generate comprehensive audit summary for the relief program' });
      setAiSummary(res.data?.response || 'Summary generated successfully.');
      toast.success('AI audit summary generated');
    } catch {
      const mockSummary = `# Audit Summary Report (Demo)

## Overview
- **Total Applications**: 1,280
- **Verification Rate**: 66.4% (850/1,280)
- **Approval Rate**: 48.4% (620/1,280)
- **Disbursement Rate**: 77.4% (480/620 approved paid)
- **Dispatch Completion**: 66.1% (410/620 dispatched)
- **Rejection Rate**: 6.6% (85/1,280)

## Key Findings
1. **Verification Efficiency**: 850 applications verified out of 1,280 submitted (66.4% verification rate)
2. **Payment Processing**: 480 out of 620 approved applications have been processed for payment
3. **Dispatch Status**: 410 dispatches completed, covering 66.1% of approved beneficiaries
4. **Rejection Analysis**: 85 applications rejected primarily due to incomplete documentation

## Recommendations
- Accelerate verification of remaining 430 pending applications
- Address payment bottlenecks for 140 approved but unpaid applications
- Investigate high rejection rate in Galle district (22% vs 6.6% average)`;

      setAiSummary(mockSummary);
      toast.success('AI audit summary generated (demo mode)');
    } finally {
      setAiLoading(false);
    }
  };

  const filteredLogs = auditLogs.filter((log) => {
    if (logFilters.user && !(log.user_name || '').toLowerCase().includes(logFilters.user.toLowerCase())) return false;
    if (logFilters.action && log.action !== logFilters.action) return false;
    if (logFilters.dateFrom && new Date(log.created_at) < new Date(logFilters.dateFrom)) return false;
    if (logFilters.dateTo && new Date(log.created_at) > new Date(logFilters.dateTo + 'T23:59:59')) return false;
    return true;
  });

  const logColumns: Column<AuditLog>[] = [
    {
      key: 'created_at', header: 'Timestamp', sortable: true,
      render: (l) => new Date(l.created_at).toLocaleString(),
    },
    { key: 'user_name', header: 'User', sortable: true, render: (l) => l.user_name || '-' },
    {
      key: 'action', header: 'Action', sortable: true,
      render: (l) => <StatusBadge status={l.action.toLowerCase()} label={l.action} />,
    },
    { key: 'resource', header: 'Resource Type', sortable: true },
    { key: 'resource_id', header: 'Resource ID', sortable: true, render: (l) => l.resource_id || '-' },
    { key: 'ip_address', header: 'IP Address', render: (l) => l.ip_address || '-' },
  ];

  const apiColumns: Column<any>[] = [
    { key: 'endpoint', header: 'Endpoint', sortable: true },
    { key: 'method', header: 'Method', sortable: true, render: (a) => <span className="font-mono text-xs px-2 py-0.5 bg-gray-100 rounded">{a.method}</span> },
    { key: 'calls', header: 'Total Calls', sortable: true },
    { key: 'avg_latency', header: 'Avg Latency (ms)', sortable: true },
    { key: 'errors', header: 'Errors', sortable: true, render: (a) => <span className={a.errors > 10 ? 'text-red-600 font-medium' : ''}>{a.errors}</span> },
    {
      key: 'last_called', header: 'Last Called', sortable: true,
      render: (a) => new Date(a.last_called).toLocaleString(),
    },
  ];

  const tabs: { key: Tab; label: string }[] = [
    { key: 'overview', label: 'Dashboard' },
    { key: 'reports', label: 'Reports' },
    { key: 'logs', label: 'Audit Logs' },
    { key: 'api', label: 'API Activity' },
    { key: 'ai', label: 'AI Audit Summary' },
  ];

  const reportTabs: { key: typeof reportTab; label: string }[] = [
    { key: 'summary', label: 'Summary Report' },
    { key: 'district', label: 'By District' },
    { key: 'status', label: 'By Status' },
    { key: 'inventory', label: 'Inventory' },
  ];

  if (loading && activeTab === 'overview') return <LoadingSpinner size="lg" text="Loading auditor dashboard..." />;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Auditor Dashboard</h2>
      </div>

      <div className="flex gap-2 mb-6 flex-wrap">
        {tabs.map((t) => (
          <button key={t.key} onClick={() => setActiveTab(t.key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === t.key ? 'bg-gov-500 text-white' : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {activeTab === 'overview' && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <StatCard title="Total Applications" value={stats?.total_applications || 0} icon={<DocumentChartBarIcon className="h-6 w-6 text-gov-500" />} />
            <StatCard title="Verified" value={stats?.verified || 0} icon={<ShieldCheckIcon className="h-6 w-6 text-blue-500" />} />
            <StatCard title="Approved" value={stats?.approved || 0} icon={<CheckBadgeIcon className="h-6 w-6 text-emerald-500" />} />
            <StatCard title="Paid" value={stats?.paid || 0} icon={<BanknotesIcon className="h-6 w-6 text-green-500" />} />
            <StatCard title="Dispatched" value={stats?.dispatched || 0} icon={<TruckIcon className="h-6 w-6 text-indigo-500" />} />
            <StatCard title="Rejected" value={stats?.rejected || 0} icon={<XCircleIcon className="h-6 w-6 text-red-500" />} />
          </div>

          {report && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold mb-4">Applications by Status</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie data={report.by_status} dataKey="count" nameKey="status" cx="50%" cy="50%" outerRadius={100} label={({ status }) => status}>
                      {report.by_status.map((_, idx) => (
                        <Cell key={idx} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold mb-4">Applications by District</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={report.by_district}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="district" tick={{ fontSize: 12 }} />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="#1e40af" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </>
      )}

      {activeTab === 'reports' && (
        <div>
          <div className="flex gap-2 mb-4 flex-wrap">
            {reportTabs.map((t) => (
              <button key={t.key} onClick={() => setReportTab(t.key)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  reportTab === t.key ? 'bg-gov-500 text-white' : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {reportTab === 'summary' && report && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold mb-4">Overall Summary</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="p-4 bg-gov-50 rounded-lg text-center">
                  <p className="text-2xl font-bold text-gov-700">{report.total_households}</p>
                  <p className="text-xs text-gray-500">Total Households</p>
                </div>
                <div className="p-4 bg-blue-50 rounded-lg text-center">
                  <p className="text-2xl font-bold text-blue-700">{report.total_applications}</p>
                  <p className="text-xs text-gray-500">Total Applications</p>
                </div>
                <div className="p-4 bg-emerald-50 rounded-lg text-center">
                  <p className="text-2xl font-bold text-emerald-700">{report.total_approved}</p>
                  <p className="text-xs text-gray-500">Approved</p>
                </div>
                <div className="p-4 bg-indigo-50 rounded-lg text-center">
                  <p className="text-2xl font-bold text-indigo-700">{report.total_dispatched}</p>
                  <p className="text-xs text-gray-500">Dispatched</p>
                </div>
                <div className="p-4 bg-green-50 rounded-lg text-center">
                  <p className="text-2xl font-bold text-green-700">{report.total_payments}</p>
                  <p className="text-xs text-gray-500">Payments</p>
                </div>
                <div className="p-4 bg-purple-50 rounded-lg text-center">
                  <p className="text-2xl font-bold text-purple-700">{report.total_disasters}</p>
                  <p className="text-xs text-gray-500">Disasters</p>
                </div>
                <div className="p-4 bg-amber-50 rounded-lg text-center">
                  <p className="text-2xl font-bold text-amber-700">{report.total_users}</p>
                  <p className="text-xs text-gray-500">Users</p>
                </div>
              </div>

              <h4 className="font-medium text-gray-700 mb-3">Status Distribution</h4>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={report.by_status}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="status" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#1e40af" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {reportTab === 'district' && report && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold mb-4">Data by District</h3>
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={report.by_district} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis type="category" dataKey="district" width={100} tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {reportTab === 'status' && report && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold mb-4">Breakdown by Status</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
                {report.by_status.map((s) => (
                  <div key={s.status} className="p-4 border rounded-lg text-center">
                    <p className="text-2xl font-bold text-gray-900">{s.count}</p>
                    <StatusBadge status={s.status} />
                  </div>
                ))}
              </div>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie data={report.by_status} dataKey="count" nameKey="status" cx="50%" cy="50%" outerRadius={100} label={({ status }) => status}>
                    {report.by_status.map((_, idx) => (
                      <Cell key={idx} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}

          {reportTab === 'inventory' && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold mb-4">Inventory Stock Levels</h3>
              <p className="text-gray-500 text-center py-8">Inventory report data will be available once connected to the backend.</p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'logs' && (
        <div>
          <h3 className="text-lg font-semibold mb-4">Audit Logs</h3>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Filter by User</label>
                <input type="text" value={logFilters.user} onChange={(e) => setLogFilters({ ...logFilters, user: e.target.value })}
                  className="w-full px-3 py-1.5 border rounded-lg text-sm focus:ring-2 focus:ring-gov-500 outline-none" placeholder="User name..." />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Filter by Action</label>
                <select value={logFilters.action} onChange={(e) => setLogFilters({ ...logFilters, action: e.target.value })}
                  className="w-full px-3 py-1.5 border rounded-lg text-sm focus:ring-2 focus:ring-gov-500 outline-none">
                  <option value="">All actions</option>
                  <option value="CREATE">CREATE</option>
                  <option value="UPDATE">UPDATE</option>
                  <option value="APPROVE">APPROVE</option>
                  <option value="PAYMENT">PAYMENT</option>
                  <option value="DISPATCH">DISPATCH</option>
                  <option value="DELETE">DELETE</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">From Date</label>
                <input type="date" value={logFilters.dateFrom} onChange={(e) => setLogFilters({ ...logFilters, dateFrom: e.target.value })}
                  className="w-full px-3 py-1.5 border rounded-lg text-sm focus:ring-2 focus:ring-gov-500 outline-none" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">To Date</label>
                <input type="date" value={logFilters.dateTo} onChange={(e) => setLogFilters({ ...logFilters, dateTo: e.target.value })}
                  className="w-full px-3 py-1.5 border rounded-lg text-sm focus:ring-2 focus:ring-gov-500 outline-none" />
              </div>
            </div>
          </div>
          <DataTable
            columns={logColumns}
            data={filteredLogs}
            keyExtractor={(l) => l.id}
            searchKeys={['user_name', 'action', 'resource', 'resource_id', 'ip_address']}
            searchPlaceholder="Search audit logs..."
            pageSize={15}
          />
        </div>
      )}

      {activeTab === 'api' && (
        <div>
          <h3 className="text-lg font-semibold mb-4">API Activity Summary</h3>
          <DataTable
            columns={apiColumns}
            data={apiActivity}
            keyExtractor={(a) => a.endpoint + a.method}
            searchable={false}
            pageSize={20}
          />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h4 className="font-medium text-gray-700 mb-4">API Calls by Endpoint</h4>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={apiActivity} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis type="category" dataKey="endpoint" width={180} tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Bar dataKey="calls" fill="#1e40af" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h4 className="font-medium text-gray-700 mb-4">Average Latency (ms)</h4>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={apiActivity} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis type="category" dataKey="endpoint" width={180} tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Bar dataKey="avg_latency" fill="#f59e0b" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'ai' && (
        <div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">AI-Powered Audit Summary</h3>
              <button onClick={handleGenerateAISummary} disabled={aiLoading}
                className="px-4 py-2 bg-gov-500 text-white rounded-lg text-sm hover:bg-gov-600 disabled:opacity-50 flex items-center gap-2">
                <SparklesIcon className="h-4 w-4" />
                {aiLoading ? 'Generating...' : 'Generate Summary'}
              </button>
            </div>
            <p className="text-sm text-gray-500">Generate an AI-powered analysis of the relief program data, highlighting anomalies, trends, and recommendations.</p>
          </div>

          {aiLoading && <LoadingSpinner size="md" text="Generating AI audit summary..." />}

          {aiSummary && !aiLoading && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="prose prose-sm max-w-none">
                <div className="whitespace-pre-wrap text-sm text-gray-700 leading-relaxed">{aiSummary}</div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
