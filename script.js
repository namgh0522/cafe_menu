/* =================================================
   바이브 카페 스크립트
   파일: script.js
   설명: 실시간 금액 계산, 유효성 검사, 주문 확인 메시지 표시,
         Supabase DB 저장
   ================================================= */


/* ─────────────────────────────────────────────────
   Supabase 설정
   Supabase 대시보드 → Project Settings → API 에서
   URL과 anon (public) key를 복사해서 아래에 붙여넣으세요.
───────────────────────────────────────────────── */

// 프로젝트 URL: "https://xxxx.supabase.co" 형태
const SUPABASE_URL = 'https://sytrnpxdvvmivsoznkuh.supabase.co';

// anon(공개) API 키: "eyJ..." 로 시작하는 긴 문자열
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN5dHJucHhkdnZtaXZzb3pua3VoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE0MTM0MzYsImV4cCI6MjEwNjk4OTQzNn0.Bya8269VRXL9rdTOYovEI5GaIhYEmiX8xqQduSdgfSU';

/* createClient 함수를 CDN에서 불러온 전역 객체 supabase에서 꺼냄.
   supabase-js v2 CDN 방식은 window.supabase 에 모든 기능이 담겨 있음. */
const { createClient } = supabase;

// 실제로 DB와 통신할 클라이언트 객체 생성
const supabaseClient = createClient(SUPABASE_URL, SUPABASE_KEY);


/* ─────────────────────────────────────────────────
   DOM 요소 가져오기
   HTML의 id 속성으로 각 요소를 변수에 저장해둠.
   나중에 이 변수로 값을 읽거나 화면을 바꿀 수 있음.
───────────────────────────────────────────────── */

// 폼 전체
const orderForm = document.getElementById('order-form');

// 입력 요소들
const nameInput     = document.getElementById('customer-name');   // 이름
const drinkSelect   = document.getElementById('drink-select');    // 음료 드롭다운
const quantityInput = document.getElementById('quantity');        // 수량

// 사이즈 라디오 버튼 목록 (name="size" 인 요소 전체를 배열처럼 가져옴)
const sizeRadios = document.querySelectorAll('input[name="size"]');

// 추가 옵션 체크박스 목록 (name="options" 인 요소 전체)
const optionCheckboxes = document.querySelectorAll('input[name="options"]');

// 화면에 표시할 영역들
const estimatedPriceEl  = document.getElementById('estimated-price');   // 예상 금액 숫자 부분
const nameErrorEl       = document.getElementById('name-error');        // 이름 오류 메시지
const confirmationEl    = document.getElementById('order-confirmation'); // 주문 완료 메시지 영역

// 버튼들
const submitBtn = document.getElementById('submit-btn'); // 주문하기 버튼
const resetBtn  = document.getElementById('reset-btn');  // 다시 작성 버튼


/* ─────────────────────────────────────────────────
   calculateTotal() — 예상 금액 계산 함수
   이 함수 하나가 금액 계산을 전담함.
   이벤트 리스너에서 공통으로 호출해서 재사용.

   계산 공식:
     (음료 기본가 + 사이즈 추가가 + 옵션 추가가 합계) × 수량
───────────────────────────────────────────────── */
function calculateTotal() {

  /* 1) 음료 기본 가격 읽기
     선택된 option 요소의 data-price 속성을 숫자로 변환.
     parseInt()는 문자열 → 정수 변환 함수.
     아직 음료를 고르지 않았으면 value가 "" 이므로 0원. */
  const selectedOption   = drinkSelect.options[drinkSelect.selectedIndex];
  const drinkPrice       = parseInt(selectedOption.dataset.price, 10);

  /* 2) 선택된 사이즈 추가 가격 읽기
     라디오 버튼 중 checked(선택됨) 상태인 것을 찾아서 data-price 읽음. */
  let sizePrice = 0;
  sizeRadios.forEach(function (radio) {
    if (radio.checked) {
      sizePrice = parseInt(radio.dataset.price, 10);
    }
  });

  /* 3) 체크된 추가 옵션 가격 합산
     forEach로 모든 체크박스를 순회하며,
     체크된 것들의 data-price만 더함. */
  let optionsPrice = 0;
  optionCheckboxes.forEach(function (checkbox) {
    if (checkbox.checked) {
      optionsPrice += parseInt(checkbox.dataset.price, 10);
    }
  });

  /* 4) 수량 읽기
     비어있거나 1 미만이면 1로 보정, 10 초과이면 10으로 보정. */
  let qty = parseInt(quantityInput.value, 10);
  if (isNaN(qty) || qty < 1) qty = 1;
  if (qty > 10) qty = 10;

  /* 5) 최종 금액 계산
     음료를 아직 고르지 않았으면(drinkPrice === 0 이고 value가 "")
     사이즈·옵션도 의미가 없으므로 0원으로 표시. */
  let total = 0;
  if (drinkSelect.value !== '') {
    // 음료를 골랐을 때만 계산
    total = (drinkPrice + sizePrice + optionsPrice) * qty;
  }

  /* 6) 화면에 금액 표시
     toLocaleString()은 숫자에 천 단위 콤마를 붙여줌.
     예) 5000 → "5,000" */
  estimatedPriceEl.textContent = total.toLocaleString('ko-KR') + '원';

  // 계산된 total 값을 반환 → 주문 확인 메시지에서도 이 값을 쓸 수 있음
  return total;
}


/* ─────────────────────────────────────────────────
   실시간 금액 계산 — 이벤트 리스너 등록
   사용자가 음료·사이즈·옵션·수량을 바꿀 때마다
   calculateTotal()을 호출해서 금액을 즉시 갱신.
───────────────────────────────────────────────── */

// 음료 드롭다운이 바뀔 때
drinkSelect.addEventListener('change', calculateTotal);

// 사이즈 라디오 버튼 중 하나라도 바뀔 때
sizeRadios.forEach(function (radio) {
  radio.addEventListener('change', calculateTotal);
});

// 추가 옵션 체크박스 중 하나라도 바뀔 때
optionCheckboxes.forEach(function (checkbox) {
  checkbox.addEventListener('change', calculateTotal);
});

// 수량 입력칸이 바뀔 때
quantityInput.addEventListener('input', calculateTotal);


/* ─────────────────────────────────────────────────
   buildConfirmMessage() — 주문 확인 메시지 조립 함수
   "홍길동님, 카페라떼 M사이즈 (샷 추가) 1잔, 총 5,000원 주문이 접수되었습니다!"
   형태의 문자열을 만들어 반환함.
───────────────────────────────────────────────── */
function buildConfirmMessage(total) {

  // 이름
  const name = nameInput.value.trim();

  // 선택된 음료 이름 (option 텍스트에서 가격 부분 제거)
  // 예) "카페라떼 4,000원" → "카페라떼"
  const drinkText = drinkSelect.options[drinkSelect.selectedIndex].text
                      .replace(/\s*\d[\d,]+원$/, '') // 끝에 붙은 " 4,000원" 제거
                      .trim();

  // 선택된 사이즈 이름 (대문자로 변환)
  // 예) "m" → "M"
  let sizeName = '';
  sizeRadios.forEach(function (radio) {
    if (radio.checked) {
      sizeName = radio.value.toUpperCase(); // "s"→"S", "m"→"M", "l"→"L"
    }
  });

  // 체크된 옵션 이름 목록 수집
  // 예) ["샷 추가", "크림 추가"]
  const checkedOptions = [];
  optionCheckboxes.forEach(function (checkbox) {
    if (checkbox.checked) {
      // 체크박스 다음 텍스트노드에서 라벨 이름 추출
      // label 안에서 input을 제외한 텍스트를 가져오는 방법:
      // checkbox의 부모 label에서 price-tag 앞 텍스트만 사용
      const label = checkbox.closest('label'); // 가장 가까운 조상 label 요소
      // label의 textContent에서 가격 태그("+500원" 등) 부분을 지운 뒤 공백 정리
      const optionName = label.textContent
                              .replace(/\+\d+원/, '') // "+500원" 같은 부분 제거
                              .trim();
      checkedOptions.push(optionName);
    }
  });

  // 수량
  let qty = parseInt(quantityInput.value, 10);
  if (isNaN(qty) || qty < 1) qty = 1;

  // 옵션 문자열 만들기
  // 옵션이 1개 이상이면 " (샷 추가, 크림 추가)" 형태로, 없으면 빈 문자열
  const optionStr = checkedOptions.length > 0
    ? ' (' + checkedOptions.join(', ') + ')'
    : '';

  // 최종 메시지 조립
  return (
    name + '님, ' +
    drinkText + ' ' + sizeName + '사이즈' + optionStr + ' ' +
    qty + '잔, ' +
    '총 ' + total.toLocaleString('ko-KR') + '원 ' +
    '주문이 접수되었습니다! ☕'
  );
}


/* ─────────────────────────────────────────────────
   주문하기 버튼 — submit 이벤트 처리
   async 키워드: 함수 안에서 await(기다리기)를 쓸 수 있게 해줌.
   Supabase에 데이터를 저장하는 건 시간이 걸리는 작업이라
   await로 결과가 올 때까지 기다린 뒤 다음 줄을 실행함.
───────────────────────────────────────────────── */
orderForm.addEventListener('submit', async function (event) {

  // 브라우저 기본 동작(페이지 새로고침)을 막음
  event.preventDefault();

  /* ── 유효성 검사 1: 이름이 비어있는지 확인 ── */
  if (nameInput.value.trim() === '') {
    nameErrorEl.textContent = '이름을 입력해주세요.';
    nameInput.focus();
    return;
  } else {
    nameErrorEl.textContent = '';
  }

  /* ── 유효성 검사 2: 음료를 선택했는지 확인 ── */
  if (drinkSelect.value === '') {
    drinkSelect.focus();
    alert('음료를 선택해주세요.');
    return;
  }

  /* ── 저장하는 동안 버튼 비활성화 ──
     disabled = true 로 설정하면 버튼이 클릭되지 않음.
     텍스트도 바꿔서 사용자에게 진행 중임을 알림. */
  submitBtn.disabled = true;
  submitBtn.textContent = '주문 중...';

  /* ── 저장할 데이터 객체 만들기 ──
     Supabase 테이블의 열 이름과 정확히 일치해야 함. */

  // 최신 금액 계산
  const total = calculateTotal();

  // 선택된 음료의 기본 가격 (data-price 속성)
  const drinkPrice = parseInt(
    drinkSelect.options[drinkSelect.selectedIndex].dataset.price, 10
  );

  // 선택된 사이즈 값 ('s' | 'm' | 'l')
  let selectedSize = 'm'; // 기본값
  sizeRadios.forEach(function (radio) {
    if (radio.checked) selectedSize = radio.value;
  });

  // 체크된 옵션의 value 값만 배열로 수집
  // 예) ['shot', 'cream'] → Supabase TEXT[] 배열 컬럼에 저장
  const selectedOptions = [];
  optionCheckboxes.forEach(function (checkbox) {
    if (checkbox.checked) selectedOptions.push(checkbox.value);
  });

  // 수량
  let qty = parseInt(quantityInput.value, 10);
  if (isNaN(qty) || qty < 1) qty = 1;

  // 요청사항 (비어있으면 null 저장)
  const requestText = document.getElementById('request').value.trim() || null;

  // 전화번호 (비어있으면 null 저장)
  const telText = document.getElementById('customer-tel').value.trim() || null;

  /* Supabase에 보낼 주문 데이터 객체
     키 이름 = 테이블 열 이름, 값 = 입력값 */
  const orderData = {
    customer_name : nameInput.value.trim(), // 이름
    customer_tel  : telText,                // 전화번호
    drink         : drinkSelect.value,      // 음료 value ('americano' 등)
    drink_price   : drinkPrice,             // 음료 기본 가격 (원)
    size          : selectedSize,           // 사이즈 ('s'|'m'|'l')
    options       : selectedOptions,        // 옵션 배열 (['shot', 'cream'] 등)
    quantity      : qty,                    // 수량
    request       : requestText,            // 요청사항
    total_price   : total                   // 최종 금액 (원)
  };

  /* ── Supabase에 데이터 삽입 ──
     await: 삽입이 완료될 때까지 여기서 기다림.
     { error }: 결과에서 error 부분만 꺼냄.
     error가 null이면 성공, 값이 있으면 실패. */
  const { error } = await supabaseClient
    .from('cafe_orders')   // 테이블 이름
    .insert(orderData);    // 데이터 삽입

  /* ── 저장 실패 처리 ── */
  if (error) {
    // 브라우저 개발자 도구 콘솔에 상세 오류 출력
    console.error('주문 저장 오류:', error);
    // 사용자에게 알림
    alert('주문 저장에 실패했어요. 잠시 후 다시 시도해 주세요.');
    // 버튼을 다시 활성화해서 재시도 가능하게
    submitBtn.disabled = false;
    submitBtn.textContent = '주문하기';
    return; // 아래 성공 처리는 실행하지 않음
  }

  /* ── 저장 성공 처리 ── */

  // 주문 확인 메시지 문자열 생성 후 화면에 표시
  const message = buildConfirmMessage(total);
  confirmationEl.textContent = message;
  confirmationEl.classList.remove('hidden'); // hidden 제거 → 표시

  // 확인 영역으로 부드럽게 스크롤
  confirmationEl.scrollIntoView({ behavior: 'smooth', block: 'center' });

  // 버튼 shimmer(반짝이기) 효과 실행
  submitBtn.classList.add('flash');
  setTimeout(function () {
    submitBtn.classList.remove('flash');
  }, 600);

  // 버튼 원래 상태로 복원
  submitBtn.disabled = false;
  submitBtn.textContent = '주문하기';
});


/* ─────────────────────────────────────────────────
   다시 작성 버튼 — reset 이벤트 처리
   type="reset" 버튼은 브라우저가 자동으로 폼을 초기화하지만,
   추가 처리(금액 리셋, 메시지 숨김, 오류 초기화)를 여기서 함.
───────────────────────────────────────────────── */
orderForm.addEventListener('reset', function () {

  /* reset 이벤트는 폼 초기화가 완료되기 전에 발생함.
     따라서 setTimeout으로 한 틱(tick) 뒤에 실행해야
     초기화된 값을 정확히 읽을 수 있음. */
  setTimeout(function () {

    // M 사이즈를 다시 기본 선택으로 설정
    // (브라우저 reset은 HTML의 checked 속성 기준으로 복원하므로 이미 됨.
    //  하지만 명시적으로 확인하고 금액을 다시 계산)
    document.getElementById('size-m').checked = true;

    // 수량을 1로 명시적 복원
    quantityInput.value = 1;

    // 오류 메시지 초기화
    nameErrorEl.textContent = '';

    // 주문 확인 메시지 영역 다시 숨김
    confirmationEl.classList.add('hidden');
    confirmationEl.textContent = '';

    // 예상 금액을 0원으로 초기화
    estimatedPriceEl.textContent = '0원';

  }, 0); // 0ms 지연 → 현재 이벤트 처리가 끝난 직후 실행
});


/* ─────────────────────────────────────────────────
   페이지 최초 로드 시 초기 금액 표시
   M 사이즈가 기본 선택이지만 음료가 없으므로 0원.
───────────────────────────────────────────────── */
calculateTotal();

