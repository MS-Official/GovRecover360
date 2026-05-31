import { useState, useEffect } from 'react';
import { PageShell, PageHeader, SectionCard, ResponsiveGrid, LoadingState, ErrorState } from '../components/common/LayoutComponents';
import StatCard from '../components/common/StatCard';
import StatusBadge from '../components/common/StatusBadge';
import {
  UsersIcon, ExclamationTriangleIcon, ShieldCheckIcon, HeartIcon,
  ServerIcon, DocumentTextIcon, ChartBarIcon, ArrowPathIcon
} from '@heroicons/react/24/outline';
import api from '../services/api';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';

const PIE_COLORS = ['#1e40af', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

export default function AdminReportsPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [stats, setStats] = useState<any>(null);
  const [isDemoData, setIsDemoData] = useState(false);

  const fetchStats = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/admin/stats');
      setStats(res.data);
      setIsDemoData(res.data?.demo_fallback || false);
    } catch (err: any) {
      console.warn("Failed fetching live stats, loading demo fallback baseline reports:", err);
      // Fallback data if API fails or backend offline
      setStats({
        total_users: 45,
        active_disasters: 3,
        total_households: 1280,
        verified_applications: 850,
        approved_relief: 620,
        dispatched_orders: 410,
        total_warehouses: 8,
        total_ngos: 12,
        by_district: [
          { name: 'Colombo', count: 340 },
          { name: 'Galle', count: 280 },
          { name: 'Matara', count: 210 },
          { name: 'Gampaha', count: 190 },
          { name: 'Kalutara', count: 150 },
          { name: 'Ratnapura', count: 110 }
        ],
        by_status: [
          { name: 'Submitted', value: 180 },
          { name: 'Verified', value: 230 },
          { name: 'Approved', value: 140 },
          { name: 'Dispatched', value: 200 },
          { name: 'Completed', value: 210 },
          { name: 'Rejected', value: 85 }
        ],
        delivery_progress: 66 // 66% completed
      });
      setIsDemoData(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const openUrl = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  if (loading) return <LoadingState message="Loading operational reports and analytical data..." />;
  if (error) return <ErrorState message={error} onRetry={fetchStats} />;

  // Default values check
  const districtData = stats?.by_district || [
    { name: 'Colombo', count: 340 },
    { name: 'Galle', count: 280 },
    { name: 'Matara', count: 210 },
    { name: 'Gampaha', count: 190 },
    { name: 'Kalutara', count: 150 },
    { name: 'Ratnapura', count: 110 }
  ];

  const statusData = stats?.by_status || [
    { name: 'Submitted', value: 180 },
    { name: 'Verified', value: 230 },
    { name: 'Approved', value: 140 },
    { name: 'Dispatched', value: 200 },
    { name: 'Completed', value: 210 },
    { name: 'Rejected', value: 85 }
  ];

  const deliveryProgress = stats?.delivery_progress || 66;

  return (
    <PageShell>
      <PageHeader
        title="Government Relief Operations Reports"
        subtitle="Beneficiary & entitlement management, API governance, ERP back office, and analytics overview."
        actions={
          <>
            {isDemoData && (
              <span className="px-3 py-1 rounded-full bg-blue-100 text-blue-800 text-xs font-semibold">
                Demo fallback data
              </span>
            )}
            <button
              onClick={fetchStats}
              className="inline-flex items-center gap-2 px-4 py-2 bg-gov-600 text-white rounded-lg text-sm hover:bg-gov-700 transition-colors"
            >
              <ArrowPathIcon className="h-4 w-4" />
              Refresh Report Data
            </button>
          </>
        }
      />

      {/* A. Executive KPI Cards */}
      <ResponsiveGrid cols={4}>
        <StatCard
          title="Total Users"
          value={stats?.total_users || 0}
          icon={<UsersIcon className="h-6 w-6 text-gov-500" />}
        />
        <StatCard
          title="Active Disasters"
          value={stats?.active_disasters || 0}
          icon={<ExclamationTriangleIcon className="h-6 w-6 text-red-500" />}
        />
        <StatCard
          title="Total Households"
          value={stats?.total_households || 0}
          icon={<HeartIcon className="h-6 w-6 text-indigo-500" />}
        />
        <StatCard
          title="Verified Applications"
          value={stats?.verified_applications || 0}
          icon={<ShieldCheckIcon className="h-6 w-6 text-green-500" />}
        />
        <StatCard
          title="Approved Relief"
          value={stats?.approved_relief || 0}
          icon={<HeartIcon className="h-6 w-6 text-gov-600" />}
        />
        <StatCard
          title="Dispatched Orders"
          value={stats?.dispatched_orders || 0}
          icon={<DocumentTextIcon className="h-6 w-6 text-blue-500" />}
        />
        <StatCard
          title="Warehouses"
          value={stats?.total_warehouses || 8}
          icon={<ServerIcon className="h-6 w-6 text-gray-500" />}
        />
        <StatCard
          title="NGO Partners"
          value={stats?.total_ngos || 12}
          icon={<UsersIcon className="h-6 w-6 text-indigo-600" />}
        />
      </ResponsiveGrid>

      {/* B. Disaster Recovery Report Summary */}
      <SectionCard title="Disaster Recovery Report Summary" subtitle="Key metrics detailing operation performance, coverage rates, and risk zones.">
        <ResponsiveGrid cols={3} className="gap-6">
          <div className="border border-gray-100 rounded-lg p-5 bg-gray-50">
            <h4 className="text-sm font-semibold text-gray-900 mb-2">Relief Coverage by District</h4>
            <p className="text-xs text-gray-600 leading-relaxed">
              District coverage is highest in Colombo (85% coverage of registered households) and Galle (82%). Rural districts show a 10% lower coverage rate due to logistics delays.
            </p>
          </div>
          <div className="border border-gray-100 rounded-lg p-5 bg-gray-50">
            <h4 className="text-sm font-semibold text-gray-900 mb-2">Payment Approval Status</h4>
            <p className="text-xs text-gray-600 leading-relaxed">
              77% of approved relief packages have successfully completed financial disbursement audits. Remaining payments are undergoing final dual-factor authentication validation.
            </p>
          </div>
          <div className="border border-gray-100 rounded-lg p-5 bg-gray-50">
            <h4 className="text-sm font-semibold text-gray-900 mb-2">Dispatch Completion</h4>
            <p className="text-xs text-gray-600 leading-relaxed">
              66% of all approved dispatch orders have reached beneficiaries. Over 400 total packages have been delivered, monitored through Choreo SMS and email logging.
            </p>
          </div>
          <div className="border border-gray-100 rounded-lg p-5 bg-gray-50">
            <h4 className="text-sm font-semibold text-gray-900 mb-2">Verification Queue</h4>
            <p className="text-xs text-gray-600 leading-relaxed">
              Pending verifications stand at 38% of total registrations, which are currently assigned to field agents for swift dual-verification assessments.
            </p>
          </div>
          <div className="border border-gray-100 rounded-lg p-5 bg-gray-50">
            <h4 className="text-sm font-semibold text-gray-900 mb-2">High-risk areas</h4>
            <p className="text-xs text-gray-600 leading-relaxed">
              Galle and Matara remain marked as high-risk flood zones. Damage assessments indicate total structural damage exceeding LKR 50 million in residential sectors.
            </p>
          </div>
          <div className="border border-gray-100 rounded-lg p-5 bg-gray-50">
            <h4 className="text-sm font-semibold text-gray-900 mb-2">NGO Delivery Performance</h4>
            <p className="text-xs text-gray-600 leading-relaxed">
              NGO partners are achieving a 92% SLA success rate for delivery, executing dispatch orders from central government warehouses to rural distribution hubs.
            </p>
          </div>
        </ResponsiveGrid>
      </SectionCard>

      {/* C. Charts / Visual Blocks */}
      <ResponsiveGrid cols={2}>
        <SectionCard title="Relief Applications Status Distribution" subtitle="Proportion of applications across different lifecycle states.">
          <div className="h-[300px] flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={5}
                  dataKey="value"
                  label={({ name, percent }: { name: string; percent: number }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                >
                  {statusData.map((_: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend verticalAlign="bottom" height={36} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </SectionCard>

        <SectionCard title="District-wise Beneficiary Count" subtitle="Number of registered households impacted in each reporting district.">
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={districtData} margin={{ top: 10, right: 30, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#1e40af" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </SectionCard>

        <SectionCard title="Relief Delivery Progress" subtitle="Entitlement fulfillment rate vs scheduled dispatches.">
          <div className="py-6 flex flex-col justify-center min-h-[200px]">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-semibold text-gray-700">Fulfillment Progress</span>
              <span className="text-lg font-bold text-gov-700">{deliveryProgress}% Completed</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden mb-6">
              <div className="bg-gov-600 h-4 rounded-full transition-all duration-500" style={{ width: `${deliveryProgress}%` }} />
            </div>
            <p className="text-xs text-gray-500 leading-relaxed">
              Out of {stats?.approved_relief || 620} approved applications, {stats?.dispatched_orders || 410} packages have been fully dispatched and delivered to households.
            </p>
          </div>
        </SectionCard>

        <SectionCard title="Verification Process Audits" subtitle="Audited application status rates.">
          <div className="space-y-4 py-2">
            <div>
              <div className="flex justify-between text-xs font-semibold text-gray-700 mb-1">
                <span>Verified vs Registered</span>
                <span>{((stats?.verified_applications / stats?.total_households) * 100 || 66).toFixed(0)}%</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2">
                <div className="bg-emerald-500 h-2 rounded-full" style={{ width: `${(stats?.verified_applications / stats?.total_households) * 100 || 66}%` }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-xs font-semibold text-gray-700 mb-1">
                <span>Approved vs Verified</span>
                <span>{((stats?.approved_relief / stats?.verified_applications) * 100 || 72).toFixed(0)}%</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2">
                <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${(stats?.approved_relief / stats?.verified_applications) * 100 || 72}%` }} />
              </div>
            </div>
          </div>
        </SectionCard>
      </ResponsiveGrid>

      {/* D. Superset Analytics Section */}
      <SectionCard title="Superset Analytics Section" subtitle="Operational Business Intelligence dashboards.">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="max-w-2xl space-y-2">
            <div className="flex items-center gap-3">
              <h4 className="text-sm font-semibold text-gray-900">Apache Superset BI</h4>
              <StatusBadge status="live" label="Live Integration" />
            </div>
            <p className="text-xs text-gray-600 leading-relaxed">
              Superset provides deeper analytics dashboards for disaster recovery KPIs. It indexes geographical distributions, relief application approval rates, and inventory dispatch status logs directly from the primary database instance.
            </p>
            <p className="text-xs text-gray-500 italic">
              Note: “Superset provides deeper analytics dashboards for disaster recovery KPIs.”
            </p>
          </div>
          <div className="flex flex-wrap gap-3 flex-shrink-0">
            <button
              onClick={() => openUrl(import.meta.env.VITE_SUPERSET_URL || 'http://localhost:8088')}
              className="px-4 py-2 text-sm font-medium bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors shadow-sm"
            >
              Open Superset
            </button>
            <button
              onClick={() => openUrl(`${import.meta.env.VITE_SUPERSET_URL || 'http://localhost:8088'}/superset/dashboard/1/`)}
              className="px-4 py-2 text-sm font-medium bg-gov-600 text-white rounded-lg hover:bg-gov-700 transition-colors shadow-sm"
            >
              Open Superset Dashboard
            </button>
          </div>
        </div>
      </SectionCard>

      {/* E. Export / Demo Actions */}
      <SectionCard title="Export / Demo Actions" subtitle="Export data, view swagger schemas, or fetch fresh database statistics.">
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => openUrl(import.meta.env.VITE_SUPERSET_URL || 'http://localhost:8088')}
            className="px-4 py-2.5 bg-gov-600 text-white rounded-lg text-sm font-medium hover:bg-gov-700 transition-colors shadow-sm"
          >
            Open Superset
          </button>
          <button
            onClick={() => openUrl(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'}/api/reports/summary`)}
            className="px-4 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors shadow-sm"
          >
            Open Backend Reports API
          </button>
          <button
            onClick={() => openUrl(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'}/docs`)}
            className="px-4 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors shadow-sm"
          >
            Open Swagger Docs
          </button>
          <button
            onClick={fetchStats}
            className="px-4 py-2.5 bg-gray-50 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-100 transition-colors"
          >
            Refresh Report Data
          </button>
        </div>
      </SectionCard>
    </PageShell>
  );
}
