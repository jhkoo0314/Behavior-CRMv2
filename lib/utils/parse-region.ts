/**
 * 지역 파싱 유틸리티 함수
 * 
 * address에서 지역 정보를 추출하여 표시용 형식으로 변환합니다.
 * 예: "서울시 종로구" → "혜화/종로"
 */

/**
 * 주소에서 지역 정보를 파싱합니다.
 * 
 * @param address 전체 주소 문자열
 * @returns 파싱된 지역 정보 (예: "혜화/종로") 또는 null
 */
export function parseRegion(address: string | null): string | null {
  if (!address) return null;

  // 서울시 지역 매핑 (주요 지역)
  const seoulRegionMap: Record<string, string> = {
    '종로구': '혜화/종로',
    '중구': '명동/중구',
    '용산구': '용산/이촌',
    '성동구': '성동/왕십리',
    '광진구': '건대/광진',
    '동대문구': '동대문/청량리',
    '중랑구': '중랑/면목',
    '성북구': '성북/안암',
    '강북구': '강북/미아',
    '도봉구': '도봉/쌍문',
    '노원구': '노원/상계',
    '은평구': '은평/불광',
    '서대문구': '신촌/서대문',
    '마포구': '홍대/마포',
    '양천구': '양천/목동',
    '강서구': '강서/화곡',
    '구로구': '구로/가산',
    '금천구': '금천/독산',
    '영등포구': '영등포/여의도',
    '동작구': '동작/사당',
    '관악구': '관악/신림',
    '서초구': '서초/방배',
    '강남구': '강남/서초',
    '송파구': '송파/잠실',
    '강동구': '강동/천호',
  };

  // 서울시 주소인지 확인
  if (address.includes('서울')) {
    // 구 단위 추출
    for (const [gu, region] of Object.entries(seoulRegionMap)) {
      if (address.includes(gu)) {
        return region;
      }
    }
    // 구를 찾지 못한 경우 "서울"만 반환
    return '서울';
  }

  // 경기도 지역
  if (address.includes('경기')) {
    const gyeonggiCities = ['수원', '성남', '고양', '용인', '부천', '안산', '안양', '평택', '시흥', '김포', '광명', '군포', '광주', '이천', '양주', '오산', '구리', '안성', '포천', '의정부', '하남', '여주', '양평', '동두천', '과천', '가평', '의왕', '연천'];
    for (const city of gyeonggiCities) {
      if (address.includes(city)) {
        return `경기/${city}`;
      }
    }
    return '경기';
  }

  // 인천
  if (address.includes('인천')) {
    return '인천';
  }

  // 부산
  if (address.includes('부산')) {
    return '부산';
  }

  // 대구
  if (address.includes('대구')) {
    return '대구';
  }

  // 대전
  if (address.includes('대전')) {
    return '대전';
  }

  // 광주
  if (address.includes('광주')) {
    return '광주';
  }

  // 울산
  if (address.includes('울산')) {
    return '울산';
  }

  // 기타: 시/도만 추출
  const match = address.match(/([가-힣]+(?:시|도))/);
  if (match) {
    return match[1];
  }

  return null;
}

