'use client';

/**
 * Contact 목록 컴포넌트
 * 
 * 담당자 목록을 표시합니다.
 */

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreHorizontalIcon, PencilIcon, TrashIcon } from 'lucide-react';
import type { Contact } from '@/types/database.types';

interface ContactListProps {
  contacts: Contact[];
  onEdit: (contact: Contact) => void;
  onDelete: (contactId: string) => void;
}

export function ContactList({
  contacts,
  onEdit,
  onDelete,
}: ContactListProps) {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>이름</TableHead>
            <TableHead>역할</TableHead>
            <TableHead>전화번호</TableHead>
            <TableHead>이메일</TableHead>
            <TableHead>전문 분야</TableHead>
            <TableHead className="w-[50px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {contacts.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center text-muted-foreground">
                담당자가 없습니다.
              </TableCell>
            </TableRow>
          ) : (
            contacts.map((contact) => (
              <TableRow key={contact.id}>
                <TableCell className="font-medium">{contact.name}</TableCell>
                <TableCell>{contact.role || '-'}</TableCell>
                <TableCell>{contact.phone || '-'}</TableCell>
                <TableCell>{contact.email || '-'}</TableCell>
                <TableCell>{contact.specialty || '-'}</TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontalIcon className="size-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => onEdit(contact)}>
                        <PencilIcon className="mr-2 size-4" />
                        수정
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => onDelete(contact.id)}
                        className="text-destructive"
                      >
                        <TrashIcon className="mr-2 size-4" />
                        삭제
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}

