/**
 * 헤더 컴포넌트
 * 
 * 사용자 프로필 드롭다운, 알림 아이콘, 모바일 메뉴 토글 버튼 포함
 */

'use client';

import { useState, useEffect } from 'react';
import { UserButton, useUser } from '@clerk/nextjs';
import { Bell, Menu, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface HeaderProps {
  onMenuClick?: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
  const [isMounted, setIsMounted] = useState(false);
  const { user, isLoaded } = useUser();
  const router = useRouter();

  // 클라이언트에서만 렌더링하도록 처리 (Hydration 에러 방지)
  useEffect(() => {
    setIsMounted(true);
  }, []);

  const userName = isLoaded && user ? (user.fullName || user.firstName || "사용자") : "사용자";

  const handleRefresh = () => {
    router.refresh();
  };

  return (
    <header className="flex h-16 items-center justify-between border-b bg-background px-4 lg:px-4 xl:px-6">
      <div className="flex items-center gap-4">
        {/* 모바일 메뉴 토글 버튼 */}
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden"
          onClick={onMenuClick}
        >
          <Menu className="h-5 w-5" />
          <span className="sr-only">메뉴 열기</span>
        </Button>
        {isMounted ? (
          <div>
            <h1 className="text-lg font-semibold lg:text-xl">안녕하세요, {userName} 님 👋</h1>
            <p className="text-xs text-muted-foreground hidden lg:block">
              Behavior-Driven CRM v2에 오신 것을 환영합니다.
            </p>
          </div>
        ) : (
          <div>
            <h1 className="text-lg font-semibold lg:text-xl">안녕하세요, 사용자 님 👋</h1>
            <p className="text-xs text-muted-foreground hidden lg:block">
              Behavior-Driven CRM v2에 오신 것을 환영합니다.
            </p>
          </div>
        )}
      </div>

      <div className="flex items-center gap-4">
        {/* 새로고침 버튼 */}
        <Button
          variant="ghost"
          size="icon"
          onClick={handleRefresh}
          className="relative"
        >
          <RefreshCw className="h-5 w-5" />
          <span className="sr-only">데이터 새로고침</span>
        </Button>

        {/* 알림 아이콘 (향후 구현) */}
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          <span className="sr-only">알림</span>
          {/* 알림 배지 (향후 구현) */}
          {/* <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-destructive" /> */}
        </Button>

        {/* 사용자 프로필 - 클라이언트에서만 렌더링 */}
        {isMounted && (
          <UserButton
            appearance={{
              elements: {
                avatarBox: 'h-8 w-8',
              },
            }}
          />
        )}
      </div>
    </header>
  );
}

