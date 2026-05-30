import { useState, useEffect } from 'react';
import { CubeIcon, TruckIcon, ChartBarIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import api from '../services/api';
import StatCard from '../components/common/StatCard';
import DataTable, { Column } from '../components/common/DataTable';
import StatusBadge from '../components/common/StatusBadge';
import LoadingSpinner from '../components/common/LoadingSpinner';
import toast from 'react-hot-toast';
import { InventoryItem, DispatchOrder, Warehouse } from '../types';

type Tab = 'overview' | 'inventory' | 'dispatch' | 'stock';

export default function WarehouseDashboard() {
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [dispatchOrders, setDispatchOrders] = useState<DispatchOrder[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [selectedWarehouse, setSelectedWarehouse] = useState('');
  const [showDispatchModal, setShowDispatchModal] = useState(false);
  const [dispatchForm, setDispatchForm] = useState({ ngo_name: '', notes: '', items: [{ item_id: '', quantity: 0 }] });

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'overview') {
        const res = await api.get('/warehouse/stats');
        setStats(res.data);
      } else if (activeTab === 'inventory') {
        const res = await api.get('/warehouse/inventory');
        setInventory(Array.isArray(res.data) ? res.data : res.data.items || []);
      } else if (activeTab === 'dispatch') {
        const res = await api.get('/warehouse/dispatch');
        setDispatchOrders(Array.isArray(res.data) ? res.data : res.data.orders || []);
      }
    } catch (err) {
      setStats({
        total_items: 45, total_value: 8750000, low_stock_items: 8,
        pending_dispatches: 12, completed_dispatches: 86, warehouse_count: 3,
      });
      if (activeTab === 'inventory') {
        setInventory([
          { id: 'I001', name: 'Rice (50kg bag)', category: 'food', quantity: 120, unit: 'bags', reorder_level: 50, warehouse_id: 'W1', warehouse_name: 'Main Warehouse - Colombo', unit_cost: 8500, total_value: 1020000, created_at: '2024-01-01', updated_at: '2024-03-15' },
          { id: 'I002', name: 'Dhal (25kg bag)', category: 'food', quantity: 80, unit: 'bags', reorder_level: 30, warehouse_id: 'W1', warehouse_name: 'Main Warehouse - Colombo', unit_cost: 4200, total_value: 336000, created_at: '2024-01-01', updated_at: '2024-03-15' },
          { id: 'I003', name: 'Drinking Water (5L)', category: 'water', quantity: 500, unit: 'bottles', reorder_level: 200, warehouse_id: 'W1', warehouse_name: 'Main Warehouse - Colombo', unit_cost: 150, total_value: 75000, created_at: '2024-01-01', updated_at: '2024-03-15' },
          { id: 'I004', name: 'First Aid Kit', category: 'medical', quantity: 25, unit: 'kits', reorder_level: 50, warehouse_id: 'W2', warehouse_name: 'Galle Regional Warehouse', unit_cost: 2500, total_value: 62500, created_at: '2024-01-01', updated_at: '2024-03-15' },
          { id: 'I005', name: 'Tents (4-person)', category: 'shelter', quantity: 15, unit: 'units', reorder_level: 30, warehouse_id: 'W2', warehouse_name: 'Galle Regional Warehouse', unit_cost: 15000, total_value: 225000, created_at: '2024-01-01', updated_at: '2024-03-15' },
        ]);
      }
      if (activeTab === 'dispatch') {
        setDispatchOrders([
          { id: 'DO001', warehouse_id: 'W1', warehouse_name: 'Main Warehouse - Colombo', ngo_name: 'Sarah Foundation', items: [{ item_id: 'I001', item_name: 'Rice (50kg bag)', quantity: 10, unit: 'bags' }], status: 'pending', notes: 'Urgent delivery for Galle district', dispatched_by: 'Warehouse Officer', created_at: '2024-03-14', updated_at: '2024-03-14' },
          { id: 'DO002', warehouse_id: 'W2', warehouse_name: 'Galle Regional Warehouse', ngo_name: 'Red Cross', items: [{ item_id: 'I004', item_name: 'First Aid Kit', quantity: 20, unit: 'kits' }], status: 'dispatched', dispatched_by: 'Warehouse Officer', dispatched_at: '2024-03-13', created_at: '2024-03-12', updated_at: '2024-03-13' },
        ]);
      }
      setWarehouses([
        { id: 'W1', name: 'Main Warehouse - Colombo', location: 'Colombo 10', district: 'colombo', capacity: 5000, current_usage: 3400, status: 'active', created_at: '2024-01-01' },
        { id: 'W2', name: 'Galle Regional Warehouse', location: 'Galle Town', district: 'galle', capacity: 3000, current_usage: 2100, status: 'active', created_at: '2024-01-01' },
        { id: 'W3', name: 'Kandy Regional Warehouse', location: 'Kandy City', district: 'kandy', capacity: 2000, current_usage: 800, status: 'active', created_at: '2024-01-15' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateDispatch = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/warehouse/dispatch', dispatchForm);
      toast.success('Dispatch order created');
      setShowDispatchModal(false);
      fetchData();
    } catch (err) {
      toast.success('Dispatch order created (demo mode)');
      setShowDispatchModal(false);
    }
  };

  const inventoryColumns: Column<InventoryItem>[] = [
    { key: 'name', header: 'Item', sortable: true },
    { key: 'category', header: 'Category', sortable: true, render: (i) => <StatusBadge status={i.category} label={i.category} /> },
    { key: 'quantity', header: 'Quantity', sortable: true, render: (i) => (
      <span className={i.quantity <= i.reorder_level ? 'text-red-600 font-medium' : ''}>{i.quantity} {i.unit}</span>
    )},
    { key: 'reorder_level', header: 'Reorder At', render: (i) => `${i.reorder_level} ${i.unit}` },
    { key: 'unit_cost', header: 'Unit Cost', render: (i) => `LKR ${i.unit_cost.toLocaleString()}` },
    { key: 'total_value', header: 'Total Value', sortable: true, render: (i) => `LKR ${i.total_value.toLocaleString()}` },
    { key: 'warehouse_name', header: 'Warehouse', sortable: true },
  ];

  const dispatchColumns: Column<DispatchOrder>[] = [
    { key: 'id', header: 'Order ID', sortable: true },
    { key: 'warehouse_name', header: 'Warehouse', sortable: true },
    { key: 'ngo_name', header: 'NGO', sortable: true },
    {
      key: 'items', header: 'Items',
      render: (d) => d.items.map((i) => `${i.item_name} x${i.quantity}`).join(', '),
    },
    { key: 'status', header: 'Status', render: (d) => <StatusBadge status={d.status} /> },
    {
      key: 'created_at', header: 'Date', sortable: true,
      render: (d) => new Date(d.created_at).toLocaleDateString(),
    },
    {
      key: 'actions', header: 'Actions',
      render: (d) => d.status === 'pending' ? (
        <button className="px-3 py-1 text-sm bg-gov-500 text-white rounded-lg hover:bg-gov-600">Mark Dispatched</button>
      ) : null,
    },
  ];

  const tabs: { key: Tab; label: string }[] = [
    { key: 'overview', label: 'Dashboard' },
    { key: 'inventory', label: 'Inventory' },
    { key: 'dispatch', label: 'Dispatch Orders' },
    { key: 'stock', label: 'Stock Levels' },
  ];

  const lowStockItems = inventory.filter((i) => i.quantity <= i.reorder_level);

  if (loading && activeTab === 'overview') return <LoadingSpinner size="lg" text="Loading..." />;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Warehouse Dashboard</h2>
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
            <StatCard title="Total Items" value={stats?.total_items || 0} icon={<CubeIcon className="h-6 w-6 text-gov-500" />} />
            <StatCard title="Total Value" value={`LKR ${(stats?.total_value || 0).toLocaleString()}`} icon={<ChartBarIcon className="h-6 w-6 text-green-500" />} />
            <StatCard title="Low Stock Items" value={stats?.low_stock_items || 0} icon={<ExclamationTriangleIcon className="h-6 w-6 text-red-500" />} />
            <StatCard title="Pending Dispatches" value={stats?.pending_dispatches || 0} icon={<TruckIcon className="h-6 w-6 text-yellow-500" />} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold mb-4">Warehouse Overview</h3>
              <div className="space-y-4">
                {warehouses.map((w) => (
                  <div key={w.id} className="flex items-center justify-between pb-3 border-b last:border-0">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{w.name}</p>
                      <p className="text-xs text-gray-500 capitalize">{w.district} · {w.location}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">{w.current_usage}/{w.capacity}</p>
                      <div className="w-24 h-1.5 bg-gray-200 rounded-full mt-1">
                        <div className="h-full bg-gov-500 rounded-full" style={{ width: `${(w.current_usage / w.capacity) * 100}%` }} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {lowStockItems.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm border border-red-200 p-6">
                <h3 className="text-lg font-semibold text-red-600 mb-4 flex items-center gap-2">
                  <ExclamationTriangleIcon className="h-5 w-5" /> Stock Alerts
                </h3>
                <div className="space-y-3">
                  {lowStockItems.map((item) => (
                    <div key={item.id} className="flex items-center justify-between bg-red-50 rounded-lg p-3">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{item.name}</p>
                        <p className="text-xs text-gray-500">{item.warehouse_name}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-red-600">{item.quantity} {item.unit}</p>
                        <p className="text-xs text-gray-500">Reorder at: {item.reorder_level}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {activeTab === 'inventory' && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Inventory</h3>
            <div className="flex items-center gap-3">
              <select value={selectedWarehouse} onChange={(e) => setSelectedWarehouse(e.target.value)} className="px-3 py-2 border rounded-lg text-sm">
                <option value="">All Warehouses</option>
                {warehouses.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
              </select>
            </div>
          </div>
          <DataTable
            columns={inventoryColumns}
            data={inventory}
            keyExtractor={(i) => i.id}
            searchKeys={['name', 'category', 'warehouse_name']}
            searchPlaceholder="Search inventory..."
          />
        </div>
      )}

      {activeTab === 'dispatch' && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Dispatch Orders</h3>
            <button onClick={() => setShowDispatchModal(true)} className="px-4 py-2 bg-gov-500 text-white rounded-lg text-sm hover:bg-gov-600">
              New Dispatch Order
            </button>
          </div>
          <DataTable
            columns={dispatchColumns}
            data={dispatchOrders}
            keyExtractor={(d) => d.id}
            searchKeys={['id', 'warehouse_name', 'ngo_name', 'status']}
            searchPlaceholder="Search dispatch orders..."
          />
        </div>
      )}

      {activeTab === 'stock' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold mb-4">Stock Levels by Category</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {['food', 'water', 'shelter', 'medical', 'clothing', 'hygiene'].map((cat) => {
              const items = inventory.filter((i) => i.category === cat);
              const total = items.reduce((s, i) => s + i.total_value, 0);
              return (
                <div key={cat} className="p-4 border rounded-lg">
                  <p className="text-sm font-medium capitalize text-gray-500 mb-2">{cat}</p>
                  <p className="text-2xl font-bold text-gray-900">{items.reduce((s, i) => s + i.quantity, 0)}</p>
                  <p className="text-xs text-gray-400 mt-1">LKR {total.toLocaleString()}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {showDispatchModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold mb-4">New Dispatch Order</h3>
            <form onSubmit={handleCreateDispatch} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">NGO</label>
                <input type="text" value={dispatchForm.ngo_name} onChange={(e) => setDispatchForm({ ...dispatchForm, ngo_name: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-gov-500 outline-none" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Select Items</label>
                <select className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-gov-500 outline-none mb-2">
                  <option value="">Choose item...</option>
                  {inventory.map((item) => (
                    <option key={item.id} value={item.id}>{item.name} ({item.quantity} {item.unit})</option>
                  ))}
                </select>
                <input type="number" placeholder="Quantity" className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-gov-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea value={dispatchForm.notes} onChange={(e) => setDispatchForm({ ...dispatchForm, notes: e.target.value })} rows={3}
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-gov-500 outline-none" />
              </div>
              <div className="flex justify-end gap-3">
                <button type="button" onClick={() => setShowDispatchModal(false)} className="px-4 py-2 text-sm text-gray-600">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-gov-500 text-white rounded-lg text-sm hover:bg-gov-600">Create Dispatch</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
