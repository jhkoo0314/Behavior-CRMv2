/**
 * @file sample-data-generator.tsx
 * @description 샘플 데이터 생성 컴포넌트
 *
 * 대시보드에서 샘플 데이터를 항목별로 생성할 수 있는 UI
 */

'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Database, Building2, Users, Activity, Pill } from 'lucide-react';
import { createSampleAccounts } from '@/actions/sample-data/create-sample-accounts';
import { createSampleContacts } from '@/actions/sample-data/create-sample-contacts';
import { createSampleActivities } from '@/actions/sample-data/create-sample-activities';
import { createSamplePrescriptions } from '@/actions/sample-data/create-sample-prescriptions';
import { logger } from '@/lib/utils/logger';

interface GenerationStatus {
  accounts?: { created: number; accountIds: string[] };
  contacts?: { created: number; contactIds: string[] };
  activities?: { created: number };
  prescriptions?: { created: number };
}

export function SampleDataGenerator() {
  const [isGenerating, setIsGenerating] = useState<string | null>(null);
  const [status, setStatus] = useState<GenerationStatus>({});
  const [error, setError] = useState<string | null>(null);

  const handleGenerateAccounts = async () => {
    setIsGenerating('accounts');
    setError(null);
    logger.info('샘플 Account 생성 시작');

    try {
      const result = await createSampleAccounts({ count: 10 });
      setStatus((prev) => ({ ...prev, accounts: result }));
      logger.info('샘플 Account 생성 완료', { created: result.created });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Account 생성 실패';
      setError(message);
      logger.error('샘플 Account 생성 실패', err instanceof Error ? err : new Error(message));
    } finally {
      setIsGenerating(null);
    }
  };

  const handleGenerateContacts = async () => {
    if (!status.accounts?.accountIds || status.accounts.accountIds.length === 0) {
      setError('먼저 Account를 생성해주세요.');
      return;
    }

    setIsGenerating('contacts');
    setError(null);
    logger.info('샘플 Contact 생성 시작');

    try {
      const result = await createSampleContacts({
        accountIds: status.accounts.accountIds,
      });
      setStatus((prev) => ({ ...prev, contacts: result }));
      logger.info('샘플 Contact 생성 완료', { created: result.created });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Contact 생성 실패';
      setError(message);
      logger.error('샘플 Contact 생성 실패', err instanceof Error ? err : new Error(message));
    } finally {
      setIsGenerating(null);
    }
  };

  const handleGenerateActivities = async () => {
    if (!status.accounts?.accountIds || status.accounts.accountIds.length === 0) {
      setError('먼저 Account를 생성해주세요.');
      return;
    }

    setIsGenerating('activities');
    setError(null);
    logger.info('샘플 Activity 생성 시작');

    try {
      const result = await createSampleActivities({
        accountIds: status.accounts.accountIds,
        contactIds: status.contacts?.contactIds || [],
      });
      setStatus((prev) => ({ ...prev, activities: result }));
      logger.info('샘플 Activity 생성 완료', { created: result.created });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Activity 생성 실패';
      setError(message);
      logger.error('샘플 Activity 생성 실패', err instanceof Error ? err : new Error(message));
    } finally {
      setIsGenerating(null);
    }
  };

  const handleGeneratePrescriptions = async () => {
    if (!status.accounts?.accountIds || status.accounts.accountIds.length === 0) {
      setError('먼저 Account를 생성해주세요.');
      return;
    }

    setIsGenerating('prescriptions');
    setError(null);
    logger.info('샘플 Prescription 생성 시작');

    try {
      const result = await createSamplePrescriptions({
        accountIds: status.accounts.accountIds,
        contactIds: status.contacts?.contactIds || [],
      });
      setStatus((prev) => ({ ...prev, prescriptions: result }));
      logger.info('샘플 Prescription 생성 완료', { created: result.created });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Prescription 생성 실패';
      setError(message);
      logger.error(
        '샘플 Prescription 생성 실패',
        err instanceof Error ? err : new Error(message)
      );
    } finally {
      setIsGenerating(null);
    }
  };

  const handleGenerateAll = async () => {
    setIsGenerating('all');
    setError(null);
    logger.info('전체 샘플 데이터 생성 시작');

    try {
      // 1. Accounts 생성
      const accountsResult = await createSampleAccounts({ count: 10 });
      setStatus({ accounts: accountsResult });
      logger.info('Account 생성 완료', { created: accountsResult.created });

      // 2. Contacts 생성
      const contactsResult = await createSampleContacts({
        accountIds: accountsResult.accountIds,
      });
      setStatus((prev) => ({ ...prev, contacts: contactsResult }));
      logger.info('Contact 생성 완료', { created: contactsResult.created });

      // 3. Activities 생성
      const activitiesResult = await createSampleActivities({
        accountIds: accountsResult.accountIds,
        contactIds: contactsResult.contactIds,
      });
      setStatus((prev) => ({ ...prev, activities: activitiesResult }));
      logger.info('Activity 생성 완료', { created: activitiesResult.created });

      // 4. Prescriptions 생성
      const prescriptionsResult = await createSamplePrescriptions({
        accountIds: accountsResult.accountIds,
        contactIds: contactsResult.contactIds,
      });
      setStatus((prev) => ({ ...prev, prescriptions: prescriptionsResult }));
      logger.info('Prescription 생성 완료', { created: prescriptionsResult.created });

      logger.info('전체 샘플 데이터 생성 완료');
    } catch (err) {
      const message = err instanceof Error ? err.message : '샘플 데이터 생성 실패';
      setError(message);
      logger.error('전체 샘플 데이터 생성 실패', err instanceof Error ? err : new Error(message));
    } finally {
      setIsGenerating(null);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          샘플 데이터 생성
        </CardTitle>
        <CardDescription>
          파이롯 운영을 위한 샘플 데이터를 생성합니다. 순서대로 생성하거나 전체를 한 번에 생성할
          수 있습니다.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </div>
        )}

        <div className="grid gap-4 md:grid-cols-2">
          {/* Account 생성 */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">병원 (Account)</span>
              </div>
              {status.accounts && (
                <span className="text-sm text-muted-foreground">
                  {status.accounts.created}개 생성됨
                </span>
              )}
            </div>
            <Button
              onClick={handleGenerateAccounts}
              disabled={isGenerating !== null}
              variant="outline"
              className="w-full"
            >
              {isGenerating === 'accounts' ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  생성 중...
                </>
              ) : (
                '병원 생성 (10개)'
              )}
            </Button>
          </div>

          {/* Contact 생성 */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">담당자 (Contact)</span>
              </div>
              {status.contacts && (
                <span className="text-sm text-muted-foreground">
                  {status.contacts.created}개 생성됨
                </span>
              )}
            </div>
            <Button
              onClick={handleGenerateContacts}
              disabled={isGenerating !== null || !status.accounts}
              variant="outline"
              className="w-full"
            >
              {isGenerating === 'contacts' ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  생성 중...
                </>
              ) : (
                '담당자 생성'
              )}
            </Button>
          </div>

          {/* Activity 생성 */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">활동 (Activity)</span>
              </div>
              {status.activities && (
                <span className="text-sm text-muted-foreground">
                  {status.activities.created}개 생성됨
                </span>
              )}
            </div>
            <Button
              onClick={handleGenerateActivities}
              disabled={isGenerating !== null || !status.accounts}
              variant="outline"
              className="w-full"
            >
              {isGenerating === 'activities' ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  생성 중...
                </>
              ) : (
                '활동 생성 (50-100개)'
              )}
            </Button>
          </div>

          {/* Prescription 생성 */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Pill className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">처방 (Prescription)</span>
              </div>
              {status.prescriptions && (
                <span className="text-sm text-muted-foreground">
                  {status.prescriptions.created}개 생성됨
                </span>
              )}
            </div>
            <Button
              onClick={handleGeneratePrescriptions}
              disabled={isGenerating !== null || !status.accounts}
              variant="outline"
              className="w-full"
            >
              {isGenerating === 'prescriptions' ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  생성 중...
                </>
              ) : (
                '처방 생성 (20-50개)'
              )}
            </Button>
          </div>
        </div>

        {/* 전체 생성 버튼 */}
        <div className="pt-4 border-t">
          <Button
            onClick={handleGenerateAll}
            disabled={isGenerating !== null}
            className="w-full"
            size="lg"
          >
            {isGenerating === 'all' ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                전체 생성 중...
              </>
            ) : (
              '전체 샘플 데이터 생성'
            )}
          </Button>
          <p className="mt-2 text-xs text-center text-muted-foreground">
            Account → Contact → Activity → Prescription 순서로 자동 생성됩니다
          </p>
        </div>

        {/* 생성 완료 요약 */}
        {(status.accounts ||
          status.contacts ||
          status.activities ||
          status.prescriptions) && (
          <div className="rounded-lg bg-muted p-4">
            <h4 className="mb-2 text-sm font-semibold">생성 완료 요약</h4>
            <div className="space-y-1 text-sm text-muted-foreground">
              {status.accounts && (
                <div>병원: {status.accounts.created}개</div>
              )}
              {status.contacts && (
                <div>담당자: {status.contacts.created}개</div>
              )}
              {status.activities && (
                <div>활동: {status.activities.created}개</div>
              )}
              {status.prescriptions && (
                <div>처방: {status.prescriptions.created}개</div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

