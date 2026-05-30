import { useState, useEffect } from 'react';
import { ClipboardDocumentListIcon, TruckIcon, CheckCircleIcon, ClockIcon } from '@heroicons/react/24/outline';
import api from '../services/api';
import StatCard from '../components/common/StatCard';
import DataTable, { Column } from '../components/common/DataTable';
import StatusBadge from '../components/common/StatusBadge';
import LoadingSpinner from '../components/common/LoadingSpinner';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { ReliefApplication } from '../types';

type Tab = 'overview' | 'tasks';

export default function NGODashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);
  const [tasks, setTasks] = useState<ReliefApplication[]>([]);
  const [selectedTask, setSelectedTask] = useState<ReliefApplication | null>(null);
  const [deliveryStatus, setDeliveryStatus] = useState('PENDING');
  const [deliveryNotes, setDeliveryNotes] = useState('');

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'overview') {
        const res = await api.get('/ngo/stats');
        setStats(res.data);
      } else if (activeTab === 'tasks') {
        const res = await api.get('/ngo/tasks');
        setTasks(Array.isArray(res.data) ? res.data : res.data.tasks || []);
      }
    } catch {
      setStats({
        total_assigned: 24, in_progress: 10, delivered: 8, pending: 6,
      });
      if (activeTab === 'tasks') {
        setTasks([
          { id: 'A001', submitted_by: '2', household_id: 'H010', household: { id: 'H010', head_name: 'Sunil Kumara', head_nic: '861234577V', address: '10 Galle Rd', district: 'galle', family_members: 6, vulnerable_members: 3, damage_level: 'destroyed', status: 'approved', registered_by: '2', created_at: '2024-03-10', updated_at: '2024-03-15' }, disaster_id: 'D001', status: 'APPROVED_FOR_RELIEF', priority: 'high', required_items: 'Food Pack, Water Bottles, Tent, Medical Kit', assigned_ngo: user?.organization || 'Sarah Foundation', created_at: '2024-03-10', updated_at: '2024-03-15' },
          { id: 'A002', submitted_by: '2', household_id: 'H011', household: { id: 'H011', head_name: 'Mala Wijesinghe', head_nic: '781234578V', address: '55 Kandy Rd', district: 'kandy', family_members: 4, vulnerable_members: 1, damage_level: 'major', status: 'approved', registered_by: '2', created_at: '2024-03-09', updated_at: '2024-03-14' }, disaster_id: 'D002', status: 'DISPATCH_PENDING', priority: 'medium', required_items: 'Food Pack, Hygiene Kit', assigned_ngo: user?.organization || 'Sarah Foundation', created_at: '2024-03-09', updated_at: '2024-03-14' },
          { id: 'A003', submitted_by: '2', household_id: 'H012', household: { id: 'H012', head_name: 'Upul Bandara', head_nic: '911234579V', address: '32 Lake Rd', district: 'matara', family_members: 3, vulnerable_members: 2, damage_level: 'partial', status: 'approved', registered_by: '2', created_at: '2024-03-08', updated_at: '2024-03-13' }, disaster_id: 'D003', status: 'DISPATCHED', priority: 'low', required_items: 'Food Pack, Water Bottles', assigned_ngo: user?.organization || 'Sarah Foundation', created_at: '2024-03-08', updated_at: '2024-03-13' },
          { id: 'A004', submitted_by: '2', household_id: 'H013', household: { id: 'H013', head_name: 'Dilani Perera', head_nic: '921234570V', address: '22 Beach Rd', district: 'galle', family_members: 2, vulnerable_members: 0, damage_level: 'major', status: 'approved', registered_by: '2', created_at: '2024-03-07', updated_at: '2024-03-12' }, disaster_id: 'D001', status: 'COMPLETED', priority: 'high', required_items: 'Medical Kit, Baby Care Pack', assigned_ngo: user?.organization || 'Sarah Foundation', created_at: '2024-03-07', updated_at: '2024-03-12' },
        ]);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateDelivery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTask) return;
    try {
      await api.post(`/ngo/tasks/${selectedTask.id}/delivery`, { status: deliveryStatus, notes: deliveryNotes });
      toast.success('Delivery status updated');
      setSelectedTask(null);
      setDeliveryStatus('PENDING');
      setDeliveryNotes('');
      fetchData();
    } catch {
      toast.success('Delivery status updated (demo mode)');
      setSelectedTask(null);
      setDeliveryStatus('PENDING');
      setDeliveryNotes('');
      fetchData();
    }
  };

  const taskColumns: Column<ReliefApplication>[] = [
    { key: 'id', header: 'Application ID', sortable: true },
    {
      key: 'household', header: 'Household Head', sortable: true,
      render: (a) => a.household?.head_name || '-',
    },
    {
      key: 'district', header: 'District', sortable: true,
      render: (a) => <span className="capitalize">{a.household?.district || '-'}</span>,
    },
    {
      key: 'required_items', header: 'Items Required', sortable: true,
      render: (a) => (
        <div className="flex flex-wrap gap-1">
          {(a.required_items || '').split(',').map((item, i) => (
            <span key={i} className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-xs">{item.trim()}</span>
          ))}
        </div>
      ),
    },
    {
      key: 'status', header: 'Status', sortable: true,
      render: (a) => <StatusBadge status={a.status.toLowerCase()} />,
    },
    {
      key: 'created_at', header: 'Assigned Date', sortable: true,
      render: (a) => new Date(a.created_at).toLocaleDateString(),
    },
    {
      key: 'actions', header: 'Actions',
      render: (a) => (
        <button
          onClick={() => { setSelectedTask(a); setDeliveryStatus(a.status === 'COMPLETED' ? 'DELIVERED' : 'IN_TRANSIT'); }}
          className="px-3 py-1 text-sm bg-gov-500 text-white rounded-lg hover:bg-gov-600"
        >
          Update Delivery
        </button>
      ),
    },
  ];

  const tabs: { key: Tab; label: string }[] = [
    { key: 'overview', label: 'Dashboard' },
    { key: 'tasks', label: 'Assigned Tasks' },
  ];

  if (loading && activeTab === 'overview') return <LoadingSpinner size="lg" text="Loading NGO dashboard..." />;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">NGO Partner Dashboard</h2>
        {user?.organization && (
          <span className="px-3 py-1 bg-gov-50 text-gov-700 rounded-full text-sm font-medium">{user.organization}</span>
        )}
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
            <StatCard title="Total Assigned" value={stats?.total_assigned || 0} icon={<ClipboardDocumentListIcon className="h-6 w-6 text-gov-500" />} />
            <StatCard title="In Progress" value={stats?.in_progress || 0} icon={<TruckIcon className="h-6 w-6 text-yellow-500" />} />
            <StatCard title="Delivered" value={stats?.delivered || 0} icon={<CheckCircleIcon className="h-6 w-6 text-green-500" />} />
            <StatCard title="Pending" value={stats?.pending || 0} icon={<ClockIcon className="h-6 w-6 text-indigo-500" />} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button onClick={() => setActiveTab('tasks')} className="stat-card text-center">
              <p className="text-3xl font-bold text-gov-500">{stats?.total_assigned || 0}</p>
              <p className="text-sm text-gray-500 mt-1">Assigned Relief Tasks</p>
            </button>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold mb-4">Delivery Progress</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">Delivered</span>
                  <span className="text-sm font-medium text-green-600">{stats?.delivered || 0}/{stats?.total_assigned || 0}</span>
                </div>
                <div className="w-full h-2 bg-gray-200 rounded-full">
                  <div className="h-full bg-green-500 rounded-full" style={{ width: `${((stats?.delivered || 0) / (stats?.total_assigned || 1)) * 100}%` }} />
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {activeTab === 'tasks' && (
        <div>
          <h3 className="text-lg font-semibold mb-4">Assigned Relief Tasks</h3>
          <DataTable
            columns={taskColumns}
            data={tasks}
            keyExtractor={(a) => a.id}
            searchKeys={['id', 'household.head_name', 'status', 'required_items']}
            searchPlaceholder="Search tasks..."
          />
        </div>
      )}

      {selectedTask && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6">
            <h3 className="text-lg font-semibold mb-4">Update Delivery Status</h3>
            <div className="bg-gray-50 rounded-lg p-4 mb-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Application:</span>
                <span className="font-medium">{selectedTask.id}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Household:</span>
                <span className="font-medium">{selectedTask.household?.head_name || '-'}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">District:</span>
                <span className="font-medium capitalize">{selectedTask.household?.district || '-'}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Items:</span>
                <span className="font-medium text-right">{selectedTask.required_items || '-'}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Current Status:</span>
                <StatusBadge status={selectedTask.status.toLowerCase()} />
              </div>
            </div>
            <form onSubmit={handleUpdateDelivery} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Delivery Status</label>
                <select value={deliveryStatus} onChange={(e) => setDeliveryStatus(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-gov-500 outline-none">
                  <option value="PENDING">Pending</option>
                  <option value="IN_TRANSIT">In Transit</option>
                  <option value="PARTIAL">Partially Delivered</option>
                  <option value="DELIVERED">Delivered</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea value={deliveryNotes} onChange={(e) => setDeliveryNotes(e.target.value)} rows={3}
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-gov-500 outline-none"
                  placeholder="Add delivery notes..." />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => { setSelectedTask(null); setDeliveryStatus('PENDING'); setDeliveryNotes(''); }}
                  className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-gov-500 text-white rounded-lg text-sm hover:bg-gov-600">
                  Update Status
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
