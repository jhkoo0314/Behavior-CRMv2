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
  // 초기 상태를 서버와 클라이언트에서 동일하게 유지
  const [userRole] = useState<UserRole | null>(USER_ROLES.SALESPERSON);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
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
        <Link 
          href="/dashboard" 
          className="text-lg font-semibold"
          prefetch={false}
        >
          Behavior CRM
        </Link>
      </div>
      <nav className="flex-1 space-y-1 p-4">
        {filteredNavItems.map((item) => {
          const Icon = item.icon;
          // pathname은 클라이언트에서만 사용 가능하므로, 마운트 전에는 false
          const isActive = isMounted && (pathname === item.href || pathname?.startsWith(`${item.href}/`));

          return (
            <Link
              key={item.href}
              href={item.href}
              prefetch={false}
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

