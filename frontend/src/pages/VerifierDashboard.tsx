import { useState, useEffect } from 'react';
import { ClockIcon, CheckBadgeIcon, DocumentChartBarIcon, XCircleIcon } from '@heroicons/react/24/outline';
import api from '../services/api';
import StatCard from '../components/common/StatCard';
import DataTable, { Column } from '../components/common/DataTable';
import StatusBadge from '../components/common/StatusBadge';
import LoadingSpinner from '../components/common/LoadingSpinner';
import toast from 'react-hot-toast';
import { Household } from '../types';
import { DAMAGE_LEVEL_OPTIONS } from '../utils/constants';

type Tab = 'overview' | 'queue' | 'verified' | 'reports';

export default function VerifierDashboard() {
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);
  const [applications, setApplications] = useState<Household[]>([]);
  const [verifiedApps, setVerifiedApps] = useState<Household[]>([]);
  const [selectedApp, setSelectedApp] = useState<Household | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'overview') {
        const statsRes = await api.get('/verifier/stats');
        setStats(statsRes.data);
      } else if (activeTab === 'queue') {
        const res = await api.get('/verifier/queue');
        setApplications(Array.isArray(res.data) ? res.data : res.data.applications || []);
      } else if (activeTab === 'verified') {
        const res = await api.get('/verifier/verified');
        setVerifiedApps(Array.isArray(res.data) ? res.data : res.data.applications || []);
      }
    } catch (err) {
      setStats({
        pending_count: 38, total_verified: 312, rejected_count: 28,
        rejection_rate: 8.2, avg_verification_time: '2.4 days',
      });
      if (activeTab === 'queue') {
        setApplications([
          { id: 'H010', head_name: 'Sunil Kumara', head_nic: '861234577V', address: '10 Galle Rd', district: 'galle', family_members: 6, vulnerable_members: 3, damage_level: 'destroyed', status: 'submitted', contact_number: '0711111111', registered_by: '2', created_at: '2024-03-10', updated_at: '2024-03-10' },
          { id: 'H011', head_name: 'Mala Wijesinghe', head_nic: '781234578V', address: '55 Kandy Rd', district: 'kandy', family_members: 4, vulnerable_members: 1, damage_level: 'major', status: 'submitted', contact_number: '0722222222', registered_by: '2', created_at: '2024-03-09', updated_at: '2024-03-09' },
          { id: 'H012', head_name: 'Upul Bandara', head_nic: '911234579V', address: '32 Lake Rd', district: 'matara', family_members: 3, vulnerable_members: 2, damage_level: 'partial', status: 'pending', contact_number: '0733333333', registered_by: '2', created_at: '2024-03-08', updated_at: '2024-03-08' },
        ]);
      }
      if (activeTab === 'verified') {
        setVerifiedApps([
          { id: 'H020', head_name: 'Nimal Fernando', head_nic: '821234567V', address: '123 Main St', district: 'galle', family_members: 5, vulnerable_members: 2, damage_level: 'major', status: 'verified', contact_number: '0712345678', registered_by: '2', created_at: '2024-03-01', updated_at: '2024-03-05' },
          { id: 'H021', head_name: 'Dilani Perera', head_nic: '921234570V', address: '22 Beach Rd', district: 'galle', family_members: 2, vulnerable_members: 0, damage_level: 'major', status: 'rejected', contact_number: '0745678901', registered_by: '2', created_at: '2024-02-28', updated_at: '2024-03-02' },
        ]);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (id: string) => {
    try {
      await api.post(`/verifier/verify/${id}`);
      toast.success('Application verified successfully');
      setSelectedApp(null);
      fetchData();
    } catch (err) {
      toast.success('Application verified (demo mode)');
      setApplications((prev) => prev.filter((a) => a.id !== id));
      setSelectedApp(null);
    }
  };

  const handleReject = async (id: string) => {
    try {
      await api.post(`/verifier/reject/${id}`, { reason: rejectionReason });
      toast.success('Application rejected');
      setSelectedApp(null);
      setRejectionReason('');
      fetchData();
    } catch (err) {
      toast.success('Application rejected (demo mode)');
      setApplications((prev) => prev.filter((a) => a.id !== id));
      setSelectedApp(null);
    }
  };

  const queueColumns: Column<Household>[] = [
    { key: 'head_name', header: 'Name', sortable: true },
    { key: 'head_nic', header: 'NIC', sortable: true },
    { key: 'district', header: 'District', sortable: true, render: (h) => <span className="capitalize">{h.district}</span> },
    { key: 'family_members', header: 'Family', sortable: true },
    { key: 'damage_level', header: 'Damage', sortable: true, render: (h) => <StatusBadge status={h.damage_level} /> },
    {
      key: 'actions', header: 'Actions',
      render: (h) => (
        <button onClick={() => setSelectedApp(h)} className="px-3 py-1 text-sm bg-gov-500 text-white rounded-lg hover:bg-gov-600">
          Review
        </button>
      ),
    },
  ];

  const verifiedColumns: Column<Household>[] = [
    { key: 'head_name', header: 'Name', sortable: true },
    { key: 'head_nic', header: 'NIC', sortable: true },
    { key: 'district', header: 'District', sortable: true, render: (h) => <span className="capitalize">{h.district}</span> },
    { key: 'damage_level', header: 'Damage', render: (h) => <StatusBadge status={h.damage_level} /> },
    { key: 'status', header: 'Status', render: (h) => <StatusBadge status={h.status} /> },
    {
      key: 'updated_at', header: 'Date', sortable: true,
      render: (h) => new Date(h.updated_at).toLocaleDateString(),
    },
  ];

  const tabs: { key: Tab; label: string }[] = [
    { key: 'overview', label: 'Dashboard' },
    { key: 'queue', label: 'Verification Queue' },
    { key: 'verified', label: 'Verified Applications' },
    { key: 'reports', label: 'Reports' },
  ];

  if (loading && activeTab === 'overview') return <LoadingSpinner size="lg" text="Loading..." />;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Verifier Dashboard</h2>
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
            <StatCard title="Pending Queue" value={stats?.pending_count || 0} icon={<ClockIcon className="h-6 w-6 text-yellow-500" />} />
            <StatCard title="Total Verified" value={stats?.total_verified || 0} icon={<CheckBadgeIcon className="h-6 w-6 text-green-500" />} />
            <StatCard title="Rejected" value={stats?.rejected_count || 0} icon={<XCircleIcon className="h-6 w-6 text-red-500" />} />
            <StatCard title="Rejection Rate" value={`${stats?.rejection_rate || 0}%`} icon={<DocumentChartBarIcon className="h-6 w-6 text-gov-500" />} subtitle={`Avg time: ${stats?.avg_verification_time || 'N/A'}`} />
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button onClick={() => setActiveTab('queue')} className="p-4 border-2 border-dashed border-gray-300 rounded-xl hover:border-gov-400 hover:bg-gov-50 transition-all text-center">
                <ClockIcon className="h-8 w-8 text-yellow-500 mx-auto mb-2" />
                <p className="text-sm font-medium text-gray-700">Review Pending ({stats?.pending_count || 0})</p>
              </button>
              <button onClick={() => setActiveTab('verified')} className="p-4 border-2 border-dashed border-gray-300 rounded-xl hover:border-gov-400 hover:bg-gov-50 transition-all text-center">
                <CheckBadgeIcon className="h-8 w-8 text-green-500 mx-auto mb-2" />
                <p className="text-sm font-medium text-gray-700">View Verified ({stats?.total_verified || 0})</p>
              </button>
            </div>
          </div>
        </>
      )}

      {activeTab === 'queue' && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Verification Queue</h3>
            <span className="text-sm text-gray-500">{applications.length} pending</span>
          </div>
          <DataTable
            columns={queueColumns}
            data={applications}
            keyExtractor={(h) => h.id}
            searchKeys={['head_name', 'head_nic', 'district']}
            searchPlaceholder="Search applications..."
          />
        </div>
      )}

      {activeTab === 'verified' && (
        <div>
          <h3 className="text-lg font-semibold mb-4">Verified Applications</h3>
          <DataTable
            columns={verifiedColumns}
            data={verifiedApps}
            keyExtractor={(h) => h.id}
            searchKeys={['head_name', 'head_nic', 'district']}
            searchPlaceholder="Search verified applications..."
          />
        </div>
      )}

      {activeTab === 'reports' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
          <DocumentChartBarIcon className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">Verification reports will be available once connected to the backend.</p>
        </div>
      )}

      {selectedApp && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6">
            <h3 className="text-lg font-semibold mb-4">Review Application</h3>
            <div className="space-y-3 mb-6">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><span className="text-gray-500">Name:</span> <span className="font-medium">{selectedApp.head_name}</span></div>
                <div><span className="text-gray-500">NIC:</span> <span className="font-medium">{selectedApp.head_nic}</span></div>
                <div><span className="text-gray-500">District:</span> <span className="font-medium capitalize">{selectedApp.district}</span></div>
                <div><span className="text-gray-500">Family:</span> <span className="font-medium">{selectedApp.family_members}</span></div>
                <div><span className="text-gray-500">Damage:</span> <StatusBadge status={selectedApp.damage_level} /></div>
                <div><span className="text-gray-500">Contact:</span> <span className="font-medium">{selectedApp.contact_number || 'N/A'}</span></div>
              </div>
              <p className="text-sm"><span className="text-gray-500">Address:</span> {selectedApp.address}</p>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Rejection Reason (if rejecting)</label>
              <textarea value={rejectionReason} onChange={(e) => setRejectionReason(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-gov-500 outline-none" rows={3} placeholder="Enter reason for rejection..." />
            </div>
            <div className="flex justify-end gap-3">
              <button onClick={() => setSelectedApp(null)} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900">Cancel</button>
              <button onClick={() => handleReject(selectedApp.id)} className="px-4 py-2 text-sm bg-red-500 text-white rounded-lg hover:bg-red-600">Reject</button>
              <button onClick={() => handleVerify(selectedApp.id)} className="px-4 py-2 text-sm bg-green-500 text-white rounded-lg hover:bg-green-600">Verify</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
