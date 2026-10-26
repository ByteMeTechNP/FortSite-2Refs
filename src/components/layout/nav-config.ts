import {
  Building2,
  ClipboardList,
  CreditCard,
  FileText,
  FolderTree,
  LayoutDashboard,
  LifeBuoy,
  MessageSquare,
  Package,
  ScrollText,
  Settings,
  Store,
  Users,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export type NavItem = {
  label: string;
  to: string;
  icon: LucideIcon;
};

export type NavGroup = {
  label: string;
  items: NavItem[];
};

export const NAV_GROUPS: NavGroup[] = [
  {
    label: 'Overview',
    items: [{ label: 'Dashboard', to: '/super-admin', icon: LayoutDashboard }],
  },
  {
    label: 'Customers',
    items: [
      { label: 'Companies', to: '/super-admin/companies', icon: Building2 },
      { label: 'Users & Access', to: '/super-admin/users', icon: Users },
      {
        label: 'Plans & Subscriptions',
        to: '/super-admin/subscriptions',
        icon: ClipboardList,
      },
      {
        label: 'Subscription Payments',
        to: '/super-admin/payments',
        icon: CreditCard,
      },
    ],
  },
  {
    label: 'Marketplace',
    items: [
      {
        label: 'Suppliers',
        to: '/super-admin/marketplace/suppliers',
        icon: Store,
      },
      {
        label: 'Product Listings',
        to: '/super-admin/marketplace/listings',
        icon: Package,
      },
      {
        label: 'Material Categories',
        to: '/super-admin/marketplace/categories',
        icon: FolderTree,
      },
      {
        label: 'Enquiries',
        to: '/super-admin/marketplace/enquiries',
        icon: MessageSquare,
      },
    ],
  },
  {
    label: 'Platform operations',
    items: [
      { label: 'Usage & Reports', to: '/super-admin/usage', icon: FileText },
      { label: 'Audit Logs', to: '/super-admin/audit-logs', icon: ScrollText },
      {
        label: 'Support & Incidents',
        to: '/super-admin/support',
        icon: LifeBuoy,
      },
      {
        label: 'Platform Settings',
        to: '/super-admin/settings',
        icon: Settings,
      },
    ],
  },
];
