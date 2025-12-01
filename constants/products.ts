/**
 * 제품 목록 상수 정의
 * 
 * 처방 입력 시 사용할 제품 목록입니다.
 */

export const PRODUCTS = [
  { code: 'PROD001', name: '제품 A' },
  { code: 'PROD002', name: '제품 B' },
  { code: 'PROD003', name: '제품 C' },
  { code: 'PROD004', name: '제품 D' },
  { code: 'PROD005', name: '제품 E' },
] as const;

export type Product = (typeof PRODUCTS)[number];

export const PRODUCT_NAMES = PRODUCTS.map((p) => p.name);

