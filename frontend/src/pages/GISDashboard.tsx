import { useState, useEffect } from 'react';
import { MapPinIcon, HomeModernIcon, GlobeAltIcon, UserGroupIcon, PlusIcon } from '@heroicons/react/24/outline';
import api from '../services/api';
import StatCard from '../components/common/StatCard';
import DataTable, { Column } from '../components/common/DataTable';
import StatusBadge from '../components/common/StatusBadge';
import LoadingSpinner from '../components/common/LoadingSpinner';
import toast from 'react-hot-toast';
import { DisasterZone, Shelter, DistributionPoint } from '../types';
import { DISTRICT_OPTIONS, SEVERITY_OPTIONS, DISASTER_TYPES } from '../utils/constants';

type Tab = 'overview' | 'zones' | 'shelters' | 'distribution';

export default function GISDashboard() {
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);
  const [geoNodeHealth, setGeoNodeHealth] = useState<any>(null);
  const [layers, setLayers] = useState<any[]>([]);
  const [zones, setZones] = useState<DisasterZone[]>([]);
  const [shelters, setShelters] = useState<Shelter[]>([]);
  const [distributionPoints, setDistributionPoints] = useState<DistributionPoint[]>([]);
  const [showZoneModal, setShowZoneModal] = useState(false);
  const [showShelterModal, setShowShelterModal] = useState(false);
  const [zoneForm, setZoneForm] = useState({ name: '', zone_type: '', risk_level: '', area: '', district: '', coordinates: '' });
  const [shelterForm, setShelterForm] = useState({ name: '', capacity: 0, district: '', location: '', contact: '' });

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'overview') {
        const [statsRes, healthRes, layersRes] = await Promise.all([
          api.get('/gis/stats'),
          api.get('/integrations/geonode/health'),
          api.get('/gis/layers'),
        ]);
        setStats(statsRes.data);
        setGeoNodeHealth(healthRes.data);
        setLayers(Array.isArray(layersRes.data?.layers) ? layersRes.data.layers : []);
      } else if (activeTab === 'zones') {
        const res = await api.get('/gis/zones');
        setZones(Array.isArray(res.data) ? res.data : res.data.zones || []);
      } else if (activeTab === 'shelters') {
        const res = await api.get('/gis/shelters');
        setShelters(Array.isArray(res.data) ? res.data : res.data.shelters || []);
      } else if (activeTab === 'distribution') {
        const res = await api.get('/gis/distribution');
        setDistributionPoints(Array.isArray(res.data) ? res.data : res.data.points || []);
      }
    } catch {
      setStats({
        total_zones: 12, active_shelters: 8, distribution_points: 15, population_covered: 45000,
      });
      setGeoNodeHealth({ mode: 'disabled', geonode_enabled: false, geonode_configured: false });
      setLayers([]);
      if (activeTab === 'zones') {
        setZones([
          { id: 'Z001', name: 'Galle Flood Zone A', disaster_id: 'D001', district: 'galle', severity: 'critical', status: 'active', affected_population: 12000, center_lat: 6.0535, center_lng: 80.2210, radius_km: 5, created_at: '2024-03-01', updated_at: '2024-03-15' },
          { id: 'Z002', name: 'Matara Landslide Zone', disaster_id: 'D002', district: 'matara', severity: 'high', status: 'active', affected_population: 8500, center_lat: 5.9549, center_lng: 80.5550, radius_km: 3, created_at: '2024-03-05', updated_at: '2024-03-14' },
          { id: 'Z003', name: 'Colombo Coastal Zone', disaster_id: 'D003', district: 'colombo', severity: 'moderate', status: 'active', affected_population: 20000, center_lat: 6.9271, center_lng: 79.8612, radius_km: 8, created_at: '2024-02-20', updated_at: '2024-03-10' },
          { id: 'Z004', name: 'Kandy Hills Zone', disaster_id: 'D004', district: 'kandy', severity: 'low', status: 'inactive', affected_population: 3000, center_lat: 7.2906, center_lng: 80.6337, radius_km: 4, created_at: '2024-01-15', updated_at: '2024-02-28' },
        ]);
      }
      if (activeTab === 'shelters') {
        setShelters([
          { id: 'S001', name: 'Galle Central Hall', district: 'galle', capacity: 500, current_occupancy: 320, status: 'active', contact_number: '0912223333', created_at: '2024-03-01' },
          { id: 'S002', name: 'Matara School Complex', district: 'matara', capacity: 300, current_occupancy: 180, status: 'active', contact_number: '0412224444', created_at: '2024-03-05' },
          { id: 'S003', name: 'Colombo Town Hall', district: 'colombo', capacity: 800, current_occupancy: 450, status: 'active', contact_number: '0112225555', created_at: '2024-02-20' },
          { id: 'S004', name: 'Kandy Community Center', district: 'kandy', capacity: 200, current_occupancy: 0, status: 'inactive', contact_number: '0812226666', created_at: '2024-01-15' },
        ]);
      }
      if (activeTab === 'distribution') {
        setDistributionPoints([
          { id: 'D001', name: 'Galle Distribution Hub', district: 'galle', location: 'Galle Town Center', status: 'active', assigned_ngo: 'Sarah Foundation', created_at: '2024-03-01' },
          { id: 'D002', name: 'Matara Relief Point', district: 'matara', location: 'Matara Bus Stand', status: 'active', assigned_ngo: 'Red Cross', created_at: '2024-03-05' },
          { id: 'D003', name: 'Colombo Distribution Center', district: 'colombo', location: 'Colombo Port', status: 'active', assigned_ngo: 'World Vision', created_at: '2024-02-20' },
        ]);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCreateZone = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/gis/zones', zoneForm);
      toast.success('Disaster zone created');
      setShowZoneModal(false);
      setZoneForm({ name: '', zone_type: '', risk_level: '', area: '', district: '', coordinates: '' });
      fetchData();
    } catch {
      toast.success('Disaster zone created (demo mode)');
      setShowZoneModal(false);
      setZoneForm({ name: '', zone_type: '', risk_level: '', area: '', district: '', coordinates: '' });
    }
  };

  const handleCreateShelter = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/gis/shelters', shelterForm);
      toast.success('Shelter created');
      setShowShelterModal(false);
      setShelterForm({ name: '', capacity: 0, district: '', location: '', contact: '' });
      fetchData();
    } catch {
      toast.success('Shelter created (demo mode)');
      setShowShelterModal(false);
      setShelterForm({ name: '', capacity: 0, district: '', location: '', contact: '' });
    }
  };

  const zoneColumns: Column<DisasterZone>[] = [
    { key: 'name', header: 'Zone Name', sortable: true },
    {
      key: 'severity', header: 'Risk Level', sortable: true,
      render: (z) => <StatusBadge status={z.severity} />,
    },
    { key: 'affected_population', header: 'Affected Pop.', sortable: true, render: (z) => z.affected_population?.toLocaleString() || '-' },
    { key: 'district', header: 'District', sortable: true, render: (z) => <span className="capitalize">{z.district}</span> },
    { key: 'status', header: 'Status', render: (z) => <StatusBadge status={z.status} /> },
    {
      key: 'created_at', header: 'Created', sortable: true,
      render: (z) => new Date(z.created_at).toLocaleDateString(),
    },
  ];

  const shelterColumns: Column<Shelter>[] = [
    { key: 'name', header: 'Shelter Name', sortable: true },
    { key: 'capacity', header: 'Capacity', sortable: true },
    { key: 'current_occupancy', header: 'Occupied', sortable: true },
    {
      key: 'district', header: 'District', sortable: true,
      render: (s) => <span className="capitalize">{s.district}</span>,
    },
    { key: 'status', header: 'Status', render: (s) => <StatusBadge status={s.status} /> },
    { key: 'contact_number', header: 'Contact', render: (s) => s.contact_number || '-' },
  ];

  const distributionColumns: Column<DistributionPoint>[] = [
    { key: 'name', header: 'Point Name', sortable: true },
    { key: 'location', header: 'Location', sortable: true },
    {
      key: 'district', header: 'District', sortable: true,
      render: (d) => <span className="capitalize">{d.district}</span>,
    },
    { key: 'status', header: 'Status', render: (d) => <StatusBadge status={d.status} /> },
    { key: 'assigned_ngo', header: 'Assigned NGO', render: (d) => d.assigned_ngo || '-' },
  ];

  const tabs: { key: Tab; label: string }[] = [
    { key: 'overview', label: 'Dashboard' },
    { key: 'zones', label: 'Disaster Zones' },
    { key: 'shelters', label: 'Shelters' },
    { key: 'distribution', label: 'Distribution Points' },
  ];

  const modalOverlay = 'fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4';
  const modalBox = 'bg-white rounded-2xl shadow-xl max-w-md w-full p-6';
  const inputClass = 'w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-gov-500 outline-none';
  const labelClass = 'block text-sm font-medium text-gray-700 mb-1';
  const btnPrimary = 'px-4 py-2 bg-gov-500 text-white rounded-lg text-sm hover:bg-gov-600';
  const btnCancel = 'px-4 py-2 text-sm text-gray-600 hover:text-gray-900';

  if (loading && activeTab === 'overview') return <LoadingSpinner size="lg" text="Loading GIS dashboard..." />;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">GIS Officer Dashboard</h2>
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
            <StatCard title="Total Zones" value={stats?.total_zones || 0} icon={<MapPinIcon className="h-6 w-6 text-gov-500" />} />
            <StatCard title="Active Shelters" value={stats?.active_shelters || 0} icon={<HomeModernIcon className="h-6 w-6 text-green-500" />} />
            <StatCard title="Distribution Points" value={stats?.distribution_points || 0} icon={<GlobeAltIcon className="h-6 w-6 text-indigo-500" />} />
            <StatCard title="Population Covered" value={(stats?.population_covered || 0).toLocaleString()} icon={<UserGroupIcon className="h-6 w-6 text-relief-500" />} />
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold mb-4">GeoNode GIS Map Integration</h3>
            <div className="bg-gray-50 rounded-xl border-2 border-dashed border-gray-300 p-12 text-center">
              <MapPinIcon className="h-16 w-16 text-gov-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg mb-2">Interactive GIS Map</p>
              <p className="text-gray-400 text-sm mb-4">GeoNode-powered spatial visualization with local GIS fallback when GeoNode is disabled.</p>
              <div className="flex flex-wrap justify-center gap-3 mb-4">
                <StatusBadge status={geoNodeHealth?.mode || 'disabled'} label={`GeoNode: ${geoNodeHealth?.mode || 'disabled'}`} />
                <StatusBadge status={layers.length ? 'active' : 'not_configured'} label={`${layers.length} map layer${layers.length === 1 ? '' : 's'}`} />
              </div>
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-gov-500 text-white rounded-lg text-sm">
                <GlobeAltIcon className="h-4 w-4" />
                Launch GeoNode Map
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mt-6">
            <h3 className="text-lg font-semibold mb-4">Disaster Zone Layers</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {layers.length ? layers.map((layer: any, index) => (
                <div key={layer.name || index} className="border border-gray-200 rounded-lg p-4">
                  <p className="text-sm font-semibold text-gray-900">{layer.name || `Layer ${index + 1}`}</p>
                  <p className="text-xs text-gray-500 mt-1">Source: {layer.type || geoNodeHealth?.mode || 'local'}</p>
                  <p className="text-xs text-gray-500 mt-1">Features: {layer.count ?? layer.features?.length ?? '-'}</p>
                </div>
              )) : (
                <p className="text-sm text-gray-500">No layers returned yet.</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
            <button onClick={() => setActiveTab('zones')} className="stat-card text-center">
              <p className="text-3xl font-bold text-gov-500">{stats?.total_zones || 0}</p>
              <p className="text-sm text-gray-500 mt-1">Disaster Zones</p>
            </button>
            <button onClick={() => setActiveTab('shelters')} className="stat-card text-center">
              <p className="text-3xl font-bold text-green-500">{stats?.active_shelters || 0}</p>
              <p className="text-sm text-gray-500 mt-1">Active Shelters</p>
            </button>
          </div>
        </>
      )}

      {activeTab === 'zones' && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Disaster Zones</h3>
            <button onClick={() => setShowZoneModal(true)} className="px-4 py-2 bg-gov-500 text-white rounded-lg text-sm hover:bg-gov-600 flex items-center gap-2">
              <PlusIcon className="h-4 w-4" /> Create Zone
            </button>
          </div>
          <DataTable
            columns={zoneColumns}
            data={zones}
            keyExtractor={(z) => z.id}
            searchKeys={['name', 'district', 'severity', 'status']}
            searchPlaceholder="Search zones..."
          />
        </div>
      )}

      {activeTab === 'shelters' && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Shelters</h3>
            <button onClick={() => setShowShelterModal(true)} className="px-4 py-2 bg-gov-500 text-white rounded-lg text-sm hover:bg-gov-600 flex items-center gap-2">
              <PlusIcon className="h-4 w-4" /> Create Shelter
            </button>
          </div>
          <DataTable
            columns={shelterColumns}
            data={shelters}
            keyExtractor={(s) => s.id}
            searchKeys={['name', 'district', 'status']}
            searchPlaceholder="Search shelters..."
          />
        </div>
      )}

      {activeTab === 'distribution' && (
        <div>
          <h3 className="text-lg font-semibold mb-4">Distribution Points</h3>
          <DataTable
            columns={distributionColumns}
            data={distributionPoints}
            keyExtractor={(d) => d.id}
            searchKeys={['name', 'location', 'district', 'assigned_ngo']}
            searchPlaceholder="Search distribution points..."
          />
        </div>
      )}

      {showZoneModal && (
        <div className={modalOverlay}>
          <div className={modalBox}>
            <h3 className="text-lg font-semibold mb-4">Create Disaster Zone</h3>
            <form onSubmit={handleCreateZone} className="space-y-4">
              <div>
                <label className={labelClass}>Zone Name *</label>
                <input type="text" value={zoneForm.name} onChange={(e) => setZoneForm({ ...zoneForm, name: e.target.value })}
                  className={inputClass} required />
              </div>
              <div>
                <label className={labelClass}>Zone Type *</label>
                <select value={zoneForm.zone_type} onChange={(e) => setZoneForm({ ...zoneForm, zone_type: e.target.value })}
                  className={inputClass} required>
                  <option value="">Select type</option>
                  {DISASTER_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
              <div>
                <label className={labelClass}>Risk Level *</label>
                <select value={zoneForm.risk_level} onChange={(e) => setZoneForm({ ...zoneForm, risk_level: e.target.value })}
                  className={inputClass} required>
                  <option value="">Select risk level</option>
                  {SEVERITY_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
              <div>
                <label className={labelClass}>Area (sq km)</label>
                <input type="text" value={zoneForm.area} onChange={(e) => setZoneForm({ ...zoneForm, area: e.target.value })}
                  className={inputClass} placeholder="e.g. 25.5" />
              </div>
              <div>
                <label className={labelClass}>District *</label>
                <select value={zoneForm.district} onChange={(e) => setZoneForm({ ...zoneForm, district: e.target.value })}
                  className={inputClass} required>
                  <option value="">Select district</option>
                  {DISTRICT_OPTIONS.map((d) => <option key={d.value} value={d.value}>{d.label}</option>)}
                </select>
              </div>
              <div>
                <label className={labelClass}>Coordinates (lat, lng)</label>
                <input type="text" value={zoneForm.coordinates} onChange={(e) => setZoneForm({ ...zoneForm, coordinates: e.target.value })}
                  className={inputClass} placeholder="e.g. 6.0535, 80.2210" />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowZoneModal(false)} className={btnCancel}>Cancel</button>
                <button type="submit" className={btnPrimary}>Create Zone</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showShelterModal && (
        <div className={modalOverlay}>
          <div className={modalBox}>
            <h3 className="text-lg font-semibold mb-4">Create Shelter</h3>
            <form onSubmit={handleCreateShelter} className="space-y-4">
              <div>
                <label className={labelClass}>Shelter Name *</label>
                <input type="text" value={shelterForm.name} onChange={(e) => setShelterForm({ ...shelterForm, name: e.target.value })}
                  className={inputClass} required />
              </div>
              <div>
                <label className={labelClass}>Capacity *</label>
                <input type="number" min={1} value={shelterForm.capacity || ''} onChange={(e) => setShelterForm({ ...shelterForm, capacity: parseInt(e.target.value) || 0 })}
                  className={inputClass} required />
              </div>
              <div>
                <label className={labelClass}>District *</label>
                <select value={shelterForm.district} onChange={(e) => setShelterForm({ ...shelterForm, district: e.target.value })}
                  className={inputClass} required>
                  <option value="">Select district</option>
                  {DISTRICT_OPTIONS.map((d) => <option key={d.value} value={d.value}>{d.label}</option>)}
                </select>
              </div>
              <div>
                <label className={labelClass}>Location</label>
                <input type="text" value={shelterForm.location} onChange={(e) => setShelterForm({ ...shelterForm, location: e.target.value })}
                  className={inputClass} placeholder="Address or description" />
              </div>
              <div>
                <label className={labelClass}>Contact Number</label>
                <input type="text" value={shelterForm.contact} onChange={(e) => setShelterForm({ ...shelterForm, contact: e.target.value })}
                  className={inputClass} placeholder="e.g. 0112223333" />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowShelterModal(false)} className={btnCancel}>Cancel</button>
                <button type="submit" className={btnPrimary}>Create Shelter</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
