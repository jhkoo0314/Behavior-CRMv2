/**
 * 경쟁사 신호 감지 로직
 * 
 * Activity description에서 경쟁사 관련 키워드/패턴을 탐지합니다.
 * PRD 5.3 참고: 경쟁사 활동 자동 탐지
 */

export interface CompetitorSignal {
  competitor_name: string;
  type: string;
  description: string;
  confidence: number; // 0-1, 신뢰도
}

/**
 * 경쟁사 키워드 리스트
 * 향후 설정 파일 또는 DB로 분리 가능
 */
const COMPETITOR_KEYWORDS = [
  '경쟁사',
  '경쟁 제품',
  '다른 제품',
  '다른 회사',
  '비교',
  '샘플',
  '샘플 요청',
  '가격 비교',
  '가격 문의',
  '대안',
  '대체',
  '교체',
  '변경',
  '바꾸',
];

/**
 * 경쟁사 이름 패턴 (예시)
 * 실제 사용 시에는 설정 파일이나 DB에서 관리
 */
const COMPETITOR_NAMES: string[] = [
  // 실제 경쟁사 이름을 여기에 추가
  // 예: 'A사', 'B제약', 'C제품' 등
];

/**
 * Activity description에서 경쟁사 신호를 감지합니다.
 * 
 * @param activityDescription Activity 설명 텍스트
 * @param accountId 병원 ID (향후 병원별 경쟁사 이력 분석에 사용)
 * @param contactId 담당자 ID (선택적)
 * @returns 감지된 경쟁사 신호 또는 null
 */
export function detectCompetitorSignals(
  activityDescription: string,
  accountId: string,
  contactId?: string
): CompetitorSignal | null {
  console.group('detectCompetitorSignals: 시작');
  console.log('Activity 설명:', activityDescription);
  console.log('병원 ID:', accountId);

  if (!activityDescription || activityDescription.trim().length === 0) {
    console.log('설명이 없어 경쟁사 신호 감지 불가');
    console.groupEnd();
    return null;
  }

  const description = activityDescription.toLowerCase();
  let detectedCompetitor: string | null = null;
  let signalType = 'general';
  let confidence = 0.3; // 기본 신뢰도

  // 1. 경쟁사 이름 직접 언급 확인
  for (const competitorName of COMPETITOR_NAMES) {
    if (description.includes(competitorName.toLowerCase())) {
      detectedCompetitor = competitorName;
      signalType = 'competitor_mentioned';
      confidence = 0.9;
      console.log('경쟁사 이름 직접 언급 감지:', competitorName);
      break;
    }
  }

  // 2. 경쟁사 키워드 패턴 확인
  if (!detectedCompetitor) {
    let keywordCount = 0;
    const matchedKeywords: string[] = [];

    for (const keyword of COMPETITOR_KEYWORDS) {
      if (description.includes(keyword.toLowerCase())) {
        keywordCount++;
        matchedKeywords.push(keyword);
      }
    }

    if (keywordCount > 0) {
      detectedCompetitor = '알 수 없는 경쟁사';
      signalType = 'keyword_detected';
      confidence = Math.min(0.3 + keywordCount * 0.2, 0.8); // 키워드 개수에 따라 신뢰도 증가
      console.log('경쟁사 키워드 감지:', matchedKeywords);
    }
  }

  // 3. 의사 멘트 패턴 분석
  const doctorMentionPatterns = [
    /다른.*제품.*쓰고/,
    /다른.*회사.*제품/,
    /비교.*중/,
    /가격.*비교/,
    /샘플.*요청/,
    /대안.*검토/,
    /교체.*고려/,
  ];

  for (const pattern of doctorMentionPatterns) {
    if (pattern.test(description)) {
      if (!detectedCompetitor) {
        detectedCompetitor = '알 수 없는 경쟁사';
        signalType = 'doctor_mention';
        confidence = 0.7;
      } else {
        confidence = Math.min(confidence + 0.1, 0.95); // 신뢰도 증가
      }
      console.log('의사 멘트 패턴 감지:', pattern);
      break;
    }
  }

  // 4. 가격/샘플 관련 문의 감지
  const priceSamplePatterns = [
    /가격.*문의/,
    /가격.*비교/,
    /샘플.*요청/,
    /샘플.*제공/,
    /견적.*요청/,
  ];

  for (const pattern of priceSamplePatterns) {
    if (pattern.test(description)) {
      if (!detectedCompetitor) {
        detectedCompetitor = '알 수 없는 경쟁사';
        signalType = 'price_sample_inquiry';
        confidence = 0.6;
      } else {
        confidence = Math.min(confidence + 0.1, 0.95);
      }
      console.log('가격/샘플 문의 패턴 감지:', pattern);
      break;
    }
  }

  // 신호가 감지되지 않았으면 null 반환
  if (!detectedCompetitor) {
    console.log('경쟁사 신호 미감지');
    console.groupEnd();
    return null;
  }

  // 신뢰도가 너무 낮으면 무시 (0.5 미만)
  if (confidence < 0.5) {
    console.log('신뢰도가 낮아 신호 무시:', confidence);
    console.groupEnd();
    return null;
  }

  const signal: CompetitorSignal = {
    competitor_name: detectedCompetitor,
    type: signalType,
    description: `Activity 설명에서 경쟁사 관련 신호 감지 (신뢰도: ${Math.round(confidence * 100)}%)`,
    confidence,
  };

  console.log('경쟁사 신호 감지 완료:', signal);
  console.groupEnd();

  return signal;
}






