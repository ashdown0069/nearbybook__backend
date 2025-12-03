/**
 * Date 객체를 'YYYY-MM-DD' 형식의 문자열로 변환
 */
export function formatDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * n개월 전 날짜와 오늘 날짜를 객체로 리턴
 */
export function getDateRange(fromNMonthsAgo: number) {
  const today = new Date();
  const prev = new Date();
  prev.setMonth(today.getMonth() - fromNMonthsAgo);

  return {
    startDate: formatDate(prev), // n개월 전
    endDate: formatDate(today), // 현재
  };
}

export function is13DigitNumber(input) {
  const regex = /^\d{13}$/;
  return regex.test(String(input));
}

// --- 테스트 예시 ---
//  console.log(is13DigitNumber("1234567890123"));true (문자열)
// console.log(is13DigitNumber(1234567890123));   true (숫자)
