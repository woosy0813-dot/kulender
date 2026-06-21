/**
 * KU 하루일정 - 고려대학교 맞춤형 로컬 스케줄러 스크립트
 */

// --- 상태 관리 ---
let currentYear = 2026; // 시나리오 시점인 2026년으로 기본 세팅
let currentMonth = 5;   // 6월 (0: 1월, 5: 6월)
let selectedDate = '2026-06-21'; // 오늘 날짜 기준

// --- 고려대 맞춤형 일정 키워드 기반 할 일 추천 규칙 ---
const RECOMMENDATION_RULES = [
  {
    keywords: ['블랙보드', 'blackboard', '포털', '수강', '수업', '강의', '교수'],
    tasks: ['블랙보드 과제함 제출 마감일 재확인하기', '포털 공지사항 및 메일함 체크하기', '강의 필기 내용 요약해 두기']
  },
  {
    keywords: ['중도', '중앙도서관', '과도', '과학도서관', '백주년', '백기', '중앙광장', '열람실', '공부'],
    tasks: ['KLUPIS/모바일 학생증으로 열람실 좌석 예약하기', '열람실 공부용 필기노트/태블릿 챙기기']
  },
  {
    keywords: ['시험', '고사', '퀴즈', '기말고사', '중간고사', '평가', '테스트'],
    tasks: ['시험 범위 학과 공지 더블 체크하기', '블랙보드 업로드된 강의안 다운로드 및 정리', '과학도서관 또는 중도 학습 스케줄 점검하기']
  },
  {
    keywords: ['과제', '제출', '레포트', '보고서', '에세이'],
    tasks: ['레포트 표지 서식 및 참고문헌 양식 검토', '파일 깨짐 방지를 위해 PDF 변환 후 제출하기']
  },
  {
    keywords: ['고연전', '입실렌티', '대동제', '축제', '응원', '합동응원', '엘리제'],
    tasks: ['크림슨 색상 응원 티셔츠 빨아두기', '응원가 리스트 가사 한 번 흥얼거리기', '뒤풀이 장소(안암 참살이길) 위치 더블체크']
  },
  {
    keywords: ['셔틀', '셔틀버스', '등교'],
    tasks: ['캠퍼스 순환 셔틀버스 시간표 및 정류장 확인하기']
  },
  {
    keywords: ['알바', '아르바이트', '근무', '과외'],
    tasks: ['과외/알바 이동 시간 확인 및 오늘 공부 분량 체크', '특이사항이나 다음 일정 메모하기']
  },
  {
    keywords: ['운동', '헬스', '녹지', '애기능', '체육관'],
    tasks: ['가벼운 마무리 스트레칭으로 몸 풀어주기', '수분 보충 및 단백질 챙기기']
  }
];

// --- 고려대 2026학년도 1학기 주요 학사 일정 Seed 데이터 ---
const KU_ACADEMIC_CALENDAR_2026 = {
  '2026-06-06': {
    events: [{ id: 'ku_ev_1', time: '00:00', title: '현충일 (공휴일)' }],
    todos: []
  },
  '2026-06-16': {
    events: [{ id: 'ku_ev_2', time: '09:00', title: '2026학년도 1학기 기말고사 시작' }],
    todos: []
  },
  '2026-06-17': {
    events: [{ id: 'ku_ev_3', time: '09:00', title: '1학기 기말고사 기간' }],
    todos: []
  },
  '2026-06-18': {
    events: [{ id: 'ku_ev_4', time: '09:00', title: '1학기 기말고사 기간' }],
    todos: []
  },
  '2026-06-19': {
    events: [{ id: 'ku_ev_5', time: '09:00', title: '1학기 기말고사 기간' }],
    todos: []
  },
  '2026-06-20': {
    events: [{ id: 'ku_ev_6', time: '09:00', title: '1학기 기말고사 기간 (주말)' }],
    todos: []
  },
  '2026-06-21': {
    events: [{ id: 'ku_ev_7', time: '09:00', title: '1학기 기말고사 기간 (주말)' }],
    todos: []
  },
  '2026-06-22': {
    events: [{ id: 'ku_ev_8', time: '09:00', title: '1학기 기말고사 종료 및 종강 🎓' }],
    todos: [{ id: 'ku_td_2', text: '종강 기념 동기들과 참살이길 뒤풀이 예약', completed: false }]
  }
};

// --- DOM 요소 캐싱 ---
// 좌측 패널 (오늘 고정)
const todayEventList = document.getElementById('today-event-list');
const todayTodoList = document.getElementById('today-todo-list');

// 우측 패널 (캘린더)
const prevMonthBtn = document.getElementById('prev-month-btn');
const nextMonthBtn = document.getElementById('next-month-btn');
const calendarMonthYear = document.getElementById('calendar-month-year');
const calendarDaysGrid = document.getElementById('calendar-days');

// 우측 패널 (선택일 상세)
const selectedDateDisplay = document.getElementById('selected-date-display');
const selectedEventList = document.getElementById('selected-event-list');
const selectedTodoList = document.getElementById('selected-todo-list');

// 입력 폼
const eventForm = document.getElementById('event-form');
const eventTimeInput = document.getElementById('event-time');
const eventTitleInput = document.getElementById('event-input');

const todoForm = document.getElementById('todo-form');
const todoTextInput = document.getElementById('todo-input');

// 추천 영역
const recommendationSection = document.getElementById('recommendation-section');
const recommendChipsContainer = document.getElementById('recommend-chips');


// --- 헬퍼 함수 ---

// 로컬 시간 기준 YYYY-MM-DD 문자열 생성 (2026년 기준 픽스 또는 실제 오늘 날짜 대응)
function getLocalTodayString() {
  const today = new Date();
  // 2026년 기준 시나리오 대응을 위해, 실제 연도가 2026년이 아니더라도 기본 뷰에 맞추기 위해 유연하게 설정
  const year = today.getFullYear() === 2026 ? 2026 : today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// YYYY-MM-DD 포맷을 가독성 좋은 한글 형식으로 변환
function formatDisplayDate(dateString) {
  if (!dateString) return '';
  const [year, month, day] = dateString.split('-');
  const date = new Date(year, month - 1, day);
  const weekDays = ['일', '월', '화', '수', '목', '금', '토'];
  const dayOfWeek = weekDays[date.getDay()];
  return `${year}년 ${month}월 ${day}일 (${dayOfWeek})`;
}

// XSS 방지용 이스케이프
function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}


// --- 2026 고려대 학사일정 기본 Seeding 로직 ---
function seedAcademicCalendar() {
  const seedKey = 'ku_academic_seeding_done_v1';
  if (!localStorage.getItem(seedKey)) {
    // 2026학년도 일정 객체 루프 돌며 로컬스토리지에 저장
    Object.entries(KU_ACADEMIC_CALENDAR_2026).forEach(([dateStr, data]) => {
      localStorage.setItem(`schedule_${dateStr}`, JSON.stringify(data));
    });
    localStorage.setItem(seedKey, 'true');
  }
}


// --- 로컬 스토리지 데이터 입출력 (CRUD) ---

// 특정 날짜의 데이터를 로드
function getDayData(dateStr) {
  const key = `schedule_${dateStr}`;
  const data = localStorage.getItem(key);
  if (data) {
    const parsed = JSON.parse(data);
    return {
      events: parsed.events || [],
      todos: parsed.todos || []
    };
  }
  return { events: [], todos: [] };
}

// 특정 날짜에 데이터를 저장
function saveDayData(dateStr, data) {
  const key = `schedule_${dateStr}`;
  if (data.events.length === 0 && data.todos.length === 0) {
    localStorage.removeItem(key);
  } else {
    localStorage.setItem(key, JSON.stringify(data));
  }
}


// --- 달력 (Calendar) 렌더링 엔진 ---

function renderCalendar() {
  calendarDaysGrid.innerHTML = '';
  
  // 헤더 갱신
  calendarMonthYear.textContent = `${currentYear}년 ${currentMonth + 1}월`;
  
  // 1일의 요일과 마지막 날짜 구하기
  const firstDayIndex = new Date(currentYear, currentMonth, 1).getDay();
  const lastDate = new Date(currentYear, currentMonth + 1, 0).getDate();
  
  // 이전 달의 마지막 날짜 구하기 (빈 칸 채우기용)
  const prevLastDate = new Date(currentYear, currentMonth, 0).getDate();
  
  // 달력 전체 칸수 (6행 유지)
  const totalSlots = 42;
  
  // 1. 이전 달 날짜 채우기
  for (let i = firstDayIndex - 1; i >= 0; i--) {
    const dayNum = prevLastDate - i;
    let prevYear = currentYear;
    let prevMon = currentMonth - 1;
    if (prevMon < 0) {
      prevMon = 11;
      prevYear--;
    }
    const dayStr = `${prevYear}-${String(prevMon + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
    createDayCell(dayNum, dayStr, true);
  }
  
  // 2. 이번 달 날짜 채우기
  for (let dayNum = 1; dayNum <= lastDate; dayNum++) {
    const dayStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
    createDayCell(dayNum, dayStr, false);
  }
  
  // 3. 다음 달 날짜 채우기
  const currentSlotsFilled = firstDayIndex + lastDate;
  const remainingSlots = totalSlots - currentSlotsFilled;
  for (let dayNum = 1; dayNum <= remainingSlots; dayNum++) {
    let nextYear = currentYear;
    let nextMon = currentMonth + 1;
    if (nextMon > 11) {
      nextMon = 0;
      nextYear++;
    }
    const dayStr = `${nextYear}-${String(nextMon + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
    createDayCell(dayNum, dayStr, true);
  }
}

// 달력의 날짜 칸 DOM 생성 및 삽입
function createDayCell(dayNum, dateStr, isOtherMonth) {
  const dayCell = document.createElement('div');
  dayCell.className = 'calendar-day';
  if (isOtherMonth) {
    dayCell.className += ' other-month';
  }
  
  // 요일 색상 구분용
  const cellDate = new Date(dateStr);
  const dayOfWeek = cellDate.getDay();
  if (dayOfWeek === 0) dayCell.className += ' sun';
  if (dayOfWeek === 6) dayCell.className += ' sat';
  
  // 오늘 표시
  const todayStr = getLocalTodayString();
  if (dateStr === todayStr) {
    dayCell.className += ' today';
  }
  
  // 선택된 날짜 표시
  if (dateStr === selectedDate) {
    dayCell.className += ' selected';
  }
  
  // 날짜 숫자 라벨
  dayCell.innerHTML = `<span class="day-number">${dayNum}</span>`;
  
  // 일정 및 할 일 유무 확인 후 도트 표시 추가
  const dayData = getDayData(dateStr);
  const hasEvents = dayData.events.length > 0;
  const hasTodos = dayData.todos.length > 0;
  
  if (hasEvents || hasTodos) {
    const indicators = document.createElement('div');
    indicators.className = 'day-indicators';
    
    if (hasEvents) {
      const eventDot = document.createElement('span');
      eventDot.className = 'indicator-dot event';
      indicators.appendChild(eventDot);
    }
    if (hasTodos) {
      const todoDot = document.createElement('span');
      todoDot.className = 'indicator-dot todo';
      indicators.appendChild(todoDot);
    }
    dayCell.appendChild(indicators);
  }
  
  // 날짜 클릭 이벤트 바인딩
  dayCell.addEventListener('click', () => {
    selectedDate = dateStr;
    
    // 달력 연/월 상태 동기화
    const targetDate = new Date(dateStr);
    currentYear = targetDate.getFullYear();
    currentMonth = targetDate.getMonth();
    
    renderCalendar();
    renderSelectedDayDetails();
    hideRecommendations();
  });
  
  calendarDaysGrid.appendChild(dayCell);
}


// --- 상세 및 목록 렌더링 ---

// [공통] 리스트 아이템 렌더링 템플릿 생성
function createListItemHTML(item, type, dateStr) {
  if (type === 'event') {
    return `
      <div class="item-content">
        <span class="time-badge">${item.time}</span>
        <span class="event-text">${escapeHtml(item.title)}</span>
      </div>
      <button type="button" class="btn-item-delete" aria-label="일정 삭제" onclick="deleteItem('${dateStr}', 'event', '${item.id}')">
        🗑️
      </button>
    `;
  } else {
    return `
      <div class="item-content">
        <label class="checkbox-container">
          <input type="checkbox" ${item.completed ? 'checked' : ''} onchange="toggleTodoComplete('${dateStr}', '${item.id}')">
          <span class="checkmark"></span>
        </label>
        <span class="todo-text">${escapeHtml(item.text)}</span>
      </div>
      <button type="button" class="btn-item-delete" aria-label="할 일 삭제" onclick="deleteItem('${dateStr}', 'todo', '${item.id}')">
        🗑️
      </button>
    `;
  }
}

// 좌측 패널 (오늘의 일정 & 할 일) 렌더링
function renderTodayPanel() {
  const todayStr = getLocalTodayString();
  const todayData = getDayData(todayStr);
  
  // 1. 오늘의 일정 그리기
  todayEventList.innerHTML = '';
  if (todayData.events.length === 0) {
    todayEventList.innerHTML = '<li class="empty-state">오늘 등록된 일정이 없습니다.</li>';
  } else {
    const sortedEvents = [...todayData.events].sort((a, b) => a.time.localeCompare(b.time));
    sortedEvents.forEach(item => {
      const li = document.createElement('li');
      li.className = 'list-item';
      li.innerHTML = createListItemHTML(item, 'event', todayStr);
      todayEventList.appendChild(li);
    });
  }
  
  // 2. 오늘의 할 일 그리기
  todayTodoList.innerHTML = '';
  if (todayData.todos.length === 0) {
    todayTodoList.innerHTML = '<li class="empty-state">오늘 해야 할 일이 없습니다.</li>';
  } else {
    todayData.todos.forEach(item => {
      const li = document.createElement('li');
      li.className = `list-item ${item.completed ? 'completed' : ''}`;
      li.innerHTML = createListItemHTML(item, 'todo', todayStr);
      todayTodoList.appendChild(li);
    });
  }
}

// 우측 패널 (선택한 날짜 상세) 렌더링
function renderSelectedDayDetails() {
  selectedDateDisplay.textContent = formatDisplayDate(selectedDate);
  
  const dayData = getDayData(selectedDate);
  
  // 1. 선택일 일정 리스트 렌더링
  selectedEventList.innerHTML = '';
  if (dayData.events.length === 0) {
    selectedEventList.innerHTML = '<li class="empty-state">등록된 일정이 없습니다.</li>';
  } else {
    const sortedEvents = [...dayData.events].sort((a, b) => a.time.localeCompare(b.time));
    sortedEvents.forEach(item => {
      const li = document.createElement('li');
      li.className = 'list-item';
      li.innerHTML = createListItemHTML(item, 'event', selectedDate);
      selectedEventList.appendChild(li);
    });
  }
  
  // 2. 선택일 할 일 리스트 렌더링
  selectedTodoList.innerHTML = '';
  if (dayData.todos.length === 0) {
    selectedTodoList.innerHTML = '<li class="empty-state">등록된 할 일이 없습니다.</li>';
  } else {
    dayData.todos.forEach(item => {
      const li = document.createElement('li');
      li.className = `list-item ${item.completed ? 'completed' : ''}`;
      li.innerHTML = createListItemHTML(item, 'todo', selectedDate);
      selectedTodoList.appendChild(li);
    });
  }
}


// --- 일정 & 할 일 추가 (Save) ---

function addEvent(e) {
  e.preventDefault();
  
  const time = eventTimeInput.value;
  const title = eventTitleInput.value.trim();
  
  if (!time) {
    alert('시간을 선택해 주세요.');
    eventTimeInput.focus();
    return;
  }
  if (!title) {
    alert('일정 내용을 입력해 주세요.');
    eventTitleInput.focus();
    return;
  }
  
  const dayData = getDayData(selectedDate);
  const newEvent = {
    id: 'ev_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
    time: time,
    title: title
  };
  
  dayData.events.push(newEvent);
  saveDayData(selectedDate, dayData);
  
  eventTitleInput.value = '';
  renderAllViews();
  
  analyzeTitleForRecommendations(title);
}

function addTodo(e) {
  e.preventDefault();
  
  const text = todoTextInput.value.trim();
  if (!text) {
    alert('할 일 내용을 입력해 주세요.');
    todoTextInput.focus();
    return;
  }
  
  const dayData = getDayData(selectedDate);
  const newTodo = {
    id: 'td_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
    text: text,
    completed: false
  };
  
  dayData.todos.push(newTodo);
  saveDayData(selectedDate, dayData);
  
  todoTextInput.value = '';
  renderAllViews();
}

window.deleteItem = function(dateStr, type, id) {
  const dayData = getDayData(dateStr);
  
  if (type === 'event') {
    dayData.events = dayData.events.filter(item => item.id !== id);
  } else if (type === 'todo') {
    dayData.todos = dayData.todos.filter(item => item.id !== id);
  }
  
  saveDayData(dateStr, dayData);
  renderAllViews();
};

window.toggleTodoComplete = function(dateStr, id) {
  const dayData = getDayData(dateStr);
  dayData.todos = dayData.todos.map(todo => {
    if (todo.id === id) {
      return { ...todo, completed: !todo.completed };
    }
    return todo;
  });
  
  saveDayData(dateStr, dayData);
  renderAllViews();
};


// --- 일정 기반 할 일 추천 엔진 ---

function analyzeTitleForRecommendations(title) {
  const matchedTasks = [];
  
  RECOMMENDATION_RULES.forEach(rule => {
    const isMatched = rule.keywords.some(keyword => title.includes(keyword));
    if (isMatched) {
      rule.tasks.forEach(task => {
        if (!matchedTasks.includes(task)) {
          matchedTasks.push(task);
        }
      });
    }
  });
  
  if (matchedTasks.length > 0) {
    recommendChipsContainer.innerHTML = '';
    
    matchedTasks.forEach(taskText => {
      const chip = document.createElement('button');
      chip.type = 'button';
      chip.className = 'recommend-chip';
      chip.innerHTML = `${escapeHtml(taskText)} <span style="font-weight:700;">+</span>`;
      
      chip.addEventListener('click', () => {
        const dayData = getDayData(selectedDate);
        
        const isDuplicate = dayData.todos.some(todo => todo.text === taskText);
        if (isDuplicate) {
          alert('이미 할 일 목록에 추가되어 있습니다.');
          return;
        }
        
        const newTodo = {
          id: 'td_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
          text: taskText,
          completed: false
        };
        
        dayData.todos.push(newTodo);
        saveDayData(selectedDate, dayData);
        renderAllViews();
        
        chip.remove();
        if (recommendChipsContainer.children.length === 0) {
          hideRecommendations();
        }
      });
      
      recommendChipsContainer.appendChild(chip);
    });
    
    recommendationSection.classList.remove('hidden');
  } else {
    hideRecommendations();
  }
}

function hideRecommendations() {
  recommendationSection.classList.add('hidden');
  recommendChipsContainer.innerHTML = '';
}


// --- 뷰 통합 리프레시 ---
function renderAllViews() {
  renderCalendar();
  renderTodayPanel();
  renderSelectedDayDetails();
}


// --- 초기화 설정 ---

function init() {
  // 1. 고려대 학사일정 Seeding
  seedAcademicCalendar();
  
  // 2. 날짜 선택 연동 설정 (시나리오 구동을 위해 2026-06-21로 포커스)
  const todayStr = getLocalTodayString();
  
  // 만약 실제 오늘 날짜가 2026년 6월 바운더리 밖이라면, 시나리오 테스트 편의를 위해 2026-06-21을 기본값으로 사용
  // 사용자가 달력을 이동하여 테스트할 수 있도록 기본 상태 설정
  if (todayStr.startsWith('2026-06')) {
    selectedDate = todayStr;
    const targetDate = new Date(todayStr);
    currentYear = targetDate.getFullYear();
    currentMonth = targetDate.getMonth();
  } else {
    selectedDate = '2026-06-21';
    currentYear = 2026;
    currentMonth = 5; // 6월
  }
  
  // 3. 네비게이션 버튼 이벤트 바인딩
  prevMonthBtn.addEventListener('click', () => {
    currentMonth--;
    if (currentMonth < 0) {
      currentMonth = 11;
      currentYear--;
    }
    renderCalendar();
  });
  
  nextMonthBtn.addEventListener('click', () => {
    currentMonth++;
    if (currentMonth > 11) {
      currentMonth = 0;
      currentYear++;
    }
    renderCalendar();
  });
  
  // 4. 폼 등록 이벤트 바인딩
  eventForm.addEventListener('submit', addEvent);
  todoForm.addEventListener('submit', addTodo);
  
  // 5. 최초 렌더링 실행
  renderAllViews();
}

document.addEventListener('DOMContentLoaded', init);
