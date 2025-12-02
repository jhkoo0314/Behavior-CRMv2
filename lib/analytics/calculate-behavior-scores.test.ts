/**
 * @file calculate-behavior-scores.test.ts
 * @description Behavior Score 계산 함수 단위 테스트
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { calculateBehaviorScores } from './calculate-behavior-scores';
import type { Activity } from '@/types/database.types';
import type { BehaviorType } from '@/constants/behavior-types';

// Supabase 클라이언트 모킹
vi.mock('@/lib/supabase/server', () => ({
  createClerkSupabaseClient: vi.fn(() => ({
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          gte: vi.fn(() => ({
            lte: vi.fn(() => ({
              data: [],
              error: null,
            })),
          })),
        })),
      })),
    })),
  })),
}));

describe('calculateBehaviorScores', () => {
  const mockUserId = 'test-user-id';
  const mockPeriodStart = new Date('2024-01-01');
  const mockPeriodEnd = new Date('2024-01-31');

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('빈 활동 데이터에 대해 모든 behavior에 대해 0점을 반환해야 함', async () => {
    const { createClerkSupabaseClient } = await import('@/lib/supabase/server');
    const mockClient = {
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            gte: vi.fn(() => ({
              lte: vi.fn(() => ({
                data: [],
                error: null,
              })),
            })),
          })),
        })),
      })),
    };
    vi.mocked(createClerkSupabaseClient).mockResolvedValue(mockClient as any);

    const result = await calculateBehaviorScores(
      mockUserId,
      mockPeriodStart,
      mockPeriodEnd
    );

    expect(result).toHaveLength(8); // 8개 behavior 타입
    result.forEach((score) => {
      expect(score.intensityScore).toBe(0);
      expect(score.diversityScore).toBe(0);
      expect(score.qualityScore).toBe(0);
    });
  });

  it('단일 활동 데이터로 intensity score를 계산해야 함', async () => {
    const mockActivity: Activity = {
      id: '1',
      user_id: mockUserId,
      account_id: 'account-1',
      contact_id: null,
      type: 'visit',
      behavior: 'approach',
      description: 'Test activity',
      quality_score: 80,
      quantity_score: 70,
      duration_minutes: 30,
      performed_at: '2024-01-15T10:00:00Z',
      outcome: null,
      tags: [],
      sentiment_score: null,
      next_action_date: null,
      dwell_time_seconds: null,
      created_at: '2024-01-15T10:00:00Z',
      updated_at: '2024-01-15T10:00:00Z',
    };

    const { createClerkSupabaseClient } = await import('@/lib/supabase/server');
    const mockClient = {
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            gte: vi.fn(() => ({
              lte: vi.fn(() => ({
                data: [mockActivity],
                error: null,
              })),
            })),
          })),
        })),
      })),
    };
    vi.mocked(createClerkSupabaseClient).mockResolvedValue(mockClient as any);

    const result = await calculateBehaviorScores(
      mockUserId,
      mockPeriodStart,
      mockPeriodEnd
    );

    const approachScore = result.find((s) => s.behaviorType === 'approach');
    expect(approachScore).toBeDefined();
    // visit 타입은 가중치 3이므로 intensity score가 0보다 커야 함
    expect(approachScore!.intensityScore).toBeGreaterThan(0);
  });

  it('다양한 behavior 타입으로 diversity score를 계산해야 함', async () => {
    const mockActivities: Activity[] = [
      {
        id: '1',
        user_id: mockUserId,
        account_id: 'account-1',
        contact_id: null,
        type: 'visit',
        behavior: 'approach',
        description: 'Test 1',
        quality_score: 80,
        quantity_score: 70,
        duration_minutes: 30,
        performed_at: '2024-01-15T10:00:00Z',
        outcome: null,
        tags: [],
        sentiment_score: null,
        next_action_date: null,
        dwell_time_seconds: null,
        created_at: '2024-01-15T10:00:00Z',
        updated_at: '2024-01-15T10:00:00Z',
      },
      {
        id: '2',
        user_id: mockUserId,
        account_id: 'account-1',
        contact_id: null,
        type: 'call',
        behavior: 'contact',
        description: 'Test 2',
        quality_score: 75,
        quantity_score: 65,
        duration_minutes: 20,
        performed_at: '2024-01-16T10:00:00Z',
        outcome: null,
        tags: [],
        sentiment_score: null,
        next_action_date: null,
        dwell_time_seconds: null,
        created_at: '2024-01-16T10:00:00Z',
        updated_at: '2024-01-16T10:00:00Z',
      },
      {
        id: '3',
        user_id: mockUserId,
        account_id: 'account-1',
        contact_id: null,
        type: 'message',
        behavior: 'visit',
        description: 'Test 3',
        quality_score: 70,
        quantity_score: 60,
        duration_minutes: 10,
        performed_at: '2024-01-17T10:00:00Z',
        outcome: null,
        tags: [],
        sentiment_score: null,
        next_action_date: null,
        dwell_time_seconds: null,
        created_at: '2024-01-17T10:00:00Z',
        updated_at: '2024-01-17T10:00:00Z',
      },
    ];

    const { createClerkSupabaseClient } = await import('@/lib/supabase/server');
    const mockClient = {
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            gte: vi.fn(() => ({
              lte: vi.fn(() => ({
                data: mockActivities,
                error: null,
              })),
            })),
          })),
        })),
      })),
    };
    vi.mocked(createClerkSupabaseClient).mockResolvedValue(mockClient as any);

    const result = await calculateBehaviorScores(
      mockUserId,
      mockPeriodStart,
      mockPeriodEnd
    );

    // 3개의 서로 다른 behavior 타입이 있으므로 diversity score가 0보다 커야 함
    const approachScore = result.find((s) => s.behaviorType === 'approach');
    expect(approachScore?.diversityScore).toBeGreaterThan(0);
  });

  it('quality score를 올바르게 계산해야 함', async () => {
    const mockActivity: Activity = {
      id: '1',
      user_id: mockUserId,
      account_id: 'account-1',
      contact_id: null,
      type: 'visit',
      behavior: 'approach',
      description: 'Test activity',
      quality_score: 90,
      quantity_score: 85,
      duration_minutes: 30,
      performed_at: '2024-01-15T10:00:00Z',
      outcome: null,
      tags: [],
      sentiment_score: null,
      next_action_date: null,
      dwell_time_seconds: null,
      created_at: '2024-01-15T10:00:00Z',
      updated_at: '2024-01-15T10:00:00Z',
    };

    const { createClerkSupabaseClient } = await import('@/lib/supabase/server');
    const mockClient = {
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            gte: vi.fn(() => ({
              lte: vi.fn(() => ({
                data: [mockActivity],
                error: null,
              })),
            })),
          })),
        })),
      })),
    };
    vi.mocked(createClerkSupabaseClient).mockResolvedValue(mockClient as any);

    const result = await calculateBehaviorScores(
      mockUserId,
      mockPeriodStart,
      mockPeriodEnd
    );

    const approachScore = result.find((s) => s.behaviorType === 'approach');
    expect(approachScore).toBeDefined();
    // quality score는 0-100 범위여야 함
    expect(approachScore!.qualityScore).toBeGreaterThanOrEqual(0);
    expect(approachScore!.qualityScore).toBeLessThanOrEqual(100);
  });

  it('모든 behavior 타입에 대해 결과를 반환해야 함', async () => {
    const { createClerkSupabaseClient } = await import('@/lib/supabase/server');
    const mockClient = {
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            gte: vi.fn(() => ({
              lte: vi.fn(() => ({
                data: [],
                error: null,
              })),
            })),
          })),
        })),
      })),
    };
    vi.mocked(createClerkSupabaseClient).mockResolvedValue(mockClient as any);

    const result = await calculateBehaviorScores(
      mockUserId,
      mockPeriodStart,
      mockPeriodEnd
    );

    const behaviorTypes: BehaviorType[] = [
      'approach',
      'contact',
      'visit',
      'presentation',
      'question',
      'need_creation',
      'demonstration',
      'follow_up',
    ];

    expect(result).toHaveLength(8);
    behaviorTypes.forEach((behaviorType) => {
      const score = result.find((s) => s.behaviorType === behaviorType);
      expect(score).toBeDefined();
      expect(score?.behaviorType).toBe(behaviorType);
    });
  });
});

