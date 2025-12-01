/**
 * 앱 레이아웃 컴포넌트
 * 
 * 사이드바 + 메인 콘텐츠 영역 구조
 * 모바일 반응형 처리 (Sheet 컴포넌트 사용)
 */

'use client';

import { useState } from 'react';
import { Sidebar } from './sidebar';
import { Header } from './header';
import { Sheet, SheetContent } from '@/components/ui/sheet';

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden">
      {/* 데스크탑 사이드바 */}
      <aside className="hidden lg:block">
        <Sidebar />
      </aside>

      {/* 모바일 사이드바 (Sheet) */}
      <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
        <SheetContent side="left" className="w-64 p-0">
          <Sidebar />
        </SheetContent>
      </Sheet>

      {/* 메인 콘텐츠 영역 */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header onMenuClick={() => setMobileMenuOpen(true)} />
        <main className="flex-1 overflow-y-auto bg-muted/30 p-6">
          {children}
        </main>
      </div>
    </div>
  );
}

