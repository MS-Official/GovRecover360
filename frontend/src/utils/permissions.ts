import { Role, Permission } from '../types';

export interface MenuItem {
  label: string;
  path: string;
  icon: string;
  permissions?: Permission[];
}

export function getMenuItemsByRole(role: Role): MenuItem[] {
  const items: Record<Role, MenuItem[]> = {
    admin: [
      { label: 'Dashboard', path: '/admin', icon: 'HomeIcon' },
      { label: 'Users', path: '/admin/users', icon: 'UsersIcon' },
      { label: 'Disaster Events', path: '/admin/disasters', icon: 'ExclamationTriangleIcon' },
      { label: 'Relief Programs', path: '/admin/relief-programs', icon: 'HeartIcon' },
      { label: 'Reports', path: '/admin/reports', icon: 'DocumentChartBarIcon' },
      { label: 'Audit Logs', path: '/admin/audit-logs', icon: 'ClipboardDocumentListIcon' },
      { label: 'Integrations', path: '/admin/integrations', icon: 'ServerIcon' },
      { label: 'AI Tools', path: '/admin/ai-tools', icon: 'SparklesIcon' },
    ],
    field_officer: [
      { label: 'Dashboard', path: '/field-officer', icon: 'HomeIcon' },
      { label: 'Register Household', path: '/field-officer/register', icon: 'UserPlusIcon' },
      { label: 'My Cases', path: '/field-officer/cases', icon: 'FolderIcon' },
      { label: 'Damage Assessment', path: '/field-officer/assessment', icon: 'ClipboardDocumentCheckIcon' },
    ],
    verifier: [
      { label: 'Dashboard', path: '/verifier', icon: 'HomeIcon' },
      { label: 'Verification Queue', path: '/verifier/queue', icon: 'ClockIcon' },
      { label: 'Verified Applications', path: '/verifier/verified', icon: 'CheckBadgeIcon' },
      { label: 'Reports', path: '/verifier/reports', icon: 'DocumentChartBarIcon' },
    ],
    program_manager: [
      { label: 'Dashboard', path: '/manager', icon: 'HomeIcon' },
      { label: 'Relief Programs', path: '/manager/programs', icon: 'HeartIcon' },
      { label: 'Beneficiaries', path: '/manager/beneficiaries', icon: 'UsersIcon' },
      { label: 'Approvals', path: '/manager/approvals', icon: 'CheckBadgeIcon' },
      { label: 'NGO Assignments', path: '/manager/ngo', icon: 'BriefcaseIcon' },
    ],
    finance_officer: [
      { label: 'Dashboard', path: '/finance', icon: 'HomeIcon' },
      { label: 'Payment Approvals', path: '/finance/pending', icon: 'BanknotesIcon' },
      { label: 'Payment History', path: '/finance/history', icon: 'ClockIcon' },
    ],
    warehouse_officer: [
      { label: 'Dashboard', path: '/warehouse', icon: 'HomeIcon' },
      { label: 'Inventory', path: '/warehouse/inventory', icon: 'CubeIcon' },
      { label: 'Dispatch Orders', path: '/warehouse/dispatch', icon: 'TruckIcon' },
      { label: 'Stock Levels', path: '/warehouse/stock', icon: 'ChartBarIcon' },
    ],
    gis_officer: [
      { label: 'Dashboard', path: '/gis', icon: 'HomeIcon' },
      { label: 'Disaster Zones', path: '/gis/zones', icon: 'MapIcon' },
      { label: 'Shelters', path: '/gis/shelters', icon: 'HomeModernIcon' },
      { label: 'Distribution Points', path: '/gis/distribution', icon: 'MapPinIcon' },
    ],
    ngo_partner: [
      { label: 'Dashboard', path: '/ngo', icon: 'HomeIcon' },
      { label: 'Assigned Tasks', path: '/ngo/tasks', icon: 'ClipboardDocumentListIcon' },
      { label: 'Delivery Updates', path: '/ngo/deliveries', icon: 'TruckIcon' },
    ],
    auditor: [
      { label: 'Dashboard', path: '/auditor', icon: 'HomeIcon' },
      { label: 'Reports', path: '/auditor/reports', icon: 'DocumentChartBarIcon' },
      { label: 'Audit Logs', path: '/auditor/logs', icon: 'ClipboardDocumentListIcon' },
      { label: 'API Activity', path: '/auditor/api', icon: 'ServerIcon' },
    ],
    citizen: [
      { label: 'Dashboard', path: '/citizen', icon: 'HomeIcon' },
      { label: 'My Application', path: '/citizen/application', icon: 'DocumentTextIcon' },
      { label: 'Check Status', path: '/citizen/status', icon: 'MagnifyingGlassIcon' },
    ],
  };

  return items[role] || [];
}

export function getDefaultRoute(role: Role): string {
  const routes: Record<Role, string> = {
    admin: '/admin',
    field_officer: '/field-officer',
    verifier: '/verifier',
    program_manager: '/manager',
    finance_officer: '/finance',
    warehouse_officer: '/warehouse',
    gis_officer: '/gis',
    ngo_partner: '/ngo',
    auditor: '/auditor',
    citizen: '/citizen',
  };
  return routes[role] || '/login';
}

export function canAccessRoute(role: Role, path: string): boolean {
  const prefixMap: Record<Role, string> = {
    admin: '/admin',
    field_officer: '/field-officer',
    verifier: '/verifier',
    program_manager: '/manager',
    finance_officer: '/finance',
    warehouse_officer: '/warehouse',
    gis_officer: '/gis',
    ngo_partner: '/ngo',
    auditor: '/auditor',
    citizen: '/citizen',
  };
  const prefix = prefixMap[role];
  return path.startsWith(prefix);
}
