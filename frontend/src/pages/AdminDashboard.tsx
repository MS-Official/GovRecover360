import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import {
  UsersIcon, ExclamationTriangleIcon, HeartIcon, DocumentTextIcon,
  ShieldCheckIcon, ServerIcon, ChartBarIcon, ArrowPathIcon,
} from '@heroicons/react/24/outline';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import StatCard from '../components/common/StatCard';
import DataTable, { Column } from '../components/common/DataTable';
import StatusBadge from '../components/common/StatusBadge';
import LoadingSpinner from '../components/common/LoadingSpinner';
import toast from 'react-hot-toast';
import { IntegrationStatus, User, Role } from '../types';
import { ROLE_DISPLAY_NAMES } from '../utils/constants';

type Tab = 'overview' | 'users' | 'disasters' | 'programs' | 'audit' | 'integrations' | 'openg2p';

export default function AdminDashboard() {
  const { user: currentUser, hasPermission } = useAuth();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    role: 'field_officer' as Role,
    district: '',
    password: '',
  });

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  useEffect(() => {
    if (location.pathname.includes('/admin/integrations')) setActiveTab('integrations');
    else if (location.pathname.includes('/admin/openg2p')) setActiveTab('openg2p');
    else if (location.pathname.includes('/admin/users')) setActiveTab('users');
    else if (location.pathname.includes('/admin/disasters')) setActiveTab('disasters');
    else if (location.pathname.includes('/admin/programs')) setActiveTab('programs');
    else if (location.pathname.includes('/admin/audit')) setActiveTab('audit');
    else setActiveTab('overview');
  }, [location.pathname]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'overview') {
        const res = await api.get('/admin/stats');
        setStats(res.data);
      } else if (activeTab === 'users') {
        const res = await api.get('/admin/users');
        setUsers(Array.isArray(res.data) ? res.data : res.data.users || []);
      }
    } catch (err) {
      if (activeTab === 'overview') {
        setStats({
          total_users: 45, active_disasters: 3, total_households: 1280,
          verified_applications: 850, approved_relief: 620, dispatched_orders: 410,
          total_warehouses: 8, total_ngos: 12,
          recent_activities: [
            { action: 'New user registered', user: 'Admin', time: '2 min ago' },
            { action: 'Disaster event updated: Flood - Galle', user: 'Admin', time: '15 min ago' },
            { action: 'Bulk verification completed (45 households)', user: 'Verifier', time: '1 hour ago' },
            { action: 'Dispatch order #1234 delivered', user: 'Warehouse', time: '2 hours ago' },
            { action: 'New relief program created', user: 'Program Manager', time: '3 hours ago' },
          ],
          api_status: [
            { name: 'REST API', status: 'Operational', uptime: '99.9%' },
            { name: 'GIS Service', status: 'Operational', uptime: '99.7%' },
            { name: 'AI Service', status: 'Degraded', uptime: '95.2%' },
            { name: 'Notification Service', status: 'Operational', uptime: '100%' },
          ],
        });
      } else if (activeTab === 'users') {
        setUsers([
          { id: '1', email: 'admin@gov.lk', full_name: 'Admin User', role: 'admin', permissions: [], district: 'colombo', is_active: true, created_at: '2024-01-01' },
          { id: '2', email: 'field@gov.lk', full_name: 'Kamal Perera', role: 'field_officer', permissions: [], district: 'galle', is_active: true, created_at: '2024-01-15' },
          { id: '3', email: 'verify@gov.lk', full_name: 'Nimali Silva', role: 'verifier', permissions: [], district: 'colombo', is_active: true, created_at: '2024-02-01' },
          { id: '4', email: 'manager@gov.lk', full_name: 'Saman Jayasuriya', role: 'program_manager', permissions: [], district: 'colombo', is_active: true, created_at: '2024-02-15' },
          { id: '5', email: 'warehouse@gov.lk', full_name: 'Priya Rathnayake', role: 'warehouse_officer', permissions: [], district: 'colombo', is_active: true, created_at: '2024-03-01' },
        ]);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingUser) {
        await api.put(`/admin/users/${editingUser.id}`, formData);
        toast.success('User updated');
      } else {
        await api.post('/admin/users', formData);
        toast.success('User created');
      }
      setShowCreateModal(false);
      setEditingUser(null);
      setFormData({ full_name: '', email: '', role: 'field_officer', district: '', password: '' });
      fetchData();
    } catch (err) {
      toast.error('Operation failed. Using demo mode.');
      setShowCreateModal(false);
      fetchData();
    }
  };

  const userColumns: Column<User>[] = [
    { key: 'full_name', header: 'Name', sortable: true },
    { key: 'email', header: 'Email', sortable: true },
    {
      key: 'role', header: 'Role', sortable: true,
      render: (u) => <StatusBadge status={u.role} label={ROLE_DISPLAY_NAMES[u.role]} />,
    },
    {
      key: 'district', header: 'District', sortable: true,
      render: (u) => u.district ? <span className="capitalize">{u.district}</span> : '-',
    },
    {
      key: 'is_active', header: 'Status', sortable: true,
      render: (u) => <StatusBadge status={u.is_active ? 'active' : 'inactive'} />,
    },
    {
      key: 'actions', header: 'Actions',
      render: (u) => (
        <div className="flex gap-2">
          <button
            onClick={() => { setEditingUser(u); setFormData({ full_name: u.full_name, email: u.email, role: u.role, district: u.district || '', password: '' }); setShowCreateModal(true); }}
            className="text-gov-500 hover:text-gov-700 text-sm font-medium"
          >
            Edit
          </button>
          <button className="text-red-500 hover:text-red-700 text-sm font-medium">Deactivate</button>
        </div>
      ),
    },
  ];

  const tabs: { key: Tab; label: string }[] = [
    { key: 'overview', label: 'Overview' },
    { key: 'users', label: 'Users' },
    { key: 'disasters', label: 'Disaster Events' },
    { key: 'programs', label: 'Relief Programs' },
    { key: 'audit', label: 'Audit Logs' },
    { key: 'integrations', label: 'Integrations' },
    { key: 'openg2p', label: 'OpenG2P Demo' },
  ];

  if (activeTab !== 'overview') {
    return (
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Admin Dashboard</h2>
        </div>
        <div className="flex gap-2 mb-6 flex-wrap">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === t.key ? 'bg-gov-500 text-white' : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
                }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {activeTab === 'users' && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">User Management</h3>
              <button
                onClick={() => { setEditingUser(null); setFormData({ full_name: '', email: '', role: 'field_officer', district: '', password: '' }); setShowCreateModal(true); }}
                className="px-4 py-2 bg-gov-500 text-white rounded-lg text-sm hover:bg-gov-600"
              >
                Create User
              </button>
            </div>
            <DataTable
              columns={userColumns}
              data={users}
              keyExtractor={(u) => u.id}
              searchKeys={['full_name', 'email', 'role', 'district']}
              searchPlaceholder="Search users..."
            />
          </div>
        )}

        {activeTab === 'disasters' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
            <p className="text-gray-500 text-center">Disaster Event Management — Connect to backend to manage disaster events.</p>
          </div>
        )}

        {activeTab === 'programs' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
            <p className="text-gray-500 text-center">Relief Program Management — Connect to backend to manage relief programs.</p>
          </div>
        )}

        {activeTab === 'audit' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
            <p className="text-gray-500 text-center">Audit Logs — Connect to backend to view audit logs.</p>
          </div>
        )}

        {activeTab === 'integrations' && <IntegrationStatusPanel />}
        {activeTab === 'openg2p' && <OpenG2PDemoPanel />}

        {showCreateModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
              <h3 className="text-lg font-semibold mb-4">{editingUser ? 'Edit User' : 'Create User'}</h3>
              <form onSubmit={handleCreateUser} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                  <input type="text" value={formData.full_name} onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-gov-500 outline-none" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-gov-500 outline-none" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                  <select value={formData.role} onChange={(e) => setFormData({ ...formData, role: e.target.value as Role })}
                    className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-gov-500 outline-none">
                    {Object.entries(ROLE_DISPLAY_NAMES).map(([key, label]) => (
                      <option key={key} value={key}>{label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">District</label>
                  <input type="text" value={formData.district} onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-gov-500 outline-none" />
                </div>
                {!editingUser && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                    <input type="password" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-gov-500 outline-none" required />
                  </div>
                )}
                <div className="flex justify-end gap-3 pt-2">
                  <button type="button" onClick={() => setShowCreateModal(false)}
                    className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900">Cancel</button>
                  <button type="submit"
                    className="px-4 py-2 bg-gov-500 text-white rounded-lg text-sm hover:bg-gov-600">
                    {editingUser ? 'Update' : 'Create'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  }

  if (loading) return <LoadingSpinner size="lg" text="Loading dashboard..." />;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Admin Dashboard</h2>
      </div>

      <div className="flex gap-2 mb-6 flex-wrap">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === t.key ? 'bg-gov-500 text-white' : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
              }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard title="Total Users" value={stats?.total_users || 0} icon={<UsersIcon className="h-6 w-6 text-gov-500" />} trend={{ value: 12, isUp: true }} />
        <StatCard title="Active Disasters" value={stats?.active_disasters || 0} icon={<ExclamationTriangleIcon className="h-6 w-6 text-red-500" />} />
        <StatCard title="Total Households" value={stats?.total_households || 0} icon={<HeartIcon className="h-6 w-6 text-relief-500" />} />
        <StatCard title="Dispatched Orders" value={stats?.dispatched_orders || 0} icon={<DocumentTextIcon className="h-6 w-6 text-indigo-500" />} />
        <StatCard title="Verified Applications" value={stats?.verified_applications || 0} icon={<ShieldCheckIcon className="h-6 w-6 text-green-500" />} />
        <StatCard title="Approved Relief" value={stats?.approved_relief || 0} icon={<HeartIcon className="h-6 w-6 text-relief-500" />} />
        <StatCard title="Warehouses" value={stats?.total_warehouses || 0} icon={<ServerIcon className="h-6 w-6 text-gov-500" />} />
        <StatCard title="NGO Partners" value={stats?.total_ngos || 0} icon={<UsersIcon className="h-6 w-6 text-gov-500" />} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
          <div className="space-y-4">
            {(stats?.recent_activities || []).map((activity: any, idx: number) => (
              <div key={idx} className="flex items-start gap-3 pb-4 border-b border-gray-100 last:border-0">
                <div className="w-2 h-2 mt-2 rounded-full bg-gov-400 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm text-gray-800">{activity.action}</p>
                  <p className="text-xs text-gray-500 mt-1">{activity.user} · {activity.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">API Services Status</h3>
          <div className="space-y-4">
            {(stats?.api_status || []).map((svc: any, idx: number) => (
              <div key={idx} className="flex items-center justify-between pb-4 border-b border-gray-100 last:border-0">
                <div className="flex items-center gap-3">
                  <ChartBarIcon className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-800">{svc.name}</p>
                    <p className="text-xs text-gray-500">Uptime: {svc.uptime}</p>
                  </div>
                </div>
                <StatusBadge status={svc.status === 'Operational' ? 'active' : 'rejected'} label={svc.status} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function IntegrationStatusPanel() {
  const [status, setStatus] = useState<IntegrationStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadStatus = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/integrations/status');
      setStatus(res.data);
    } catch {
      setError('Integration status could not be loaded. Please check backend health.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStatus();
  }, []);

  const statusCards = status ? [
    { label: 'Backend API', value: status.backend },
    { label: 'Database', value: status.database },
    { label: 'Redis', value: status.redis },
    { label: 'Odoo', value: status.odoo },
    { label: 'OpenG2P Runtime', value: status.openg2p },
    { label: 'Asgardeo', value: status.asgardeo.status },
    { label: 'WSO2 API Manager', value: status.wso2 },
    { label: 'Choreo Notification Service', value: status.choreo },
    { label: 'Superset', value: status.superset },
    { label: 'GeoNode', value: status.geonode },
    { label: 'AI Service', value: status.aiService },
    { label: 'Auth Mode', value: status.authMode },
  ] : [];

  const setupCards = [
    { title: 'Asgardeo Setup', path: 'docs/asgardeo/ASGARDEO_GUIDE.md' },
    { title: 'WSO2 Setup', path: 'docs/wso2/WSO2_GUIDE.md' },
    { title: 'Choreo Deployment', path: 'docs/choreo/CHOREO_GUIDE.md' },
    { title: 'Odoo Module Verification', path: 'docs/INTEGRATION_MANUAL_SETUP.md' },
    { title: 'Superset Dashboard', path: 'docs/superset/SUPERSET_GUIDE.md' },
    { title: 'OpenG2P Alignment', path: 'docs/INTEGRATION_MANUAL_SETUP.md' },
    { title: 'OpenG2P Demo Setup', path: 'INTEGRATION_SETUP.md' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Integration Status</h3>
          {status?.timestamp && (
            <p className="text-sm text-gray-500 mt-1">Last checked {new Date(status.timestamp).toLocaleString()}</p>
          )}
        </div>
        <button
          onClick={loadStatus}
          className="inline-flex items-center gap-2 px-4 py-2 bg-gov-500 text-white rounded-lg text-sm hover:bg-gov-600 disabled:opacity-60"
          disabled={loading}
        >
          <ArrowPathIcon className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4 text-sm">
          {error}
        </div>
      )}

      {loading && !status ? (
        <LoadingSpinner size="md" text="Loading integration status..." />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {statusCards.map((item) => (
            <div key={item.label} className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <ServerIcon className="h-5 w-5 text-gray-400" />
                  <p className="text-sm font-medium text-gray-900">{item.label}</p>
                </div>
                <StatusBadge status={item.value} />
              </div>
            </div>
          ))}
        </div>
      )}

      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Manual Setup References</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {setupCards.map((item) => (
            <div key={item.title} className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
              <p className="text-sm font-semibold text-gray-900">{item.title}</p>
              <p className="text-xs text-gray-500 mt-2 font-mono break-all">{item.path}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function OpenG2PDemoPanel() {
  const [form, setForm] = useState({
    full_name: 'Admin Demo Beneficiary',
    national_id: 'NIC-DEMO-001',
    phone: '+94110000000',
    district: 'Colombo',
    family_size: '4',
    damage_level: 'SEVERE',
    disaster_event: 'Southwest Monsoon Flood',
    requested_support: 'Emergency cash assistance',
  });
  const [beneficiary, setBeneficiary] = useState<any>(null);
  const [eligibility, setEligibility] = useState<any>(null);
  const [entitlement, setEntitlement] = useState<any>(null);
  const [health, setHealth] = useState<any>(null);
  const [loadingAction, setLoadingAction] = useState('');

  const payload = {
    full_name: form.full_name,
    national_id: form.national_id,
    phone: form.phone,
    district: form.district,
    family_size: Number(form.family_size || 0),
    damage_level: form.damage_level,
    disaster_event: form.disaster_event,
    requested_support: form.requested_support,
  };

  const runAction = async (
    action: string,
    request: () => Promise<any>,
    onSuccess: (data: any) => void,
  ) => {
    setLoadingAction(action);
    try {
      const res = await request();
      onSuccess(res.data);
      toast.success(`${action} completed`);
    } catch {
      toast.error(`${action} failed. Check backend and OpenG2P configuration.`);
    } finally {
      setLoadingAction('');
    }
  };

  const createBeneficiary = () => runAction(
    'Create beneficiary',
    () => api.post('/openg2p/beneficiaries', payload),
    setBeneficiary,
  );

  const checkEligibility = () => runAction(
    'Eligibility check',
    () => api.post('/openg2p/eligibility/check', {
      ...payload,
      beneficiary_id: beneficiary?.beneficiary_id,
    }),
    setEligibility,
  );

  const createEntitlement = () => runAction(
    'Create entitlement',
    () => api.post('/openg2p/entitlements', {
      beneficiary_id: beneficiary?.beneficiary_id,
      amount: 25000,
      currency: 'LKR',
      program: 'Emergency Disaster Relief',
      eligibility_status: eligibility?.eligibility_status || 'pending_verification',
    }),
    setEntitlement,
  );

  const loadHealth = () => runAction(
    'OpenG2P health',
    () => api.get('/openg2p/health'),
    setHealth,
  );

  const fieldClass = 'w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-gov-500 focus:border-gov-500 outline-none';
  const eligibilityLabel = eligibility?.eligibility_status === 'eligible'
    ? 'Eligible'
    : eligibility?.eligibility_status === 'not_eligible'
      ? 'Not eligible'
      : eligibility
        ? 'Pending verification'
        : 'Not checked';

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">OpenG2P Beneficiary Demo</h3>
          <p className="text-sm text-gray-500 mt-1">Submit affected citizen details to the backend, then run eligibility and entitlement steps.</p>
        </div>
        <button
          onClick={loadHealth}
          disabled={Boolean(loadingAction)}
          className="px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg text-sm hover:bg-gray-50 disabled:opacity-60"
        >
          Check OpenG2P
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              ['full_name', 'Full Name'],
              ['national_id', 'National ID'],
              ['phone', 'Phone'],
              ['district', 'District'],
              ['family_size', 'Family Size'],
              ['disaster_event', 'Disaster Event'],
            ].map(([key, label]) => (
              <label key={key} className="block">
                <span className="block text-sm font-medium text-gray-700 mb-1">{label}</span>
                <input
                  value={(form as any)[key]}
                  onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                  className={fieldClass}
                />
              </label>
            ))}
            <label className="block">
              <span className="block text-sm font-medium text-gray-700 mb-1">Damage Level</span>
              <select
                value={form.damage_level}
                onChange={(e) => setForm({ ...form, damage_level: e.target.value })}
                className={fieldClass}
              >
                <option value="MINOR">Minor</option>
                <option value="MODERATE">Moderate</option>
                <option value="SEVERE">Severe</option>
                <option value="TOTAL">Total</option>
              </select>
            </label>
            <label className="block md:col-span-2">
              <span className="block text-sm font-medium text-gray-700 mb-1">Requested Support</span>
              <textarea
                value={form.requested_support}
                onChange={(e) => setForm({ ...form, requested_support: e.target.value })}
                className={fieldClass}
                rows={3}
              />
            </label>
          </div>
          <div className="flex flex-wrap gap-3 mt-5">
            <button onClick={createBeneficiary} disabled={Boolean(loadingAction)} className="px-4 py-2 bg-gov-500 text-white rounded-lg text-sm hover:bg-gov-600 disabled:opacity-60">Create Beneficiary</button>
            <button onClick={checkEligibility} disabled={Boolean(loadingAction)} className="px-4 py-2 bg-gov-500 text-white rounded-lg text-sm hover:bg-gov-600 disabled:opacity-60">Check Eligibility</button>
            <button onClick={createEntitlement} disabled={Boolean(loadingAction)} className="px-4 py-2 bg-gov-500 text-white rounded-lg text-sm hover:bg-gov-600 disabled:opacity-60">Create Entitlement</button>
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
            <p className="text-sm font-semibold text-gray-900">Eligibility Result</p>
            <div className="mt-3">
              <StatusBadge status={eligibility?.eligible ? 'active' : eligibility ? 'pending' : 'not_configured'} label={eligibilityLabel} />
            </div>
          </div>
          {[
            ['Health', health],
            ['Beneficiary', beneficiary],
            ['Eligibility', eligibility],
            ['Entitlement', entitlement],
          ].map(([label, data]) => (
            <div key={label as string} className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
              <p className="text-sm font-semibold text-gray-900">{label as string}</p>
              <pre className="mt-3 text-xs bg-gray-50 rounded-lg p-3 overflow-auto max-h-44">{data ? JSON.stringify(data, null, 2) : 'No result yet'}</pre>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
