/**
 * 사이드바 네비게이션 컴포넌트
 * 
 * 메뉴 항목: Dashboard, Analysis, Growth, Activities, Accounts, Outcomes, Manager
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
  Building2,
  Menu,
  ChevronLeft,
} from 'lucide-react';
import { UserRole, USER_ROLES } from '@/constants/user-roles';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';

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
    title: '병원 관리',
    href: '/accounts',
    icon: Building2,
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
  },
];

interface SidebarProps {
  className?: string;
  isOpen?: boolean;
  onToggle?: () => void;
}

export function Sidebar({ className, isOpen = true, onToggle }: SidebarProps) {
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
        'flex h-full flex-col border-r bg-background transition-all duration-300',
        isOpen ? 'w-64' : 'w-16',
        className
      )}
    >
      <div className={cn(
        'flex h-16 items-center border-b transition-all duration-300',
        isOpen ? 'justify-between px-6' : 'justify-center px-2'
      )}>
        {isOpen ? (
          <>
            <Link 
              href="/" 
              className="text-lg font-semibold"
              prefetch={false}
            >
              Behavior CRM
            </Link>
            <Button
              variant="ghost"
              size="icon"
              onClick={onToggle}
              className="h-8 w-8"
            >
              <ChevronLeft className="h-5 w-5" />
              <span className="sr-only">사이드바 닫기</span>
            </Button>
          </>
        ) : (
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggle}
            className="h-8 w-8"
          >
            <Menu className="h-5 w-5" />
            <span className="sr-only">사이드바 열기</span>
          </Button>
        )}
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
                'flex items-center rounded-lg transition-colors',
                isOpen ? 'gap-3 px-3 py-2 text-sm font-medium' : 'justify-center p-2',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
              )}
              title={!isOpen ? item.title : undefined}
            >
              <Icon className="h-5 w-5" />
              {isOpen && <span>{item.title}</span>}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}

