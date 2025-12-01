/**
 * 사이드바 네비게이션 컴포넌트
 * 
 * 메뉴 항목: Dashboard, Analysis, Growth, Activities, Outcomes
 * 역할별 메뉴 표시/숨김 로직 포함
 */

'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  BarChart3,
  TrendingUp,
  Activity,
  FileText,
  Users,
} from 'lucide-react';
import { UserRole, USER_ROLES } from '@/constants/user-roles';
import { useEffect, useState } from 'react';

interface NavItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  roles?: UserRole[]; // 접근 가능한 역할 (없으면 모든 역할)
}

const navItems: NavItem[] = [
  {
    title: '대시보드',
    href: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    title: '분석',
    href: '/analysis',
    icon: BarChart3,
  },
  {
    title: '성장 맵',
    href: '/growth',
    icon: TrendingUp,
  },
  {
    title: '활동 기록',
    href: '/activities',
    icon: Activity,
  },
  {
    title: '성과 리포트',
    href: '/outcomes',
    icon: FileText,
  },
  {
    title: '관리자',
    href: '/manager',
    icon: Users,
    roles: [USER_ROLES.MANAGER, USER_ROLES.HEAD_MANAGER],
  },
];

interface SidebarProps {
  className?: string;
}

export function Sidebar({ className }: SidebarProps) {
  const pathname = usePathname();
  const [userRole, setUserRole] = useState<UserRole | null>(null);

  useEffect(() => {
    // 클라이언트에서 역할 조회 (서버 액션 필요)
    // 임시로 모든 메뉴 표시
    setUserRole(USER_ROLES.SALESPERSON);
  }, []);

  const filteredNavItems = navItems.filter((item) => {
    if (!item.roles) return true;
    if (!userRole) return false;
    return item.roles.includes(userRole);
  });

  return (
    <aside
      className={cn(
        'flex h-full w-64 flex-col border-r bg-background',
        className
      )}
    >
      <div className="flex h-16 items-center border-b px-6">
        <Link href="/dashboard" className="text-lg font-semibold">
          Behavior CRM
        </Link>
      </div>
      <nav className="flex-1 space-y-1 p-4">
        {filteredNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || pathname?.startsWith(`${item.href}/`);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
              )}
            >
              <Icon className="h-5 w-5" />
              {item.title}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}

