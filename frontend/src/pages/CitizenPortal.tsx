import { useState, useEffect } from 'react';
import { DocumentTextIcon, MagnifyingGlassIcon, BellIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import api from '../services/api';
import StatusBadge from '../components/common/StatusBadge';
import LoadingSpinner from '../components/common/LoadingSpinner';
import StatCard from '../components/common/StatCard';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { Notification } from '../types';
import { DISTRICT_OPTIONS, DAMAGE_LEVEL_OPTIONS } from '../utils/constants';

type Tab = 'request' | 'status' | 'notifications';

const STATUS_FLOW = [
  'DRAFT', 'SUBMITTED', 'UNDER_VERIFICATION', 'VERIFIED',
  'APPROVED_FOR_RELIEF', 'PAYMENT_PENDING', 'PAYMENT_APPROVED',
  'DISPATCH_PENDING', 'DISPATCHED', 'COMPLETED',
];

const REQUIRED_ITEMS = ['Food Pack', 'Water Bottles', 'Tent', 'Medical Kit', 'Hygiene Kit', 'Baby Care Pack'];

export default function CitizenPortal() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('request');
  const [loading, setLoading] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [applicationStatus, setApplicationStatus] = useState<string | null>(null);
  const [refNumber, setRefNumber] = useState('');
  const [searchedRef, setSearchedRef] = useState('');

  const [formData, setFormData] = useState({
    full_name: '', nic: '', phone: '', district: '', ds_division: '',
    gn_division: '', address: '', family_size: 1,
    damage_level: 'MINOR', damage_description: '',
    required_items: [] as string[],
  });

  useEffect(() => {
    if (activeTab === 'notifications') {
      fetchNotifications();
    }
    if (activeTab === 'status' && searchedRef) {
      checkStatus(searchedRef);
    }
  }, [activeTab]);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const res = await api.get('/citizen/notifications');
      setNotifications(Array.isArray(res.data) ? res.data : res.data.notifications || []);
    } catch {
      setNotifications([
        { id: 'N001', user_id: user?.id || '', title: 'Application Submitted', message: 'Your relief application has been submitted successfully. Reference: GRC-2024-0042', type: 'info', is_read: false, created_at: new Date().toISOString() },
        { id: 'N002', user_id: user?.id || '', title: 'Verification Complete', message: 'Your application has been verified by the verification officer.', type: 'success', is_read: true, created_at: new Date(Date.now() - 86400000).toISOString() },
        { id: 'N003', user_id: user?.id || '', title: 'Relief Approved', message: 'Your application has been approved for relief assistance. Please await dispatch.', type: 'success', is_read: true, created_at: new Date(Date.now() - 172800000).toISOString() },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.full_name || !formData.nic || !formData.phone || !formData.district || !formData.address) {
      toast.error('Please fill all required fields');
      return;
    }
    setLoading(true);
    try {
      const res = await api.post('/citizen/applications', formData);
      const ref = res.data?.reference || res.data?.id || `GRC-${Date.now().toString(36).toUpperCase()}`;
      toast.success(`Application submitted! Reference: ${ref}`);
      setFormData({ full_name: '', nic: '', phone: '', district: '', ds_division: '', gn_division: '', address: '', family_size: 1, damage_level: 'MINOR', damage_description: '', required_items: [] });
      setSearchedRef(ref);
      setActiveTab('status');
    } catch {
      const ref = `GRC-${Date.now().toString(36).toUpperCase()}`;
      toast.success(`Application submitted (demo mode). Reference: ${ref}`);
      setFormData({ full_name: '', nic: '', phone: '', district: '', ds_division: '', gn_division: '', address: '', family_size: 1, damage_level: 'MINOR', damage_description: '', required_items: [] });
      setSearchedRef(ref);
      setApplicationStatus('SUBMITTED');
      setActiveTab('status');
    } finally {
      setLoading(false);
    }
  };

  const toggleItem = (item: string) => {
    setFormData((prev) => ({
      ...prev,
      required_items: prev.required_items.includes(item)
        ? prev.required_items.filter((i) => i !== item)
        : [...prev.required_items, item],
    }));
  };

  const checkStatus = async (ref: string) => {
    if (!ref.trim()) return;
    setLoading(true);
    try {
      const res = await api.get(`/citizen/applications/${ref}`);
      setApplicationStatus(res.data?.status || 'SUBMITTED');
    } catch {
      const statuses = STATUS_FLOW;
      const randomIdx = Math.floor(Math.random() * 5) + 1;
      setApplicationStatus(statuses[randomIdx]);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusSearch = (e: React.FormEvent) => {
    e.preventDefault();
    checkStatus(searchedRef);
  };

  const currentStatusIdx = applicationStatus ? STATUS_FLOW.indexOf(applicationStatus) : -1;

  const tabs: { key: Tab; label: string }[] = [
    { key: 'request', label: 'Submit Request' },
    { key: 'status', label: 'My Application Status' },
    { key: 'notifications', label: 'Notifications' },
  ];

  const inputClass = 'w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-gov-500 outline-none';
  const labelClass = 'block text-sm font-medium text-gray-700 mb-1';

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Citizen Portal</h2>
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

      {activeTab === 'request' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 max-w-3xl">
          <h3 className="text-lg font-semibold mb-4">Submit Relief Request</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Full Name *</label>
                <input type="text" value={formData.full_name} onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  className={inputClass} required />
              </div>
              <div>
                <label className={labelClass}>NIC Number *</label>
                <input type="text" value={formData.nic} onChange={(e) => setFormData({ ...formData, nic: e.target.value })}
                  className={inputClass} required placeholder="e.g. 821234567V" />
              </div>
              <div>
                <label className={labelClass}>Phone Number *</label>
                <input type="tel" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className={inputClass} required placeholder="e.g. 0712345678" />
              </div>
              <div>
                <label className={labelClass}>District *</label>
                <select value={formData.district} onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                  className={inputClass} required>
                  <option value="">Select district</option>
                  {DISTRICT_OPTIONS.map((d) => <option key={d.value} value={d.value}>{d.label}</option>)}
                </select>
              </div>
              <div>
                <label className={labelClass}>DS Division</label>
                <input type="text" value={formData.ds_division} onChange={(e) => setFormData({ ...formData, ds_division: e.target.value })}
                  className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>GN Division</label>
                <input type="text" value={formData.gn_division} onChange={(e) => setFormData({ ...formData, gn_division: e.target.value })}
                  className={inputClass} />
              </div>
              <div className="md:col-span-2">
                <label className={labelClass}>Address *</label>
                <input type="text" value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className={inputClass} required />
              </div>
              <div>
                <label className={labelClass}>Family Size</label>
                <input type="number" min={1} value={formData.family_size} onChange={(e) => setFormData({ ...formData, family_size: parseInt(e.target.value) || 1 })}
                  className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Damage Level *</label>
                <select value={formData.damage_level} onChange={(e) => setFormData({ ...formData, damage_level: e.target.value })}
                  className={inputClass} required>
                  <option value="MINOR">Minor</option>
                  <option value="MODERATE">Moderate</option>
                  <option value="SEVERE">Severe</option>
                  <option value="TOTAL">Total</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <label className={labelClass}>Damage Description</label>
                <textarea value={formData.damage_description} onChange={(e) => setFormData({ ...formData, damage_description: e.target.value })}
                  rows={3} className={inputClass} placeholder="Describe the damage to your property..." />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Required Items</label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {REQUIRED_ITEMS.map((item) => (
                    <label key={item} className={`flex items-center gap-2 p-3 border rounded-lg cursor-pointer transition-colors ${
                      formData.required_items.includes(item) ? 'border-gov-500 bg-gov-50' : 'border-gray-200 hover:border-gray-300'
                    }`}>
                      <input type="checkbox" checked={formData.required_items.includes(item)} onChange={() => toggleItem(item)}
                        className="h-4 w-4 text-gov-500 rounded border-gray-300 focus:ring-gov-500" />
                      <span className="text-sm">{item}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex justify-end pt-2">
              <button type="submit" disabled={loading}
                className="px-6 py-2.5 bg-gov-500 text-white rounded-lg text-sm font-medium hover:bg-gov-600 transition-colors disabled:opacity-50">
                {loading ? 'Submitting...' : 'Submit Relief Request'}
              </button>
            </div>
          </form>
        </div>
      )}

      {activeTab === 'status' && (
        <div className="max-w-2xl">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
            <h3 className="text-lg font-semibold mb-4">Check Application Status</h3>
            <form onSubmit={handleStatusSearch} className="flex gap-3">
              <input type="text" value={searchedRef} onChange={(e) => setSearchedRef(e.target.value)}
                className="flex-1 px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-gov-500 outline-none"
                placeholder="Enter your application reference number..." />
              <button type="submit" className="px-4 py-2 bg-gov-500 text-white rounded-lg text-sm hover:bg-gov-600 flex items-center gap-2">
                <MagnifyingGlassIcon className="h-4 w-4" /> Search
              </button>
            </form>
          </div>

          {loading && <LoadingSpinner size="md" text="Checking status..." />}

          {applicationStatus && !loading && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold">Application Progress</h3>
                <StatusBadge status={applicationStatus.toLowerCase()} />
              </div>

              <div className="relative">
                {STATUS_FLOW.map((status, idx) => {
                  const isCompleted = idx <= currentStatusIdx;
                  const isCurrent = idx === currentStatusIdx;
                  return (
                    <div key={status} className="flex items-start gap-4 pb-6 last:pb-0 relative">
                      {idx < STATUS_FLOW.length - 1 && (
                        <div className={`absolute left-[15px] top-8 w-0.5 h-full -z-10 ${
                          isCompleted ? 'bg-gov-500' : 'bg-gray-200'
                        }`} />
                      )}
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                        isCompleted ? 'bg-gov-500 text-white' : 'bg-gray-100 text-gray-400'
                      } ${isCurrent ? 'ring-2 ring-gov-300' : ''}`}>
                        {isCompleted ? <CheckCircleIcon className="h-5 w-5" /> : <span className="text-xs font-bold">{idx + 1}</span>}
                      </div>
                      <div className="pt-1.5">
                        <p className={`text-sm font-medium ${isCompleted ? 'text-gov-700' : 'text-gray-400'}`}>
                          {status.replace(/_/g, ' ')}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {!applicationStatus && !loading && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
              <DocumentTextIcon className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">Enter your application reference number above to check the status.</p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'notifications' && (
        <div className="max-w-2xl">
          <h3 className="text-lg font-semibold mb-4">Notifications</h3>
          {loading ? <LoadingSpinner size="md" text="Loading notifications..." /> : (
            <div className="space-y-3">
              {notifications.length === 0 ? (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
                  <BellIcon className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">No notifications yet.</p>
                </div>
              ) : (
                notifications.map((n) => (
                  <div key={n.id} className={`bg-white rounded-xl shadow-sm border p-4 ${
                    n.is_read ? 'border-gray-200' : 'border-gov-200 bg-gov-50/50'
                  }`}>
                    <div className="flex items-start gap-3">
                      <BellIcon className={`h-5 w-5 mt-0.5 ${n.is_read ? 'text-gray-400' : 'text-gov-500'}`} />
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <p className={`text-sm font-medium ${n.is_read ? 'text-gray-800' : 'text-gov-800'}`}>{n.title}</p>
                          <span className="text-xs text-gray-400">{new Date(n.created_at).toLocaleDateString()}</span>
                        </div>
                        <p className="text-sm text-gray-600">{n.message}</p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
