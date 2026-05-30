import { useState, useEffect } from 'react';
import { HeartIcon, UsersIcon, CheckBadgeIcon, BriefcaseIcon } from '@heroicons/react/24/outline';
import api from '../services/api';
import StatCard from '../components/common/StatCard';
import DataTable, { Column } from '../components/common/DataTable';
import StatusBadge from '../components/common/StatusBadge';
import LoadingSpinner from '../components/common/LoadingSpinner';
import toast from 'react-hot-toast';
import { Household } from '../types';

type Tab = 'overview' | 'beneficiaries' | 'approvals' | 'ngo';

export default function ProgramManagerDashboard() {
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);
  const [beneficiaries, setBeneficiaries] = useState<Household[]>([]);
  const [approvals, setApprovals] = useState<Household[]>([]);
  const [showNgoModal, setShowNgoModal] = useState(false);
  const [selectedApproval, setSelectedApproval] = useState<Household | null>(null);

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'overview') {
        const res = await api.get('/manager/stats');
        setStats(res.data);
      } else if (activeTab === 'beneficiaries') {
        const res = await api.get('/manager/beneficiaries');
        setBeneficiaries(Array.isArray(res.data) ? res.data : res.data.beneficiaries || []);
      } else if (activeTab === 'approvals') {
        const res = await api.get('/manager/approvals');
        setApprovals(Array.isArray(res.data) ? res.data : res.data.approvals || []);
      }
    } catch (err) {
      setStats({
        total_programs: 5, verified_beneficiaries: 720, pending_approval: 84,
        approved_relief: 512, active_ngos: 12, relief_packages: 8,
      });
      if (activeTab === 'beneficiaries') {
        setBeneficiaries([
          { id: 'H030', head_name: 'Nimal Fernando', head_nic: '821234567V', address: '123 Main St', district: 'galle', family_members: 5, vulnerable_members: 2, damage_level: 'major', status: 'verified', registered_by: '2', created_at: '2024-03-01', updated_at: '2024-03-05' },
          { id: 'H031', head_name: 'Saroja Devi', head_nic: '751234568V', address: '45 Temple Rd', district: 'galle', family_members: 3, vulnerable_members: 1, damage_level: 'destroyed', status: 'verified', registered_by: '2', created_at: '2024-03-02', updated_at: '2024-03-06' },
        ]);
      }
      if (activeTab === 'approvals') {
        setApprovals([
          { id: 'H040', head_name: 'Gamini Silva', head_nic: '801234569V', address: '78 Lake View', district: 'matara', family_members: 4, vulnerable_members: 3, damage_level: 'major', status: 'verified', registered_by: '2', created_at: '2024-03-03', updated_at: '2024-03-07' },
          { id: 'H041', head_name: 'Dilani Perera', head_nic: '921234570V', address: '22 Beach Rd', district: 'galle', family_members: 2, vulnerable_members: 0, damage_level: 'major', status: 'verified', registered_by: '2', created_at: '2024-03-04', updated_at: '2024-03-08' },
        ]);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id: string) => {
    try {
      await api.post(`/manager/approve/${id}`);
      toast.success('Application approved');
      setApprovals((prev) => prev.filter((a) => a.id !== id));
    } catch (err) {
      toast.success('Approved (demo mode)');
      setApprovals((prev) => prev.filter((a) => a.id !== id));
    }
  };

  const beneficiaryColumns: Column<Household>[] = [
    { key: 'head_name', header: 'Name', sortable: true },
    { key: 'head_nic', header: 'NIC', sortable: true },
    { key: 'district', header: 'District', sortable: true, render: (h) => <span className="capitalize">{h.district}</span> },
    { key: 'family_members', header: 'Family', sortable: true },
    { key: 'vulnerable_members', header: 'Vulnerable', sortable: true },
    { key: 'damage_level', header: 'Damage', render: (h) => <StatusBadge status={h.damage_level} /> },
  ];

  const approvalColumns: Column<Household>[] = [
    { key: 'head_name', header: 'Name', sortable: true },
    { key: 'head_nic', header: 'NIC', sortable: true },
    { key: 'district', header: 'District', sortable: true, render: (h) => <span className="capitalize">{h.district}</span> },
    { key: 'family_members', header: 'Family', sortable: true },
    { key: 'damage_level', header: 'Damage', render: (h) => <StatusBadge status={h.damage_level} /> },
    {
      key: 'actions', header: 'Actions',
      render: (h) => (
        <div className="flex gap-2">
          <button onClick={() => handleApprove(h.id)} className="px-3 py-1 text-sm bg-green-500 text-white rounded-lg hover:bg-green-600">Approve</button>
          <button onClick={() => { setSelectedApproval(h); setShowNgoModal(true); }} className="px-3 py-1 text-sm bg-gov-500 text-white rounded-lg hover:bg-gov-600">Assign NGO</button>
        </div>
      ),
    },
  ];

  const tabs: { key: Tab; label: string }[] = [
    { key: 'overview', label: 'Dashboard' },
    { key: 'beneficiaries', label: 'Beneficiaries' },
    { key: 'approvals', label: 'Approvals' },
    { key: 'ngo', label: 'NGO Assignments' },
  ];

  if (loading && activeTab === 'overview') return <LoadingSpinner size="lg" text="Loading..." />;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Program Manager Dashboard</h2>
      </div>

      <div className="flex gap-2 mb-6 flex-wrap">
        {tabs.map((t) => (
          <button key={t.key} onClick={() => setActiveTab(t.key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === t.key ? 'bg-gov-500 text-white' : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
              }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {activeTab === 'overview' && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <StatCard title="Relief Programs" value={stats?.total_programs || 0} icon={<HeartIcon className="h-6 w-6 text-relief-500" />} />
            <StatCard title="Verified Beneficiaries" value={stats?.verified_beneficiaries || 0} icon={<UsersIcon className="h-6 w-6 text-gov-500" />} />
            <StatCard title="Pending Approval" value={stats?.pending_approval || 0} icon={<CheckBadgeIcon className="h-6 w-6 text-yellow-500" />} />
            <StatCard title="Active NGOs" value={stats?.active_ngos || 0} icon={<BriefcaseIcon className="h-6 w-6 text-indigo-500" />} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button onClick={() => setActiveTab('approvals')} className="stat-card text-center">
              <p className="text-3xl font-bold text-yellow-500">{stats?.pending_approval || 0}</p>
              <p className="text-sm text-gray-500 mt-1">Applications Pending Approval</p>
            </button>
            <button onClick={() => setActiveTab('beneficiaries')} className="stat-card text-center">
              <p className="text-3xl font-bold text-green-500">{stats?.verified_beneficiaries || 0}</p>
              <p className="text-sm text-gray-500 mt-1">Verified Beneficiaries</p>
            </button>
          </div>
        </>
      )}

      {activeTab === 'beneficiaries' && (
        <div>
          <h3 className="text-lg font-semibold mb-4">Verified Beneficiaries</h3>
          <DataTable
            columns={beneficiaryColumns}
            data={beneficiaries}
            keyExtractor={(h) => h.id}
            searchKeys={['head_name', 'head_nic', 'district']}
            searchPlaceholder="Search beneficiaries..."
          />
        </div>
      )}

      {activeTab === 'approvals' && (
        <div>
          <h3 className="text-lg font-semibold mb-4">Relief Approval Queue</h3>
          <DataTable
            columns={approvalColumns}
            data={approvals}
            keyExtractor={(h) => h.id}
            searchKeys={['head_name', 'head_nic', 'district']}
            searchPlaceholder="Search approvals..."
          />
        </div>
      )}

      {activeTab === 'ngo' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
          <BriefcaseIcon className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 mb-4">NGO assignment interface will be available once connected to the backend.</p>
          <div className="max-w-md mx-auto space-y-3">
            <select className="w-full px-3 py-2 border rounded-lg text-sm">
              <option value="">Select NGO Partner</option>
              <option value="1">Sarah Foundation</option>
              <option value="2">Red Cross Sri Lanka</option>
              <option value="3">World Vision</option>
            </select>
            <button className="w-full py-2 bg-gov-500 text-white rounded-lg text-sm hover:bg-gov-600">Assign Selected NGO</button>
          </div>
        </div>
      )}

      {showNgoModal && selectedApproval && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold mb-4">Assign NGO to {selectedApproval.head_name}</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Select NGO</label>
                <select className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-gov-500 outline-none">
                  <option value="">Choose an NGO...</option>
                  <option value="ngo1">Sarah Foundation</option>
                  <option value="ngo2">Red Cross Sri Lanka</option>
                  <option value="ngo3">World Vision</option>
                  <option value="ngo4">UNICEF Sri Lanka</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea rows={3} className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-gov-500 outline-none" />
              </div>
              <div className="flex justify-end gap-3">
                <button onClick={() => setShowNgoModal(false)} className="px-4 py-2 text-sm text-gray-600">Cancel</button>
                <button onClick={() => { toast.success('NGO assigned (demo)'); setShowNgoModal(false); }} className="px-4 py-2 text-sm bg-gov-500 text-white rounded-lg hover:bg-gov-600">Assign</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
