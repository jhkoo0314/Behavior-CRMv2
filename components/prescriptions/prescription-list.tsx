'use client';

/**
 * Prescription 목록 컴포넌트
 * 
 * 처방 목록을 표시하고 수정/삭제 액션을 제공합니다.
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { Prescription } from '@/types/database.types';
import { PrescriptionForm } from './prescription-form';
import type { Account } from '@/types/database.types';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { updatePrescription } from '@/actions/prescriptions/update-prescription';
import { deletePrescription } from '@/actions/prescriptions/delete-prescription';
import type { PrescriptionFormData } from './prescription-form';

interface PrescriptionListProps {
  prescriptions: Prescription[];
  accounts: Account[];
  onRefresh?: () => void;
}

export function PrescriptionList({
  prescriptions,
  accounts,
  onRefresh,
}: PrescriptionListProps) {
  const [editingPrescription, setEditingPrescription] =
    useState<Prescription | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  const handleEdit = (prescription: Prescription) => {
    setEditingPrescription(prescription);
    setIsDialogOpen(true);
  };

  const handleDelete = async (prescriptionId: string) => {
    if (!confirm('정말 삭제하시겠습니까?')) {
      return;
    }

    setIsDeleting(prescriptionId);
    try {
      await deletePrescription(prescriptionId);
      console.log('Prescription 삭제 성공');
      if (onRefresh) {
        onRefresh();
      }
    } catch (error) {
      console.error('Prescription 삭제 실패:', error);
      alert('삭제에 실패했습니다.');
    } finally {
      setIsDeleting(null);
    }
  };

  const handleSubmit = async (data: PrescriptionFormData) => {
    if (!editingPrescription) {
      return;
    }

    try {
      await updatePrescription({
        id: editingPrescription.id,
        ...data,
      });
      console.log('Prescription 수정 성공');
      setIsDialogOpen(false);
      setEditingPrescription(null);
      if (onRefresh) {
        onRefresh();
      }
    } catch (error) {
      console.error('Prescription 수정 실패:', error);
      alert('수정에 실패했습니다.');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR');
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ko-KR').format(price);
  };

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>처방일</TableHead>
              <TableHead>병원</TableHead>
              <TableHead>제품명</TableHead>
              <TableHead>수량</TableHead>
              <TableHead>가격</TableHead>
              <TableHead>액션</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {prescriptions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground">
                  처방 데이터가 없습니다.
                </TableCell>
              </TableRow>
            ) : (
              prescriptions.map((prescription) => {
                const account = accounts.find(
                  (a) => a.id === prescription.account_id
                );
                return (
                  <TableRow key={prescription.id}>
                    <TableCell>{formatDate(prescription.prescription_date)}</TableCell>
                    <TableCell>{account?.name || prescription.account_id}</TableCell>
                    <TableCell>
                      <div className="font-medium">{prescription.product_name}</div>
                      {prescription.product_code && (
                        <div className="text-sm text-muted-foreground">
                          {prescription.product_code}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      {prescription.quantity} {prescription.quantity_unit}
                    </TableCell>
                    <TableCell>{formatPrice(prescription.price)}원</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(prescription)}
                        >
                          수정
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDelete(prescription.id)}
                          disabled={isDeleting === prescription.id}
                        >
                          {isDeleting === prescription.id ? '삭제 중...' : '삭제'}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>처방 수정</DialogTitle>
          </DialogHeader>
          {editingPrescription && (
            <PrescriptionForm
              prescription={editingPrescription}
              accounts={accounts}
              onSubmit={handleSubmit}
              onCancel={() => {
                setIsDialogOpen(false);
                setEditingPrescription(null);
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

