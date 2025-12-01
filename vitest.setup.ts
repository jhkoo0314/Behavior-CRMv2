/**
 * @file vitest.setup.ts
 * @description Vitest 테스트 환경 설정 파일
 *
 * 테스트 실행 전 필요한 전역 설정
 */

import { expect, afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';
import * as matchers from '@testing-library/jest-dom/matchers';

// Testing Library matchers 확장
expect.extend(matchers);

// 각 테스트 후 cleanup
afterEach(() => {
  cleanup();
});

// 환경 변수 모킹
process.env.NODE_ENV = 'test';

