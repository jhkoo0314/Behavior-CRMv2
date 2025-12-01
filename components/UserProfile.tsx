"use client";

/**
 * @file components/UserProfile.tsx
 * @description 사용자 프로필 드롭다운 컴포넌트
 *
 * Clerk와 연동된 사용자 프로필 표시 및 로그아웃 기능 제공
 */

import { useClerk } from "@clerk/nextjs";
import Image from "next/image";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LogOut, User } from "lucide-react";

interface UserProfileProps {
  userName: string;
  userInitials: string;
  userImageUrl: string | null;
  department: string;
}

export function UserProfile({
  userName,
  userInitials,
  userImageUrl,
  department,
}: UserProfileProps) {
  const { signOut } = useClerk();

  const handleSignOut = async () => {
    console.group("🚪 [UserProfile] 로그아웃 시작");
    console.log("👤 사용자:", userName);
    try {
      await signOut();
      console.log("✅ 로그아웃 성공");
    } catch (error) {
      console.error("❌ 로그아웃 실패:", error);
    }
    console.groupEnd();
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <div className="flex items-center gap-4 bg-white px-5 py-3 rounded-full border border-stone-200 shadow-sm cursor-pointer hover:bg-stone-50 transition-colors">
          <div className="text-right hidden sm:block">
            <div className="text-sm font-semibold text-dark-900">{userName}</div>
            <div className="text-xs text-stone-500">{department}</div>
          </div>
          {userImageUrl ? (
            <div className="w-10 h-10 rounded-full overflow-hidden border border-stone-300 flex items-center justify-center">
              <Image
                src={userImageUrl}
                alt={userName}
                width={40}
                height={40}
                className="w-full h-full object-cover"
              />
            </div>
          ) : (
            <div className="w-10 h-10 rounded-full bg-stone-200 border border-stone-300 flex items-center justify-center text-stone-500 font-bold">
              {userInitials}
            </div>
          )}
        </div>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{userName}</p>
            <p className="text-xs leading-none text-muted-foreground">
              {department}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem>
          <User className="mr-2 h-4 w-4" />
          <span>프로필</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          variant="destructive"
          onClick={handleSignOut}
          className="cursor-pointer"
        >
          <LogOut className="mr-2 h-4 w-4" />
          <span>로그아웃</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

