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
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Government Relief Operations</h2>
          <p className="text-sm text-gray-500 mt-1">Beneficiary & entitlement management, API governance, ERP back office, and analytics overview.</p>
        </div>
        {stats?.demo_fallback && (
          <span className="px-3 py-1 rounded-full bg-blue-100 text-blue-800 text-xs font-semibold">
            Demo fallback data
          </span>
        )}
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
  const [actionLoading, setActionLoading] = useState('');

  const env = {
    apiBase: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000',
    asgardeoConsole: import.meta.env.VITE_ASGARDEO_CONSOLE_URL || 'https://console.asgardeo.io/t/teamcodeme',
    asgardeoApplication: import.meta.env.VITE_ASGARDEO_APPLICATION_URL || 'https://console.asgardeo.io/t/teamcodeme/app/fullscreen/onboarding',
    choreoConsole: import.meta.env.VITE_CHOREO_CONSOLE_URL || 'https://console.choreo.dev/organizations/choreodemo/home',
    choreoOrg: import.meta.env.VITE_CHOREO_ORG_URL || 'https://console.choreo.dev/organizations/choreodemo/home',
    wso2Gateway: import.meta.env.VITE_WSO2_LOCAL_GATEWAY_URL || 'http://localhost:8243',
    odoo: import.meta.env.VITE_ODOO_URL || 'http://localhost:8069',
    superset: import.meta.env.VITE_SUPERSET_URL || 'http://localhost:8088',
    openg2p: import.meta.env.VITE_OPENG2P_URL || 'http://localhost:8070',
    choreoNotifier: import.meta.env.VITE_CHOREO_NOTIFIER_URL || 'http://localhost:8095',
    aiService: import.meta.env.VITE_AI_SERVICE_URL || 'http://localhost:8050',
    backendSwagger: import.meta.env.VITE_BACKEND_SWAGGER_URL || 'http://localhost:8000/docs',
    backendRedoc: import.meta.env.VITE_BACKEND_REDOC_URL || 'http://localhost:8000/redoc',
    backendOpenApi: import.meta.env.VITE_BACKEND_OPENAPI_URL || 'http://localhost:8000/openapi.json',
    openg2pOpenApi: import.meta.env.VITE_OPENG2P_OPENAPI_URL || 'http://localhost:8070/openapi.json',
    aiSwagger: import.meta.env.VITE_AI_SWAGGER_URL || 'http://localhost:8050/docs',
    aiOpenApi: import.meta.env.VITE_AI_OPENAPI_URL || 'http://localhost:8050/openapi.json',
  };

  const loadStatus = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/integrations/status');
      setStatus(typeof res.data === 'object' && res.data ? res.data : null);
    } catch (err: any) {
      setError(err?.message || 'Integration status could not be loaded. Please check backend health.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStatus();
  }, []);

  const normalizeStatus = (value: any, fallback = 'not_configured') => {
    if (!value) return { status: fallback };
    if (typeof value === 'string') return { status: value };
    if (typeof value === 'object') return { status: value.status || value.mode || fallback, ...value };
    return { status: fallback };
  };

  const openUrl = (url?: string) => {
    if (url) window.open(url, '_blank', 'noopener,noreferrer');
  };

  const testEndpoint = async (label: string, request: () => Promise<any>) => {
    setActionLoading(label);
    try {
      await request();
      toast.success(`${label} passed`);
    } catch (err: any) {
      toast.error(err?.message || `${label} failed`);
    } finally {
      setActionLoading('');
    }
  };

  const checkedAt = status?.timestamp ? new Date(status.timestamp).toLocaleString() : 'Not checked yet';
  const backend = normalizeStatus(status?.backend);
  const database = normalizeStatus(status?.database);
  const redis = normalizeStatus(status?.redis);
  const odoo = normalizeStatus(status?.odoo);
  const openg2p = normalizeStatus(status?.openg2p);
  const wso2 = normalizeStatus(status?.wso2);
  const asgardeo = normalizeStatus(status?.asgardeo);
  const choreo = normalizeStatus(status?.choreo);
  const choreoUserService = normalizeStatus(status?.choreoUserService);
  const superset = normalizeStatus(status?.superset);
  const geonode = normalizeStatus(status?.geonode);
  const aiService = normalizeStatus(status?.aiService);
  const authMode = normalizeStatus(status?.authMode || import.meta.env.VITE_AUTH_MODE || 'mock');

  const cardClass = 'bg-white rounded-lg shadow-sm border border-gray-200 p-5';
  const buttonClass = 'px-3 py-2 rounded-lg text-sm font-medium bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 disabled:opacity-60';
  const odooDeveloperUrl = `${env.odoo}/web?debug=1`;
  const odooAppsUrl = `${env.odoo}/web?debug=1#action=119&model=ir.module.module&view_type=kanban&menu_id=76`;
  const odooDisasterModuleUrl = `${env.odoo}/web?debug=1#menu_id=govaid_disaster_recovery.menu_govaid_root`;

  const integrations = [
    { label: 'Backend API', data: backend, mode: 'Core service', publicUrl: `${env.apiBase.replace(/\/api$/, '')}/api/health`, internalUrl: 'http://backend:8000/api/health', purpose: 'Central API for role-based workflows, disaster records, beneficiary operations, audit logs, and integration orchestration.' },
    { label: 'Database', data: database, mode: 'PostgreSQL/PostGIS', internalUrl: 'postgres:5432', purpose: 'System of record for users, disaster events, applications, inventory, payments, GIS metadata, and audit history.' },
    { label: 'Redis', data: redis, mode: 'Cache/session support', internalUrl: 'redis:6379', purpose: 'Fast cache and operational support service for the Docker demo stack.' },
    { label: 'Odoo ERP', data: odoo, mode: 'Back office ERP', publicUrl: env.odoo, internalUrl: 'http://odoo:8069', purpose: 'ERP back office for relief operations, inventory, dispatch, and finance workflows.' },
    { label: 'OpenG2P Demo Runtime', data: openg2p, mode: openg2p.mode || 'Demo runtime', publicUrl: `${env.openg2p}/api/health`, internalUrl: 'http://openg2p:8070/api/health', purpose: 'Beneficiary registry, eligibility check, entitlement lookup, and program enrollment demo runtime.' },
    { label: 'WSO2 API Manager Gateway', data: wso2, mode: wso2.mode || 'Demo gateway', publicUrl: `${env.wso2Gateway}/health`, internalUrl: 'http://wso2-api-manager:8243/health', purpose: 'Demo-compatible API gateway showing governed API routing. In production this points to full WSO2 API Manager.' },
    { label: 'Asgardeo Identity Provider', data: asgardeo, mode: asgardeo.authMode || authMode.status, publicUrl: env.asgardeoConsole, purpose: 'Identity and access management for users, roles, groups, and OIDC login.' },
    { label: 'Choreo Notification Service', data: choreo, mode: choreoUserService.status === 'not_configured' ? 'Local notifier' : 'Cloud integration', publicUrl: env.choreoNotifier, internalUrl: 'http://choreo-notification-service:8095/health', purpose: 'Cloud-native integration service for disaster approval, payment, and dispatch notifications.' },
    { label: 'Superset Analytics', data: superset, mode: 'Analytics dashboard', publicUrl: env.superset, internalUrl: 'http://superset:8088', purpose: 'Analytics dashboard for disaster recovery KPIs.' },
    { label: 'AI Service', data: aiService, mode: 'Decision support', publicUrl: `${env.aiService}/health`, internalUrl: 'http://ai-service:8050/health', purpose: 'AI-assisted summaries, triage support, and demo-safe analytical responses.' },
    { label: 'GeoNode', data: geonode, mode: geonode.status === 'disabled' ? 'Disabled' : 'GIS integration', purpose: 'External geospatial catalogue integration. Local GIS data remains available when GeoNode is disabled.' },
  ];

  const statusGroups = integrations.reduce(
    (acc, item) => {
      const value = String(item.data.status || '');
      if (['ok', 'live', 'healthy', 'configured'].includes(value)) acc.live += 1;
      else if (['mock', 'mock_mode', 'demo_runtime', 'demo_gateway'].includes(value) || String(item.mode).toLowerCase().includes('demo')) acc.demo += 1;
      else if (['not_configured', 'manual_setup_required', 'manual_check_required', 'disabled', 'missing_env', 'not_enabled'].includes(value)) acc.manual += 1;
      else if (['error', 'failed', 'unreachable'].includes(value)) acc.errors += 1;
      return acc;
    },
    { live: 0, demo: 0, manual: 0, errors: 0 },
  );

  const manualSetup = [
    ['Asgardeo', 'Manual console setup required unless issuer, client ID, and JWKS values are configured.'],
    ['Real WSO2 APIM', 'The bundled gateway is demo-compatible. Production uses full WSO2 API Manager with published APIs and token validation.'],
    ['Choreo Cloud', 'Local notification service works for the demo. Choreo Cloud deployment requires organization and invoke URL setup.'],
    ['Odoo Module', 'Use the direct Disaster Recovery module menu for demos. If General Settings shows a stock_move_sms_validation popup, avoid Settings and install the missing stock/SMS dependency only after confirming the Odoo module source.'],
    ['GeoNode', 'Disabled unless GEONODE_ENABLED and GeoNode credentials are configured.'],
  ];

  return (
    <div className="space-y-6">
      <div className="bg-gov-800 text-white rounded-lg p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h3 className="text-2xl font-bold">GovRecover360 Integration Command Center</h3>
            <p className="text-sm text-gov-100 mt-2 max-w-3xl">Live view of identity, API governance, beneficiary management, ERP operations, notifications, analytics, and AI services.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <span className="px-3 py-1 rounded-full bg-white/10 text-sm border border-white/20">Last checked: {checkedAt}</span>
            {authMode.status === 'mock' && <span className="px-3 py-1 rounded-full bg-blue-100 text-blue-800 text-sm font-medium">Demo Mode</span>}
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-4 text-sm">
          <p className="font-semibold">Integration status is unavailable</p>
          <p className="mt-1">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          ['Live Services', statusGroups.live, 'bg-green-50 text-green-800 border-green-100'],
          ['Demo Mode Services', statusGroups.demo, 'bg-blue-50 text-blue-800 border-blue-100'],
          ['Manual Setup Required', statusGroups.manual, 'bg-yellow-50 text-yellow-800 border-yellow-100'],
          ['Errors', statusGroups.errors, 'bg-red-50 text-red-800 border-red-100'],
        ].map(([label, value, classes]: any) => (
          <div key={label} className={`rounded-lg border p-4 ${classes}`}>
            <p className="text-xs font-semibold uppercase tracking-wide">{label}</p>
            <p className="text-3xl font-bold mt-2">{value}</p>
          </div>
        ))}
      </div>

      {loading && !status ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, idx) => (
            <div key={idx} className={`${cardClass} animate-pulse`}>
              <div className="h-4 bg-gray-200 rounded w-1/2" />
              <div className="h-3 bg-gray-100 rounded w-full mt-5" />
              <div className="h-3 bg-gray-100 rounded w-2/3 mt-3" />
            </div>
          ))}
        </div>
      ) : (
        <>
          <section>
            <div className="flex items-center justify-between gap-3 mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Integration Overview</h3>
              <button onClick={loadStatus} className="inline-flex items-center gap-2 px-4 py-2 bg-gov-600 text-white rounded-lg text-sm hover:bg-gov-700 disabled:opacity-60" disabled={loading}>
                <ArrowPathIcon className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {integrations.map((item) => (
                <div key={item.label} className={cardClass}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <ServerIcon className="h-5 w-5 text-gov-600 flex-shrink-0" />
                      <p className="text-sm font-semibold text-gray-900">{item.label}</p>
                    </div>
                    <StatusBadge status={item.data.status} />
                  </div>
                  <p className="text-sm text-gray-600 mt-4 min-h-[60px]">{item.purpose}</p>
                  <div className="mt-4 space-y-2 text-xs text-gray-500">
                    <p><span className="font-semibold text-gray-700">Mode:</span> {String(item.mode || item.data.status)}</p>
                    {item.publicUrl && <p className="break-all"><span className="font-semibold text-gray-700">Public URL:</span> {item.publicUrl}</p>}
                    {item.internalUrl && <p className="break-all"><span className="font-semibold text-gray-700">Docker URL:</span> {item.internalUrl}</p>}
                    <p><span className="font-semibold text-gray-700">Last checked:</span> {checkedAt}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className={cardClass}>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Odoo OpenG2P Modules & Workflows</h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Module Layer Configuration</h4>
                <div className="space-y-4">
                  <div className="flex items-start justify-between pb-3 border-b border-gray-100">
                    <div>
                      <p className="text-sm font-semibold text-gray-800">GovAid Disaster Recovery Module</p>
                      <p className="text-xs text-gray-500">Custom disaster management, relief applications, assessments, payment requests & dispatch operations.</p>
                    </div>
                    <span className="px-3 py-1 rounded-full bg-green-100 text-green-800 text-xs font-semibold">Active & Installed</span>
                  </div>
                  <div className="flex items-start justify-between pb-3 border-b border-gray-100">
                    <div>
                      <p className="text-sm font-semibold text-gray-800">OpenG2P Odoo Addons</p>
                      <p className="text-xs text-gray-500">Official OpenG2P social registry and program modules mounted separately.</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${status?.odoo_g2p_modules?.registry_installed ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                      {status?.odoo_g2p_modules?.registry_installed ? 'Registry Installed' : 'Not Installed'}
                    </span>
                  </div>
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-semibold text-gray-800">OpenG2P Demo Runtime</p>
                      <p className="text-xs text-gray-500">FastAPI-based API simulator running on port 8070 to echo registry and entitlement operations.</p>
                    </div>
                    <span className="px-3 py-1 rounded-full bg-blue-100 text-blue-800 text-xs font-semibold">Demo Active (8070)</span>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Addon Installation Status</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                    <p className="text-xs font-medium text-gray-500">G2P Modules Mounted</p>
                    <p className="text-lg font-bold text-gray-800 mt-1">{status?.odoo_g2p_modules?.mounted ? 'Yes' : 'No'}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                    <p className="text-xs font-medium text-gray-500">Registry Installed</p>
                    <p className="text-lg font-bold text-gray-800 mt-1">{status?.odoo_g2p_modules?.registry_installed ? 'Yes' : 'No'}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                    <p className="text-xs font-medium text-gray-500">PBMS Installed</p>
                    <p className="text-lg font-bold text-gray-800 mt-1">
                      {status?.odoo_g2p_modules?.pbms_installed ? 'Yes' : 'No (Manual Setup Required)'}
                    </p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                    <p className="text-xs font-medium text-gray-500">Bridge Installed</p>
                    <p className="text-lg font-bold text-gray-800 mt-1">{status?.odoo_g2p_modules?.bridge_installed ? 'Yes' : 'No'}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-gray-200">
              <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Odoo Actions</h4>
              <div className="flex flex-wrap gap-3">
                <button className={buttonClass} onClick={() => openUrl(odooAppsUrl)}>Open Odoo Apps (search "g2p")</button>
                <button className={buttonClass} onClick={() => openUrl(odooDeveloperUrl)}>Open Odoo Developer Mode</button>
                <button className={buttonClass} onClick={() => openUrl(odooDisasterModuleUrl)}>Open GovAid Disaster Recovery Menu</button>
                {status?.odoo_g2p_modules?.registry_installed && (
                  <button className={buttonClass} onClick={() => openUrl(`${env.odoo}/web?debug=1#menu_id=g2p_registry_base.g2p_main_menu_root`)}>Open G2P Registry Menu</button>
                )}
              </div>
            </div>
          </section>

          <section className={cardClass}>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Architecture Journey</h3>
            <div className="flex flex-col md:flex-row md:items-center gap-3 text-sm">
              {['Citizen / Officer', 'Asgardeo', 'WSO2 API Manager', 'GovRecover360 Backend', 'OpenG2P / Odoo / Choreo / Superset / AI'].map((step, idx) => (
                <div key={step} className="flex md:flex-1 items-center gap-3">
                  <div className="w-full rounded-lg border border-blue-100 bg-blue-50 px-4 py-3 text-blue-950 font-medium text-center">{step}</div>
                  {idx < 4 && <span className="hidden md:block text-gray-400">→</span>}
                </div>
              ))}
            </div>
          </section>

          <section className={cardClass}>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Demo Actions</h3>
            <div className="flex flex-wrap gap-3">
              <button className={buttonClass} disabled={Boolean(actionLoading)} onClick={() => testEndpoint('Backend health', () => api.get('/health'))}>Test Backend Health</button>
              <button className={buttonClass} disabled={Boolean(actionLoading)} onClick={() => testEndpoint('OpenG2P health', () => api.get('/openg2p/health'))}>Test OpenG2P Health</button>
              <button className={buttonClass} disabled={Boolean(actionLoading)} onClick={() => testEndpoint('WSO2 gateway', () => api.get('/integrations/wso2/status'))}>Test WSO2 Gateway</button>
              <button className={buttonClass} disabled={Boolean(actionLoading)} onClick={() => testEndpoint('WSO2 backend proxy', () => api.get('/integrations/wso2/status'))}>Test WSO2 Backend Proxy</button>
              <button className={buttonClass} disabled={Boolean(actionLoading)} onClick={() => testEndpoint('Choreo notifier', () => api.get('/integrations/status').then((res) => normalizeStatus(res.data?.choreo).status === 'ok' ? res : Promise.reject(new Error('Choreo notifier is unreachable'))))}>Test Choreo Notification Health</button>
              <button className={buttonClass} disabled={Boolean(actionLoading)} onClick={() => testEndpoint('AI health', () => api.get('/integrations/status').then((res) => normalizeStatus(res.data?.aiService).status === 'ok' ? res : Promise.reject(new Error('AI service is unreachable'))))}>Test AI Health</button>
              <button className={buttonClass} onClick={() => openUrl(env.superset)}>Open Superset</button>
              <button className={buttonClass} onClick={() => openUrl(env.odoo)}>Open Odoo</button>
              <button className={buttonClass} onClick={() => openUrl(odooDeveloperUrl)}>Open Odoo Developer Mode</button>
              <button className={buttonClass} onClick={() => openUrl(odooAppsUrl)}>Open Odoo Apps</button>
              <button className={buttonClass} onClick={() => openUrl(odooDisasterModuleUrl)}>Open Odoo Disaster Recovery Module</button>
              <button className={buttonClass} onClick={() => openUrl(env.asgardeoConsole)}>Open Asgardeo Console</button>
              <button className={buttonClass} onClick={() => openUrl(env.choreoConsole)}>Open Choreo Console</button>
              <button className={buttonClass} onClick={() => openUrl(env.wso2Gateway)}>Open WSO2 Gateway</button>
            </div>
          </section>

          <section>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Platform Console Hub</h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {[
                ['WSO2 API Manager', `Health: ${env.wso2Gateway}/health`, ['Open WSO2 Gateway', env.wso2Gateway], ['Open WSO2 Setup Guide', '/docs/wso2/WSO2_GUIDE.md'], 'Local gateway is demo-compatible. Production uses full WSO2 API Manager.'],
                ['Asgardeo', `Auth mode: ${asgardeo.authMode || authMode.status}. Client ID: ${asgardeo.clientIdConfigured ? 'configured' : 'not configured'}. Issuer: ${asgardeo.issuerConfigured ? 'configured' : 'not configured'}. JWKS: ${asgardeo.jwksConfigured ? 'configured' : 'not configured'}.`, ['Open Asgardeo Console', env.asgardeoConsole], ['Open GovRecover360 Asgardeo Application', env.asgardeoApplication], 'External console opens in a new tab because cloud consoles may block iframe embedding.'],
                ['Choreo', `Local notifier: ${env.choreoNotifier}/health. Organization: ${env.choreoOrg}`, ['Open Choreo Console', env.choreoConsole], ['Open Local Notification Service', `${env.choreoNotifier}/health`], 'Use local notifier for the Docker demo and Choreo Cloud for production invoke URLs.'],
                ['Superset', `URL: ${env.superset}`, ['Open Superset', env.superset], undefined, 'Analytics dashboard for disaster recovery KPIs.'],
                ['Odoo', `URL: ${env.odoo}`, ['Open Odoo Developer Mode', odooDeveloperUrl], ['Open Odoo Apps', odooAppsUrl], 'ERP back office for relief operations. Use developer mode to install or upgrade GovAid Disaster Recovery.'],
                ['OpenG2P', `Health: ${env.openg2p}/api/health`, ['Open OpenG2P Health', `${env.openg2p}/api/health`], ['Open OpenAPI', `${env.openg2p}/openapi.json`], 'Use the backend OpenG2P demo tab for beneficiary sync, eligibility, entitlement, and enrollment flows.'],
              ].map(([title, details, primary, secondary, note]: any) => (
                <div key={title} className={cardClass}>
                  <p className="text-sm font-semibold text-gray-900">{title}</p>
                  <p className="text-sm text-gray-600 mt-2 break-words">{details}</p>
                  <p className="text-xs text-gray-500 mt-2">{note}</p>
                  <div className="flex flex-wrap gap-2 mt-4">
                    {primary && <button className={buttonClass} onClick={() => openUrl(primary[1])}>{primary[0]}</button>}
                    {secondary && <button className={buttonClass} onClick={() => openUrl(secondary[1])}>{secondary[0]}</button>}
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="mt-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">API Documentation Command Center</h3>
            
            {/* Note & References Panel */}
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-5 mb-6">
              <h4 className="text-sm font-semibold text-blue-900 mb-2">Developer & API Integration Information</h4>
              <ul className="list-disc list-inside text-sm text-blue-800 space-y-2">
                <li>
                  <strong className="text-blue-950">Authentication Required:</strong> Protected endpoints (such as those under <code>/api/v1/disasters</code>, <code>/api/v1/households</code>, etc.) require an OAuth2 or mock Bearer token in the <code>Authorization</code> header. Use the <code>/api/v1/auth/login</code> endpoint with your admin credentials to retrieve a token for development.
                </li>
                <li>
                  <strong className="text-blue-950">Postman Collection:</strong> A preconfigured Postman collection is included in the project repository under <code>/postman/GovRecover360.postman_collection.json</code>. You can import it to instantly test all endpoints.
                </li>
                <li>
                  <strong className="text-blue-950">OpenAPI Schemas:</strong> JSON specification files are exposed directly for automated tool ingestion (e.g., configuring routes in WSO2 API Manager or generating client SDKs).
                </li>
              </ul>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* FastAPI Backend */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="p-1.5 bg-green-50 text-green-700 rounded-md font-bold text-xs">FastAPI</span>
                    <h4 className="text-sm font-semibold text-gray-900">GovRecover360 Core Backend</h4>
                  </div>
                  <p className="text-xs text-gray-500 mb-4">
                    Core disaster management system handling households, relief requests, inventory dispatch, user RBAC, audits, and third-party orchestration.
                  </p>
                </div>
                <div className="space-y-2 mt-auto">
                  <button className="w-full text-left px-3 py-2 rounded-lg text-xs font-medium bg-gov-50 text-gov-700 hover:bg-gov-100 flex justify-between items-center" onClick={() => openUrl(env.backendSwagger)}>
                    <span>Interactive Swagger UI</span>
                    <span className="text-gov-400">→</span>
                  </button>
                  <button className="w-full text-left px-3 py-2 rounded-lg text-xs font-medium bg-gov-50 text-gov-700 hover:bg-gov-100 flex justify-between items-center" onClick={() => openUrl(env.backendRedoc)}>
                    <span>Alternative ReDoc View</span>
                    <span className="text-gov-400">→</span>
                  </button>
                  <button className="w-full text-left px-3 py-2 rounded-lg text-xs font-medium bg-gray-50 text-gray-700 hover:bg-gray-100 flex justify-between items-center" onClick={() => openUrl(env.backendOpenApi)}>
                    <span>OpenAPI JSON Schema</span>
                    <span className="text-gray-400">→</span>
                  </button>
                </div>
              </div>

              {/* AI Decision Support */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="p-1.5 bg-purple-50 text-purple-700 rounded-md font-bold text-xs">AI/ML</span>
                    <h4 className="text-sm font-semibold text-gray-900">AI Decision Support Service</h4>
                  </div>
                  <p className="text-xs text-gray-500 mb-4">
                    Provides automated triage support, disaster summarization, and predictive analytics for relief program allocations.
                  </p>
                </div>
                <div className="space-y-2 mt-auto">
                  <button className="w-full text-left px-3 py-2 rounded-lg text-xs font-medium bg-gov-50 text-gov-700 hover:bg-gov-100 flex justify-between items-center" onClick={() => openUrl(env.aiSwagger)}>
                    <span>Interactive Swagger UI</span>
                    <span className="text-gov-400">→</span>
                  </button>
                  <button className="w-full text-left px-3 py-2 rounded-lg text-xs font-medium bg-gray-50 text-gray-700 hover:bg-gray-100 flex justify-between items-center" onClick={() => openUrl(env.aiOpenApi)}>
                    <span>OpenAPI JSON Schema</span>
                    <span className="text-gray-400">→</span>
                  </button>
                </div>
              </div>

              {/* OpenG2P Demo Runtime */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="p-1.5 bg-blue-50 text-blue-700 rounded-md font-bold text-xs">OpenG2P</span>
                    <h4 className="text-sm font-semibold text-gray-900">OpenG2P Demo Runtime</h4>
                  </div>
                  <p className="text-xs text-gray-500 mb-4">
                    Mock social protection runtime running on port 8070 to simulate registry updates, eligibility criteria checks, and entitlement management.
                  </p>
                </div>
                <div className="space-y-2 mt-auto">
                  <button className="w-full text-left px-3 py-2 rounded-lg text-xs font-medium bg-gov-50 text-gov-700 hover:bg-gov-100 flex justify-between items-center" onClick={() => openUrl(`${env.openg2p}/api/health`)}>
                    <span>Check Service Health</span>
                    <span className="text-gov-400">→</span>
                  </button>
                  <button className="w-full text-left px-3 py-2 rounded-lg text-xs font-medium bg-gray-50 text-gray-700 hover:bg-gray-100 flex justify-between items-center" onClick={() => openUrl(env.openg2pOpenApi)}>
                    <span>OpenAPI JSON Schema</span>
                    <span className="text-gray-400">→</span>
                  </button>
                </div>
              </div>

              {/* WSO2 Local Gateway */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="p-1.5 bg-red-50 text-red-700 rounded-md font-bold text-xs">Gateway</span>
                    <h4 className="text-sm font-semibold text-gray-900">WSO2 Demo Gateway</h4>
                  </div>
                  <p className="text-xs text-gray-500 mb-4">
                    Handles rate-limiting, API protection, governance, and traffic proxying to backend services.
                  </p>
                </div>
                <div className="space-y-2 mt-auto">
                  <button className="w-full text-left px-3 py-2 rounded-lg text-xs font-medium bg-gov-50 text-gov-700 hover:bg-gov-100 flex justify-between items-center" onClick={() => openUrl(`${env.wso2Gateway}/health`)}>
                    <span>Check Gateway Health</span>
                    <span className="text-gov-400">→</span>
                  </button>
                </div>
              </div>

              {/* Choreo Notification Service */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="p-1.5 bg-yellow-50 text-yellow-700 rounded-md font-bold text-xs">Notifier</span>
                    <h4 className="text-sm font-semibold text-gray-900">Choreo Notification Service</h4>
                  </div>
                  <p className="text-xs text-gray-500 mb-4">
                    Real-time microservice that dispatches SMS/email alerts for application status updates, payments, and dispatch events.
                  </p>
                </div>
                <div className="space-y-2 mt-auto">
                  <button className="w-full text-left px-3 py-2 rounded-lg text-xs font-medium bg-gov-50 text-gov-700 hover:bg-gov-100 flex justify-between items-center" onClick={() => openUrl(`${env.choreoNotifier}/health`)}>
                    <span>Check Service Health</span>
                    <span className="text-gov-400">→</span>
                  </button>
                </div>
              </div>
            </div>
          </section>
        </>
      )}

      <div className={cardClass}>
        <div className="flex items-center justify-between gap-3 mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Manual Setup Required</h3>
          <span className="px-3 py-1 rounded-full bg-yellow-100 text-yellow-800 text-xs font-semibold">Production Setup Required</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {manualSetup.map(([title, detail]) => (
            <div key={title} className="rounded-lg border border-gray-200 p-4">
              <p className="text-sm font-semibold text-gray-900">{title}</p>
              <p className="text-sm text-gray-600 mt-2">{detail}</p>
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
