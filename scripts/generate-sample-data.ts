/**
 * @file generate-sample-data.ts
 * @description 샘플 데이터 생성 스크립트
 *
 * 파이롯 운영을 위한 샘플 데이터를 생성합니다.
 * - 샘플 Account 생성 (10-20개)
 * - 샘플 Contact 생성 (각 Account당 2-3개)
 * - 샘플 Activity 생성 (최근 90일간, 사용자별 50-100개)
 * - 샘플 Prescription 생성 (최근 30일간)
 * - Behavior Score 및 Outcome 자동 계산
 *
 * 사용법:
 *   npx tsx scripts/generate-sample-data.ts
 */

import { createClient } from "@supabase/supabase-js";

// 환경 변수 로드 (dotenv가 있으면 사용)
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const dotenv = require("dotenv");
  dotenv.config({ path: ".env.local" });
} catch {
  // dotenv가 없으면 환경 변수가 이미 설정되어 있다고 가정
  console.log("💡 dotenv가 없습니다. 환경 변수가 이미 설정되어 있어야 합니다.");
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("❌ Supabase 환경 변수가 설정되지 않았습니다.");
  console.error(
    "NEXT_PUBLIC_SUPABASE_URL와 SUPABASE_SERVICE_ROLE_KEY를 확인하세요.",
  );
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// 샘플 데이터 상수
const ACCOUNT_NAMES = [
  "서울대학교병원",
  "세브란스병원",
  "아산병원",
  "삼성서울병원",
  "고려대학교병원",
  "연세대학교세브란스병원",
  "가톨릭의대 서울성모병원",
  "한양대학교병원",
  "경희대학교병원",
  "중앙대학교병원",
  "분당서울대학교병원",
  "순천향대학교병원",
  "이화여자대학교병원",
  "건국대학교병원",
  "인하대학교병원",
];

const ACCOUNT_TYPES = [
  "general_hospital",
  "hospital",
  "clinic",
  "pharmacy",
] as const;
const ACTIVITY_TYPES = [
  "visit",
  "call",
  "message",
  "presentation",
  "follow_up",
] as const;
const BEHAVIOR_TYPES = [
  "approach",
  "contact",
  "visit",
  "presentation",
  "question",
  "need_creation",
  "demonstration",
  "follow_up",
] as const;

/**
 * 랜덤 정수 생성
 */
function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * 랜덤 날짜 생성 (최근 N일 내)
 */
function randomDate(daysAgo: number): Date {
  const now = new Date();
  const days = randomInt(0, daysAgo);
  const date = new Date(now);
  date.setDate(date.getDate() - days);
  date.setHours(randomInt(9, 18));
  date.setMinutes(randomInt(0, 59));
  return date;
}

/**
 * 샘플 Account 생성
 */
async function createSampleAccounts(count: number): Promise<string[]> {
  console.log(`📋 ${count}개의 샘플 Account 생성 중...`);

  const accountIds: string[] = [];
  const accounts = [];

  for (let i = 0; i < count; i++) {
    const name = ACCOUNT_NAMES[i] || `샘플 병원 ${i + 1}`;
    const type = ACCOUNT_TYPES[randomInt(0, ACCOUNT_TYPES.length - 1)];

    accounts.push({
      name,
      type,
      address: `서울시 ${randomInt(1, 25)}구 샘플로 ${randomInt(1, 999)}번지`,
      phone: `02-${randomInt(1000, 9999)}-${randomInt(1000, 9999)}`,
      specialty: ["내과", "외과", "정형외과", "신경과", "정신과"][
        randomInt(0, 4)
      ],
      patient_count: randomInt(100, 10000),
      revenue: randomInt(100000000, 10000000000),
      notes: `샘플 병원 ${i + 1}에 대한 메모입니다.`,
    });
  }

  const { data, error } = await supabase
    .from("accounts")
    .insert(accounts)
    .select("id");

  if (error) {
    console.error("❌ Account 생성 실패:", error);
    throw error;
  }

  data.forEach((account) => accountIds.push(account.id));
  console.log(`✅ ${accountIds.length}개의 Account 생성 완료`);

  return accountIds;
}

/**
 * 샘플 Contact 생성
 */
async function createSampleContacts(accountIds: string[]): Promise<string[]> {
  console.log(`📋 샘플 Contact 생성 중...`);

  const contactIds: string[] = [];
  const contacts = [];

  for (const accountId of accountIds) {
    const contactCount = randomInt(2, 3);

    for (let i = 0; i < contactCount; i++) {
      contacts.push({
        account_id: accountId,
        name: `담당자 ${i + 1}`,
        role: ["과장", "차장", "부장", "원장", "교수"][randomInt(0, 4)],
        phone: `010-${randomInt(1000, 9999)}-${randomInt(1000, 9999)}`,
        email: `contact${i + 1}@example.com`,
        specialty: ["내과", "외과", "정형외과"][randomInt(0, 2)],
        notes: `샘플 담당자 ${i + 1}에 대한 메모입니다.`,
      });
    }
  }

  const { data, error } = await supabase
    .from("contacts")
    .insert(contacts)
    .select("id");

  if (error) {
    console.error("❌ Contact 생성 실패:", error);
    throw error;
  }

  data.forEach((contact) => contactIds.push(contact.id));
  console.log(`✅ ${contactIds.length}개의 Contact 생성 완료`);

  return contactIds;
}

/**
 * 샘플 Activity 생성
 */
async function createSampleActivities(
  userId: string,
  accountIds: string[],
  contactIds: string[],
): Promise<void> {
  console.log(`📋 샘플 Activity 생성 중...`);

  const activityCount = randomInt(50, 100);
  const activities = [];

  for (let i = 0; i < activityCount; i++) {
    const accountId = accountIds[randomInt(0, accountIds.length - 1)];
    const contactId =
      randomInt(0, 10) > 3
        ? contactIds[randomInt(0, contactIds.length - 1)]
        : null;
    const type = ACTIVITY_TYPES[randomInt(0, ACTIVITY_TYPES.length - 1)];
    const behavior = BEHAVIOR_TYPES[randomInt(0, BEHAVIOR_TYPES.length - 1)];

    activities.push({
      user_id: userId,
      account_id: accountId,
      contact_id: contactId,
      type,
      behavior,
      description: `${type} 활동: ${behavior} 행동 수행`,
      quality_score: randomInt(50, 100),
      quantity_score: randomInt(50, 100),
      duration_minutes: randomInt(10, 120),
      performed_at: randomDate(90).toISOString(),
    });
  }

  const { error } = await supabase.from("activities").insert(activities);

  if (error) {
    console.error("❌ Activity 생성 실패:", error);
    throw error;
  }

  console.log(`✅ ${activityCount}개의 Activity 생성 완료`);
}

/**
 * 샘플 Prescription 생성
 */
async function createSamplePrescriptions(
  accountIds: string[],
  contactIds: string[],
): Promise<void> {
  console.log(`📋 샘플 Prescription 생성 중...`);

  const prescriptionCount = randomInt(20, 50);
  const prescriptions = [];

  for (let i = 0; i < prescriptionCount; i++) {
    const accountId = accountIds[randomInt(0, accountIds.length - 1)];
    const contactId =
      randomInt(0, 10) > 5
        ? contactIds[randomInt(0, contactIds.length - 1)]
        : null;

    prescriptions.push({
      account_id: accountId,
      contact_id: contactId,
      product_name: `제품 ${randomInt(1, 10)}`,
      product_code: `PROD-${randomInt(1000, 9999)}`,
      quantity: randomInt(10, 1000),
      quantity_unit: "정",
      price: randomInt(10000, 100000),
      prescription_date: randomDate(30).toISOString().split("T")[0],
      notes: `샘플 처방 ${i + 1}에 대한 메모입니다.`,
    });
  }

  const { error } = await supabase.from("prescriptions").insert(prescriptions);

  if (error) {
    console.error("❌ Prescription 생성 실패:", error);
    throw error;
  }

  console.log(`✅ ${prescriptionCount}개의 Prescription 생성 완료`);
}

/**
 * 메인 함수
 */
async function main() {
  console.log("🚀 샘플 데이터 생성 시작...\n");

  try {
    // 사용자 ID 조회 (첫 번째 사용자 사용)
    const { data: users, error: userError } = await supabase
      .from("users")
      .select("id")
      .limit(1);

    if (userError || !users || users.length === 0) {
      console.error(
        "❌ 사용자를 찾을 수 없습니다. 먼저 로그인하여 사용자를 생성하세요.",
      );
      process.exit(1);
    }

    const userId = users[0].id;
    console.log(`👤 사용자 ID: ${userId}\n`);

    // 1. Account 생성
    const accountCount = randomInt(10, 15);
    const accountIds = await createSampleAccounts(accountCount);
    console.log("");

    // 2. Contact 생성
    const contactIds = await createSampleContacts(accountIds);
    console.log("");

    // 3. Activity 생성
    await createSampleActivities(userId, accountIds, contactIds);
    console.log("");

    // 4. Prescription 생성
    await createSamplePrescriptions(accountIds, contactIds);
    console.log("");

    console.log("✅ 샘플 데이터 생성 완료!");
    console.log("\n📝 다음 단계:");
    console.log("   1. Behavior Score 계산: 대시보드에서 자동 계산됩니다.");
    console.log("   2. Outcome 계산: 대시보드에서 자동 계산됩니다.");
  } catch (error) {
    console.error("❌ 샘플 데이터 생성 실패:", error);
    process.exit(1);
  }
}

// 스크립트 실행
main();
