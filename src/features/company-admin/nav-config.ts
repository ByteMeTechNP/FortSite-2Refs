import {
  Building2,
  ClipboardList,
  FolderKanban,
  LayoutDashboard,
  MapPin,
  Settings,
  Users,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export type CompanyAdminNavItem = {
  label: string;
  to: string;
  icon: LucideIcon;
};

export type CompanyAdminNavGroup = {
  label: string;
  items: CompanyAdminNavItem[];
  upcoming?: string[];
};

export const COMPANY_ADMIN_NAV: CompanyAdminNavGroup[] = [
  {
    label: 'Workspace',
    items: [
      { label: 'Overview', to: '/company-admin', icon: LayoutDashboard },
      {
        label: 'Company Profile',
        to: '/company-admin/profile',
        icon: Building2,
      },
      {
        label: 'Subscription & Licence',
        to: '/company-admin/subscription',
        icon: ClipboardList,
      },
      { label: 'Team & Permissions', to: '/company-admin/team', icon: Users },
      { label: 'Projects', to: '/company-admin/projects', icon: FolderKanban },
      { label: 'Sites', to: '/company-admin/sites', icon: MapPin },
      { label: 'Settings', to: '/company-admin/settings', icon: Settings },
    ],
    upcoming: [
      'Workforce',
      'Materials & Inventory',
      'Procurement',
      'Supplier Marketplace',
      'Finance',
      'Reports',
      'Activity Log',
    ],
  },
];
