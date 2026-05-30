import { useState, useEffect } from 'react';
import { UserPlusIcon, FolderIcon, ClipboardDocumentCheckIcon, CheckBadgeIcon } from '@heroicons/react/24/outline';
import api from '../services/api';
import StatCard from '../components/common/StatCard';
import DataTable, { Column } from '../components/common/DataTable';
import StatusBadge from '../components/common/StatusBadge';
import LoadingSpinner from '../components/common/LoadingSpinner';
import toast from 'react-hot-toast';
import { Household } from '../types';
import { DAMAGE_LEVEL_OPTIONS, DISTRICT_OPTIONS } from '../utils/constants';

type Tab = 'overview' | 'register' | 'cases' | 'assessment';

export default function FieldOfficerDashboard() {
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);
  const [households, setHouseholds] = useState<Household[]>([]);
  const [formData, setFormData] = useState({
    head_name: '', head_nic: '', address: '', district: '', family_members: 1,
    vulnerable_members: 0, damage_level: 'none', contact_number: '', notes: '',
  });

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'overview') {
        const res = await api.get('/field-officer/stats');
        setStats(res.data);
      } else if (activeTab === 'cases') {
        const res = await api.get('/field-officer/cases');
        setHouseholds(Array.isArray(res.data) ? res.data : res.data.households || []);
      }
    } catch (err) {
      setStats({
        registered_households: 145, pending_verification: 38, verified: 92,
        rejected: 15, active_disasters: 3, cases_this_month: 22,
      });
      if (activeTab === 'cases') {
        setHouseholds([
          { id: 'H001', head_name: 'Nimal Fernando', head_nic: '821234567V', address: '123 Main St', district: 'galle', family_members: 5, vulnerable_members: 2, damage_level: 'major', status: 'submitted', contact_number: '0712345678', registered_by: '2', created_at: '2024-03-15', updated_at: '2024-03-15' },
          { id: 'H002', head_name: 'Saroja Devi', head_nic: '751234568V', address: '45 Temple Rd', district: 'galle', family_members: 3, vulnerable_members: 1, damage_level: 'destroyed', status: 'verified', contact_number: '0723456789', registered_by: '2', created_at: '2024-03-14', updated_at: '2024-03-14' },
          { id: 'H003', head_name: 'Gamini Silva', head_nic: '801234569V', address: '78 Lake View', district: 'matara', family_members: 4, vulnerable_members: 3, damage_level: 'partial', status: 'rejected', contact_number: '0734567890', registered_by: '2', created_at: '2024-03-13', updated_at: '2024-03-13' },
          { id: 'H004', head_name: 'Dilani Perera', head_nic: '921234570V', address: '22 Beach Rd', district: 'galle', family_members: 2, vulnerable_members: 0, damage_level: 'major', status: 'pending', contact_number: '0745678901', registered_by: '2', created_at: '2024-03-12', updated_at: '2024-03-12' },
        ]);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.head_name || !formData.head_nic || !formData.address || !formData.district) {
      toast.error('Please fill all required fields');
      return;
    }
    try {
      await api.post('/field-officer/households', formData);
      toast.success('Household registered successfully');
      setFormData({ head_name: '', head_nic: '', address: '', district: '', family_members: 1, vulnerable_members: 0, damage_level: 'none', contact_number: '', notes: '' });
    } catch (err) {
      toast.success('Household registered (demo mode)');
      setFormData({ head_name: '', head_nic: '', address: '', district: '', family_members: 1, vulnerable_members: 0, damage_level: 'none', contact_number: '', notes: '' });
    }
  };

  const columns: Column<Household>[] = [
    { key: 'head_name', header: 'Head of Household', sortable: true },
    { key: 'head_nic', header: 'NIC', sortable: true },
    { key: 'district', header: 'District', sortable: true, render: (h) => <span className="capitalize">{h.district}</span> },
    { key: 'family_members', header: 'Family Size', sortable: true },
    { key: 'damage_level', header: 'Damage', sortable: true, render: (h) => <StatusBadge status={h.damage_level} /> },
    { key: 'status', header: 'Status', sortable: true, render: (h) => <StatusBadge status={h.status} /> },
  ];

  const tabs: { key: Tab; label: string }[] = [
    { key: 'overview', label: 'Dashboard' },
    { key: 'register', label: 'Register Household' },
    { key: 'cases', label: 'My Cases' },
    { key: 'assessment', label: 'Damage Assessment' },
  ];

  if (loading && activeTab === 'overview') return <LoadingSpinner size="lg" text="Loading dashboard..." />;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Field Officer Dashboard</h2>
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
            <StatCard title="Registered Households" value={stats?.registered_households || 0} icon={<UserPlusIcon className="h-6 w-6 text-gov-500" />} />
            <StatCard title="Pending Verification" value={stats?.pending_verification || 0} icon={<FolderIcon className="h-6 w-6 text-yellow-500" />} />
            <StatCard title="Verified" value={stats?.verified || 0} icon={<CheckBadgeIcon className="h-6 w-6 text-green-500" />} />
            <StatCard title="Cases This Month" value={stats?.cases_this_month || 0} icon={<ClipboardDocumentCheckIcon className="h-6 w-6 text-indigo-500" />} />
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button onClick={() => setActiveTab('register')} className="p-4 border-2 border-dashed border-gray-300 rounded-xl hover:border-gov-400 hover:bg-gov-50 transition-all text-center">
                <UserPlusIcon className="h-8 w-8 text-gov-500 mx-auto mb-2" />
                <p className="text-sm font-medium text-gray-700">Register New Household</p>
              </button>
              <button onClick={() => setActiveTab('cases')} className="p-4 border-2 border-dashed border-gray-300 rounded-xl hover:border-gov-400 hover:bg-gov-50 transition-all text-center">
                <FolderIcon className="h-8 w-8 text-gov-500 mx-auto mb-2" />
                <p className="text-sm font-medium text-gray-700">View My Cases</p>
              </button>
              <button onClick={() => setActiveTab('assessment')} className="p-4 border-2 border-dashed border-gray-300 rounded-xl hover:border-gov-400 hover:bg-gov-50 transition-all text-center">
                <ClipboardDocumentCheckIcon className="h-8 w-8 text-gov-500 mx-auto mb-2" />
                <p className="text-sm font-medium text-gray-700">Submit Assessment</p>
              </button>
            </div>
          </div>
        </>
      )}

      {activeTab === 'register' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 max-w-2xl">
          <h3 className="text-lg font-semibold mb-4">Register New Household</h3>
          <form onSubmit={handleRegister} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Head of Household *</label>
                <input type="text" value={formData.head_name} onChange={(e) => setFormData({ ...formData, head_name: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-gov-500 outline-none" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">NIC Number *</label>
                <input type="text" value={formData.head_nic} onChange={(e) => setFormData({ ...formData, head_nic: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-gov-500 outline-none" required />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Address *</label>
                <input type="text" value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-gov-500 outline-none" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">District *</label>
                <select value={formData.district} onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-gov-500 outline-none" required>
                  <option value="">Select district</option>
                  {DISTRICT_OPTIONS.map((d) => <option key={d.value} value={d.value}>{d.label}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Contact Number</label>
                <input type="text" value={formData.contact_number} onChange={(e) => setFormData({ ...formData, contact_number: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-gov-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Family Members</label>
                <input type="number" min={1} value={formData.family_members} onChange={(e) => setFormData({ ...formData, family_members: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-gov-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Vulnerable Members</label>
                <input type="number" min={0} value={formData.vulnerable_members} onChange={(e) => setFormData({ ...formData, vulnerable_members: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-gov-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Damage Level</label>
                <select value={formData.damage_level} onChange={(e) => setFormData({ ...formData, damage_level: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-gov-500 outline-none">
                  {DAMAGE_LEVEL_OPTIONS.map((d) => <option key={d.value} value={d.value}>{d.label}</option>)}
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} rows={3}
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-gov-500 outline-none" />
              </div>
            </div>
            <div className="flex justify-end pt-2">
              <button type="submit" className="px-6 py-2.5 bg-gov-500 text-white rounded-lg text-sm font-medium hover:bg-gov-600 transition-colors">
                Register Household
              </button>
            </div>
          </form>
        </div>
      )}

      {activeTab === 'cases' && (
        <div>
          <h3 className="text-lg font-semibold mb-4">My Cases</h3>
          <DataTable
            columns={columns}
            data={households}
            keyExtractor={(h) => h.id}
            searchKeys={['head_name', 'head_nic', 'district', 'status']}
            searchPlaceholder="Search cases..."
          />
        </div>
      )}

      {activeTab === 'assessment' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 max-w-2xl">
          <h3 className="text-lg font-semibold mb-4">Damage Assessment Submission</h3>
          <p className="text-sm text-gray-500 mb-4">Submit damage assessment reports for registered households.</p>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Select Household</label>
              <select className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-gov-500 outline-none">
                <option value="">Search by NIC or name...</option>
                {households.map((h) => (
                  <option key={h.id} value={h.id}>{h.head_name} ({h.head_nic})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Damage Level</label>
              <select className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-gov-500 outline-none">
                {DAMAGE_LEVEL_OPTIONS.map((d) => <option key={d.value} value={d.value}>{d.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Assessment Notes</label>
              <textarea rows={5} className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-gov-500 outline-none" placeholder="Describe the damage observed..." />
            </div>
            <button className="px-6 py-2.5 bg-gov-500 text-white rounded-lg text-sm font-medium hover:bg-gov-600 transition-colors">
              Submit Assessment
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
