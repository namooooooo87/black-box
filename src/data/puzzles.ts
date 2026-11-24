import { ClueData, PuzzleData } from '../types/game';

export const CLUES: ClueData[] = [
  {
    id: 'clue-z1',
    zoneId: 'zone1',
    code: 'CLUE-01',
    title: '제어 코어 주파수 A',
    summary: '중앙 통제실의 전력 동기화 패턴에서 추출한 기본 제어 숫자입니다.',
    valueText: 'A = 7',
  },
  {
    id: 'clue-z2',
    zoneId: 'zone2',
    code: 'CLUE-02',
    title: '백업 복구 키워드',
    summary: '데이터 서버실의 암호 로그를 복원하여 얻은 4글자 핵심 보안 키워드입니다.',
    valueText: 'KEY = CODE',
  },
  {
    id: 'clue-z3',
    zoneId: 'zone3',
    code: 'CLUE-03',
    title: '최적 에너지 경로 가중치',
    summary: '알고리즘 실험실 네트워크에서 필수 경유 노드를 지나는 최소 비용 값입니다.',
    valueText: 'COST = 15',
  },
  {
    id: 'clue-z4',
    zoneId: 'zone4',
    code: 'CLUE-04',
    title: '격리된 결함 라인 번호',
    summary: '오류 격리 구역 디버깅에서 발견된 핵심 반복문 초기화 오류 위치입니다.',
    valueText: 'LINE = 3',
  },
];

export const PUZZLES: PuzzleData[] = [
  // ==========================================
  // ZONE 1: 중앙 통제실 (패턴 인식 & 기초)
  // ==========================================
  {
    id: 'z1-p1',
    zoneId: 'zone1',
    title: '전력 동기화 매트릭스',
    category: '숫자 규칙 찾기',
    description: '중앙 통제실의 보조 발전기 출력 표가 손상되었습니다.',
    prompt:
      '각 행의 왼쪽 두 숫자를 특정 규칙으로 조합하면 오른쪽 결과값이 나옵니다. 규칙을 찾아 마지막 [ ? ]에 들어갈 숫자를 입력하세요.',
    inputKind: 'text',
    answer: '36',
    acceptedAnswers: ['36'],
    diagram: {
      type: 'sequence',
      items: [
        '(2, 5) → 15',
        '(3, 4) → 16',
        '(4, 7) → 35',
        '(5, 6) → [ ? ]',
      ],
      highlightLast: true,
    },
    hints: [
      '두 수를 그냥 더하거나 곱하기만 해서는 15, 16, 35가 동시에 나오지 않습니다. 첫 번째 숫자에 작은 변화를 준 뒤 두 번째 숫자와 곱해 보세요.',
      '첫 번째 행에서 (2 + 1) × 5 = 15가 됩니다. 두 번째 행에서도 (3 + 1) × 4 = 16이 성립하는지 확인해 보세요.',
      '규칙은 (첫 번째 수 + 1) × 두 번째 수 입니다. 따라서 (5 + 1) × 6을 계산하면 정답이 나옵니다.',
    ],
    explanation: '(A + 1) × B 규칙이 적용됩니다. (5 + 1) × 6 = 36입니다.',
    rewardClueId: 'clue-z1',
  },
  {
    id: 'z1-p2',
    zoneId: 'zone1',
    title: '홀로그램 타일 배열',
    category: '도형 배열 규칙 찾기',
    description: '보안 패널의 3×3 홀로그램 타일 중 오른쪽 아래 칸이 비어 있습니다.',
    prompt:
      '가로와 세로 방향의 도형 종류(원, 삼각형, 사각형)와 개수 규칙을 분석하여 빈칸에 들어갈 올바른 타일을 선택하세요.',
    inputKind: 'choice',
    options: [
      '노란색 삼각형 2개',
      '청록색 사각형 2개',
      '파란색 원 3개',
      '노란색 삼각형 3개',
    ],
    answer: '노란색 삼각형 2개',
    diagram: {
      type: 'shape-matrix',
      rows: [
        [
          { shape: 'circle', count: 1, color: '#0ea5e9' },
          { shape: 'triangle', count: 2, color: '#f59e0b' },
          { shape: 'square', count: 3, color: '#10b981' },
        ],
        [
          { shape: 'triangle', count: 2, color: '#f59e0b' },
          { shape: 'square', count: 3, color: '#10b981' },
          { shape: 'circle', count: 1, color: '#0ea5e9' },
        ],
        [
          { shape: 'square', count: 3, color: '#10b981' },
          { shape: 'circle', count: 1, color: '#0ea5e9' },
          null,
        ],
      ],
    },
    hints: [
      '각 가로줄(행)과 세로줄(열)에 등장하는 도형의 종류(원·삼각형·사각형)와 개수를 따로 살펴보세요.',
      '모든 가로줄과 세로줄에는 원(파랑)·삼각형(노랑)·사각형(청록)이 한 번씩, 개수도 1·2·3이 한 번씩 들어갑니다.',
      '마지막 줄에는 청록색 사각형(3개)과 파란색 원(1개)이 있으므로, 빈칸에는 노란색 삼각형 2개가 들어가야 합니다.',
    ],
    explanation:
      '각 행과 열에 원(파랑)·삼각형(노랑)·사각형(청록) 및 개수 1·2·3이 중복 없이 한 번씩 배치되는 규칙이므로 노란색 삼각형 2개가 정답입니다.',
    rewardClueId: 'clue-z1',
  },
  {
    id: 'z1-p3',
    zoneId: 'zone1',
    title: '연구소 부팅 시퀀스',
    category: '순서 배열하기',
    description: '중앙 제어 컴퓨터를 안전하게 재부팅하려면 선행 조건에 따라 모듈을 켜야 합니다.',
    prompt:
      '조건 카드를 읽고, 4개의 시스템 모듈을 올바른 실행 순서대로 클릭하여 배열하세요.',
    inputKind: 'sequence',
    sequencePool: [
      '보조 전원 공급',
      '냉각 팬 가동',
      '메모리 무결성 검사',
      '구역 보안 해제',
    ],
    answer: '보조 전원 공급 -> 냉각 팬 가동 -> 메모리 무결성 검사 -> 구역 보안 해제',
    diagram: {
      type: 'logic-cards',
      cards: [
        {
          title: '부팅 의존성 조건',
          items: [
            '1. [냉각 팬 가동]은 [보조 전원 공급] 직후에 실행되어야 과열을 막을 수 있습니다.',
            '2. [메모리 무결성 검사]는 냉각 팬이 켜진 뒤에만 시작할 수 있습니다.',
            '3. [구역 보안 해제]는 메모리 검사가 완료된 마지막 단계에서만 작동합니다.',
          ],
        },
      ],
    },
    hints: [
      '전력이 들어오지 않으면 어떤 장치도 움직일 수 없습니다. 가장 먼저 실행해야 할 단계를 찾아보세요.',
      '보조 전원 공급 → 냉각 팬 가동 순서가 앞부분에 오고, 구역 보안 해제는 가장 마지막에 옵니다.',
      '정확한 순서는 [보조 전원 공급] → [냉각 팬 가동] → [메모리 무결성 검사] → [구역 보안 해제] 입니다.',
    ],
    explanation:
      '작업 간 선후 관계(의존성)를 분해하면 전원 → 냉각 → 메모리 검사 → 보안 해제 순으로 유일한 경로가 결정됩니다.',
    rewardClueId: 'clue-z1',
  },
  {
    id: 'z1-bypass',
    zoneId: 'zone1',
    title: '비상 게이트 우회 단말',
    category: '우회 복구 패턴',
    isBypass: true,
    description: '보안 문이 열리지 않을 때 작동하는 비상 우회 회로입니다. 이 문제를 해결하면 다음 구역 문이 즉시 열립니다.',
    prompt:
      '다음 코드 시퀀스의 규칙을 찾아 마지막 [ ? ]에 들어갈 알파벳+숫자 조합을 입력하세요. (예: Z99)',
    inputKind: 'text',
    answer: 'E15',
    acceptedAnswers: ['E15', 'e15'],
    diagram: {
      type: 'sequence',
      items: ['A1', 'B3', 'C6', 'D10', '[ ? ]'],
      highlightLast: true,
    },
    hints: [
      '앞쪽의 알파벳과 뒤쪽의 숫자를 따로 나누어 규칙을 찾아보세요.',
      '알파벳은 A, B, C, D 순서로 1칸씩 증가합니다. 숫자는 +2, +3, +4씩 커지고 있습니다.',
      'D 다음 알파벳은 E이고, 10에 5를 더하면 15이므로 정답은 E15입니다.',
    ],
    explanation: '알파벳은 1칸씩(A→B→C→D→E), 숫자는 계차수열(+2, +3, +4, +5)로 증가해 E15가 됩니다.',
    rewardClueId: 'clue-z1',
  },

  // ==========================================
  // ZONE 2: 데이터 서버실 (정보 분석 & 추상화)
  // ==========================================
  {
    id: 'z2-p1',
    zoneId: 'zone2',
    title: '이진수 LED 암호 해독',
    category: '암호 해독',
    description: '서버 랙 전면의 5비트 LED 램프가 3글자 영문 암호를 깜빡이고 있습니다.',
    prompt:
      '켜진 램프(●)는 1, 꺼진 램프(○)는 0을 뜻합니다. 각 5자리 이진수를 십진수로 바꾼 뒤, 알파벳 순서(1=A, 2=B, ..., 26=Z)로 변환한 3글자 영문 단어를 입력하세요.',
    inputKind: 'text',
    answer: 'KEY',
    acceptedAnswers: ['KEY', 'key'],
    diagram: {
      type: 'binary-leds',
      groups: [
        { label: '첫째 자리', bits: [0, 1, 0, 1, 1] },
        { label: '둘째 자리', bits: [0, 0, 1, 0, 1] },
        { label: '셋째 자리', bits: [1, 1, 0, 0, 1] },
      ],
      note: '자리값: 16 · 8 · 4 · 2 · 1  (예: 00011 = 2+1 = 3 → C)',
    },
    hints: [
      '5자리 이진수의 각 자리는 왼쪽부터 16, 8, 4, 2, 1의 값을 가집니다. ●(1)인 자리의 값만 모두 더하세요.',
      '첫째 자리 01011 = 8 + 2 + 1 = 11(K), 둘째 자리 00101 = 4 + 1 = 5(E)입니다. 셋째 자리 11001을 계산해 보세요.',
      '셋째 자리 11001 = 16 + 8 + 1 = 25이며 25번째 알파벳은 Y입니다. 합치면 KEY가 됩니다.',
    ],
    explanation: '01011(11=K), 00101(5=E), 11001(25=Y) → 암호는 KEY입니다.',
    rewardClueId: 'clue-z2',
  },
  {
    id: 'z2-p2',
    zoneId: 'zone2',
    title: '손상된 패킷 분류하기',
    category: '데이터 분류',
    description: '서버로 들어온 4개의 데이터 패킷 중 보안 필터를 통과하지 못하는 불량 패킷이 섞여 있습니다.',
    prompt:
      '정상 패킷 기준을 모두 만족하지 않는 손상된 패킷의 ID를 선택하세요.',
    inputKind: 'choice',
    options: ['PK-101', 'PK-102', 'PK-103', 'PK-104'],
    answer: 'PK-103',
    diagram: {
      type: 'packet-table',
      headers: ['패킷 ID', '프로토콜', '크기(KB)', '포트', '암호화'],
      rows: [
        { id: 'PK-101', cells: ['PK-101', 'HTTPS', '240', '443', 'AES'] },
        { id: 'PK-102', cells: ['PK-102', 'HTTPS', '480', '443', 'AES'] },
        { id: 'PK-103', cells: ['PK-103', 'HTTP', '512', '80', 'NONE'] },
        { id: 'PK-104', cells: ['PK-104', 'HTTPS', '128', '443', 'AES'] },
      ],
      ruleSummary: '정상 패킷 조건: ① HTTPS 프로토콜 사용 ② 크기 500KB 이하 ③ 암호화 적용(NONE 불가)',
    },
    hints: [
      '표에서 불필요한 정보는 추상화하고, 조건 3가지(프로토콜, 크기, 암호화)만 하나씩 대조해 보세요.',
      'PK-101, PK-102, PK-104는 모두 HTTPS에 500KB 이하, AES 암호화가 적용되어 있습니다.',
      'PK-103은 HTTP 프로토콜이며 크기가 512KB로 500KB를 초과하고 암호화도 NONE이므로 손상된 패킷입니다.',
    ],
    explanation: '핵심 속성만 추출해 분류하면 조건을 모두 어긴 패킷은 PK-103뿐입니다.',
    rewardClueId: 'clue-z2',
  },
  {
    id: 'z2-p3',
    zoneId: 'zone2',
    title: '문자열 압축 규칙 찾기',
    category: '공통 규칙 찾기',
    description: '대용량 센서 로그를 줄이기 위해 반복되는 문자를 숫자와 문자로 압축하는 규칙을 사용하고 있습니다.',
    prompt:
      '예시 규칙을 분석하여 압축된 문자열 [ 3C2O1D1E ]을 원래 문자열로 복원한 결과를 입력하세요. (대문자로 입력)',
    inputKind: 'text',
    answer: 'CCCOODE',
    acceptedAnswers: ['CCCOODE', 'cccoode'],
    diagram: {
      type: 'sequence',
      items: [
        'AAABBC → 3A2B1C',
        'XXXXYY → 4X2Y',
        '3C2O1D1E → [ ? ]',
      ],
      highlightLast: true,
    },
    hints: [
      '3A2B1C는 A가 3번, B가 2번, C가 1번 연속된다는 뜻의 런랭스(RLE) 압축입니다.',
      '3C는 C가 3번(CCC), 2O는 O가 2번(OO) 반복된다는 의미입니다.',
      '3C(CCC) + 2O(OO) + 1D(D) + 1E(E)를 이어 붙이면 CCCOODE가 됩니다.',
    ],
    explanation: '숫자+문자 쌍은 해당 문자가 숫자만큼 연속 반복됨을 의미합니다. 따라서 CCCOODE입니다.',
    rewardClueId: 'clue-z2',
  },
  {
    id: 'z2-bypass',
    zoneId: 'zone2',
    title: '백업 로그 시저 암호 우회',
    category: '우회 암호 해독',
    isBypass: true,
    description: '서버실 비상 통로를 열기 위한 백업 키워드 복구 장치입니다.',
    prompt:
      '모든 알파벳을 앞으로 3칸씩 되돌리는 시저 암호(예: D→A, E→B)를 적용해 암호문 [ FRGH ]를 해독하세요.',
    inputKind: 'text',
    answer: 'CODE',
    acceptedAnswers: ['CODE', 'code'],
    diagram: {
      type: 'sequence',
      items: [
        '암호 규칙: 각 알파벳 - 3칸 (D → A)',
        '암호문: F - R - G - H',
        '해독 결과: [ ? ]',
      ],
      highlightLast: true,
    },
    hints: [
      '알파벳 순서(A B C D E F G H ... O P Q R S)에서 F, R, G, H보다 각각 3칸 앞선 글자를 찾으세요.',
      'F에서 3칸 앞은 C(F→E→D→C)이고, R에서 3칸 앞은 O(R→Q→P→O)입니다.',
      'G에서 3칸 앞은 D, H에서 3칸 앞은 E이므로 해독된 키워드는 CODE입니다.',
    ],
    explanation: 'F(-3)=C, R(-3)=O, G(-3)=D, H(-3)=E → 복구 키워드는 CODE입니다.',
    rewardClueId: 'clue-z2',
  },

  // ==========================================
  // ZONE 3: 알고리즘 실험실 (알고리즘 & 논리적 사고)
  // ==========================================
  {
    id: 'z3-p1',
    zoneId: 'zone3',
    title: '탐사 로봇 격자 이동',
    category: '명령어 순서 맞추기',
    description: '소형 탐사 로봇이 장애물(■)을 피해 시작 위치(S)에서 충전 패드(G)까지 이동해야 합니다.',
    prompt:
      '로봇은 처음에 오른쪽(동쪽, →)을 보고 있습니다. 오른쪽 그림을 보고 목표 지점까지 이동할 수 있는 정확한 명령어 블록 순서를 배열하세요.',
    inputKind: 'sequence',
    sequencePool: [
      '앞으로 2칸',
      '오른쪽 회전(90°)',
      '앞으로 2칸(2차)',
      '왼쪽 회전(90°)',
      '앞으로 1칸',
    ],
    answer: '앞으로 2칸 -> 오른쪽 회전(90°) -> 앞으로 2칸(2차) -> 왼쪽 회전(90°) -> 앞으로 1칸',
    diagram: {
      type: 'robot-grid',
      size: 4,
      start: [0, 0],
      goal: [2, 3],
      obstacles: [
        [1, 0],
        [1, 1],
        [3, 2],
        [0, 3],
      ],
      startDir: 'E',
    },
    hints: [
      '시작점 (0행, 0열)에서 바로 아래(1행, 0열)는 장애물이 막고 있어 오른쪽으로 먼저 2칸 가야 합니다.',
      '(0행, 2열)까지 간 뒤 아래쪽(남쪽)으로 내려가려면 오른쪽으로 90° 회전해 2칸 이동하면 (2행, 2열)에 도착합니다.',
      '마지막으로 왼쪽 90° 회전 후 앞으로 1칸 이동하면 목표 G(2행, 3열)에 도착합니다. 순서: 앞으로 2칸 → 오른쪽 회전(90°) → 앞으로 2칸(2차) → 왼쪽 회전(90°) → 앞으로 1칸.',
    ],
    explanation: '격자 경로를 따라 방향 전환과 직진 거리를 단계별로 분해해 명령을 나열합니다.',
    rewardClueId: 'clue-z3',
  },
  {
    id: 'z3-p2',
    zoneId: 'zone3',
    title: '조건문 분기 결과 예측',
    category: '조건문에 따른 결과 예측',
    description: '실험실의 자동 분류 게이트가 입력값에 따라 다른 전력량을 출력합니다.',
    prompt:
      '코드에 X = 14, Y = 9를 입력했을 때, 마지막에 출력되는 Z의 값은 얼마인지 숫자로 입력하세요.',
    inputKind: 'text',
    answer: '28',
    acceptedAnswers: ['28'],
    diagram: {
      type: 'code-block',
      language: 'Pseudocode',
      lines: [
        { num: 1, code: 'X = 14, Y = 9' },
        { num: 2, code: 'if (X > 10 and Y < 10):' },
        { num: 3, code: '    Z = X * 2' },
        { num: 4, code: 'else if (X > 10):' },
        { num: 5, code: '    Z = X + Y' },
        { num: 6, code: 'else:' },
        { num: 7, code: '    Z = Y * 3' },
        { num: 8, code: 'print(Z)' },
      ],
    },
    hints: [
      '2번 줄의 조건 `(X > 10 and Y < 10)`이 참인지 거짓인지 먼저 판단하세요. 두 조건이 모두 참이어야 `and`가 참이 됩니다.',
      'X=14는 10보다 크고, Y=9는 10보다 작으므로 2번 줄 조건이 참입니다! `if`가 참이면 아래의 `else if`나 `else`는 실행되지 않습니다.',
      '3번 줄 `Z = X * 2`만 실행되므로 `14 * 2 = 28`이 출력됩니다.',
    ],
    explanation: '첫 번째 if 조건(14>10 그리고 9<10)이 참이므로 Z = 14 * 2 = 28만 실행됩니다.',
    rewardClueId: 'clue-z3',
  },
  {
    id: 'z3-p3',
    zoneId: 'zone3',
    title: '최적 에너지 이동 경로',
    category: '최적 이동 경로 찾기',
    description: '출발지 S에서 목적지 E까지 전력을 전송하려고 합니다. 단, 보안 점검소 C를 반드시 거쳐야 합니다.',
    prompt:
      '노드 S에서 출발해 반드시 C를 거친 뒤 E에 도착하는 경로 중, 총 비용(숫자 합)이 가장 적은 최소 비용은 얼마인가요?',
    inputKind: 'text',
    answer: '15',
    acceptedAnswers: ['15'],
    diagram: {
      type: 'network-graph',
      nodes: [
        { id: 'S', x: 50, y: 95, label: '출발 S' },
        { id: 'A', x: 145, y: 40, label: 'A' },
        { id: 'B', x: 145, y: 150, label: 'B' },
        { id: 'C', x: 250, y: 95, required: true, label: '필수 C' },
        { id: 'E', x: 350, y: 95, label: '도착 E' },
      ],
      edges: [
        { from: 'S', to: 'A', weight: 4 },
        { from: 'S', to: 'B', weight: 7 },
        { from: 'A', to: 'C', weight: 5 },
        { from: 'B', to: 'C', weight: 3 },
        { from: 'A', to: 'E', weight: 12 },
        { from: 'C', to: 'E', weight: 6 },
      ],
    },
    hints: [
      '문제를 두 구간으로 나누어 생각해 보세요: (1) S에서 C까지 가는 최소 비용 + (2) C에서 E까지 가는 최소 비용.',
      'S → A → C 비용은 4 + 5 = 9이고, S → B → C 비용은 7 + 3 = 10입니다. C → E 비용은 6입니다.',
      '최소 경로는 S → A → C → E 이며, 총 비용은 4 + 5 + 6 = 15입니다.',
    ],
    explanation: 'S→A→C(9) + C→E(6) = 15가 필수 경유지 C를 지나는 최적 경로입니다.',
    rewardClueId: 'clue-z3',
  },
  {
    id: 'z3-bypass',
    zoneId: 'zone3',
    title: '배터리 충전 반복문 우회',
    category: '우회 반복문 추론',
    isBypass: true,
    description: '오류 격리 구역으로 통하는 우회 잠금 장치입니다. 반복문이 멈추는 횟수를 정확히 예측하세요.',
    prompt:
      '초기 에너지가 10일 때, `while 에너지 < 50: 에너지 = 에너지 + 12` 반복문은 총 몇 번 실행된 후 종료될까요?',
    inputKind: 'choice',
    options: ['3번', '4번', '5번', '6번'],
    answer: '4번',
    diagram: {
      type: 'code-block',
      language: 'Pseudocode',
      lines: [
        { num: 1, code: 'energy = 10' },
        { num: 2, code: 'count = 0' },
        { num: 3, code: 'while (energy < 50):' },
        { num: 4, code: '    energy = energy + 12' },
        { num: 5, code: '    count = count + 1' },
      ],
    },
    hints: [
      '반복할 때마다 energy 값이 어떻게 변하는지 1회차부터 순서대로 적어 보세요.',
      '1회 후: 22, 2회 후: 34, 3회 후: 46. 아직 50보다 작으므로 한 번 더 돕니다!',
      '4회 후: 46 + 12 = 58이 되어 `58 < 50`이 거짓이 되므로 총 4번 실행 후 종료됩니다.',
    ],
    explanation: '10 → 22(1) → 34(2) → 46(3) → 58(4)로 4번째 반복 후 조건이 거짓이 됩니다.',
    rewardClueId: 'clue-z3',
  },

  // ==========================================
  // ZONE 4: 오류 격리 구역 (디버깅 & 문제 해결)
  // ==========================================
  {
    id: 'z4-p1',
    zoneId: 'zone4',
    title: '무한 루프 버그 격리',
    category: '잘못된 코드 찾기',
    description: '1부터 10까지 짝수의 합을 구하는 프로그램이 멈추지 않고 계속 실행되는 오류가 발생했습니다.',
    prompt:
      '아래 코드 중 무한 루프를 일으키는 잘못된 코드가 있는 줄 번호(숫자만)를 입력하세요.',
    inputKind: 'text',
    answer: '5',
    acceptedAnswers: ['5'],
    diagram: {
      type: 'code-block',
      language: 'Python-like',
      lines: [
        { num: 1, code: 'n = 2' },
        { num: 2, code: 'total = 0' },
        { num: 3, code: 'while n <= 10:' },
        { num: 4, code: '    total = total + n' },
        { num: 5, code: '    n = n - 2' },
        { num: 6, code: 'print(total)' },
      ],
    },
    hints: [
      'while 문이 끝나려면 변수 n이 10보다 커져야 합니다. n의 값이 어떻게 변하고 있는지 보세요.',
      '2에서 시작한 n에 매번 2를 더해야 4, 6, 8, 10, 12가 되어 멈출 수 있습니다.',
      '5번 줄 `n = n - 2` 때문에 n이 2, 0, -2... 로 계속 작아져 `n <= 10`이 영원히 참이 됩니다.',
    ],
    explanation: '5번 줄을 `n = n + 2`로 수정해야 n이 증가하여 반복문이 정상 종료됩니다.',
    rewardClueId: 'clue-z4',
  },
  {
    id: 'z4-p2',
    zoneId: 'zone4',
    title: '경보 임계값 논리 오류',
    category: '논리적 오류 수정하기',
    description: '원자로 온도가 80도 이상이면 무조건 경보("DANGER")를 울려야 하는 프로그램이 경보를 울리지 못했습니다.',
    prompt:
      '온도가 80도일 때 경보가 울리지 않는 이유를 해결하려면 2번 줄의 조건식을 어떻게 고쳐야 할까요?',
    inputKind: 'choice',
    options: [
      'temp >= 80 or humidity < 20',
      'temp > 80 and humidity <= 20',
      'temp < 80 and humidity < 20',
      'temp == 80 and humidity > 20',
    ],
    answer: 'temp >= 80 or humidity < 20',
    diagram: {
      type: 'code-block',
      language: 'Python-like',
      lines: [
        { num: 1, code: '# 목표: 온도가 80도 이상이면 무조건 DANGER 출력' },
        { num: 2, code: 'if temp > 80 and humidity < 20:' },
        { num: 3, code: '    print("DANGER")' },
        { num: 4, code: 'else:' },
        { num: 5, code: '    print("SAFE")' },
      ],
    },
    hints: [
      '원래 코드에는 두 가지 문제가 있습니다. 80도 자체를 포함하는 부등호(`>=`)와, 습도와 상관없이 울리게 하는 논리 연산자를 확인하세요.',
      '`>` 대신 `>=`를 써야 80도가 포함되며, `and` 대신 `or`를 써야 습도와 무관하게 온도가 80 이상일 때 참이 됩니다.',
      '따라서 `temp >= 80 or humidity < 20` 으로 수정해야 목표 조건을 만족합니다.',
    ],
    explanation: '경계값 80을 포함하려면 `>=`가 필요하고, 온도가 80 이상일 때 무조건 실행되려면 `or` 조건을 사용해야 합니다.',
    rewardClueId: 'clue-z4',
  },
  {
    id: 'z4-p3',
    zoneId: 'zone4',
    title: '반복문 초기화 위치 버그',
    category: '반복문과 조건문의 오류 찾기',
    description: '점수 목록 `[45, 82, 91, 68, 95]`에서 80점 이상인 학생 수를 세는 코드가 항상 1만 출력합니다.',
    prompt:
      '이 코드가 80점 이상인 학생 수(3명) 대신 1을 출력하는 이유는 몇 번 줄의 위치 때문인가요? (줄 번호 숫자만 입력)',
    inputKind: 'text',
    answer: '3',
    acceptedAnswers: ['3'],
    diagram: {
      type: 'code-block',
      language: 'Python-like',
      lines: [
        { num: 1, code: 'scores = [45, 82, 91, 68, 95]' },
        { num: 2, code: 'for s in scores:' },
        { num: 3, code: '    count = 0' },
        { num: 4, code: '    if s >= 80:' },
        { num: 5, code: '        count = count + 1' },
        { num: 6, code: 'print(count)' },
      ],
    },
    hints: [
      '반복문(for) 안쪽에 들어있는 명령은 리스트의 원소를 하나 검사할 때마다 매번 다시 실행됩니다.',
      '누적 개수를 세는 변수 `count`가 반복이 돌 때마다 0으로 리셋되고 있지 않나요?',
      '3번 줄 `count = 0`이 `for` 루프 안에 있어 매 점수마다 0으로 초기화됩니다. 2번 줄 위로 빼내야 합니다.',
    ],
    explanation: '초기화 코드(`count = 0`)가 반복문(3번 줄) 안에 있으면 마지막 원소(95)만 1로 카운트됩니다.',
    rewardClueId: 'clue-z4',
  },
  {
    id: 'z4-bypass',
    zoneId: 'zone4',
    title: '연산자 우선순위 긴급 수정',
    category: '우회 디버깅',
    isBypass: true,
    description: '최종 시스템 문 옆 비상 디버깅 패널입니다. 수식 우선순위 오류를 찾아내면 문이 열립니다.',
    prompt:
      '세 수 `a = 60, b = 90, c = 90`의 평균을 구하려고 `avg = a + b + c / 3`을 실행했을 때, 잘못 계산되어 나오는 avg 값은 얼마인가요?',
    inputKind: 'text',
    answer: '180',
    acceptedAnswers: ['180'],
    diagram: {
      type: 'code-block',
      language: 'Python-like',
      lines: [
        { num: 1, code: 'a = 60, b = 90, c = 90' },
        { num: 2, code: 'avg = a + b + c / 3' },
        { num: 3, code: 'print(avg)  # 원래 기대값: 80' },
      ],
    },
    hints: [
      '수학과 프로그래밍 모두 괄호가 없으면 덧셈(+)보다 나눗셈(/)을 먼저 계산합니다.',
      '`c / 3` 즉 `90 / 3 = 30`이 먼저 계산된 뒤 앞의 두 수와 더해집니다.',
      '`60 + 90 + 30 = 180`이 출력됩니다. 올바르게 고치려면 `(a + b + c) / 3`으로 괄호를 묶어야 합니다.',
    ],
    explanation: '나눗셈 우선순위 때문에 `60 + 90 + (90 / 3) = 180`이 계산되는 전형적인 괄호 누락 버그입니다.',
    rewardClueId: 'clue-z4',
  },

  // ==========================================
  // ZONE 5: 최종 시스템 (단서 종합 추리 3개 + 최종 복구)
  // ==========================================
  {
    id: 'z5-p1',
    zoneId: 'zone5',
    title: '보안 토큰 해시 합성',
    category: '단서 종합 추리 I',
    description: 'ZONE 1과 ZONE 2에서 수집한 단서를 결합해 첫 번째 마스터 인증 값을 생성해야 합니다.',
    prompt:
      '[단서 수첩]의 ZONE 1 단서(A = 7)와 ZONE 2 단서(키워드 = CODE)를 사용하세요. 키워드 CODE 각 글자의 알파벳 순서(A=1, B=2, C=3, D=4, E=5, ..., O=15)를 모두 더한 값에 A를 곱하면 얼마인가요?',
    inputKind: 'text',
    answer: '189',
    acceptedAnswers: ['189'],
    diagram: {
      type: 'logic-cards',
      cards: [
        {
          title: '필요 단서 및 계산 공식',
          items: [
            '• ZONE 1 단서: 제어 숫자 A = 7',
            '• ZONE 2 단서: 키워드 = C - O - D - E',
            '• 알파벳 순번: C=3, O=15, D=4, E=5',
            '• 공식: (C + O + D + E) × A',
          ],
        },
      ],
    },
    hints: [
      '먼저 키워드 CODE 각 글자의 순번인 3, 15, 4, 5를 모두 더해 보세요.',
      '3 + 15 + 4 + 5 = 27 입니다. 이제 여기에 ZONE 1 단서 A = 7을 곱하면 됩니다.',
      '27 × 7 = 189 입니다.',
    ],
    explanation: 'CODE의 알파벳 합(3+15+4+5=27) × 제어 숫자 A(7) = 189입니다.',
  },
  {
    id: 'z5-p2',
    zoneId: 'zone5',
    title: '프로토콜 분기 검증',
    category: '단서 종합 추리 II',
    description: 'ZONE 3과 ZONE 4의 단서를 최종 시스템 복구 알고리즘에 대입하여 실행해야 할 복구 모드를 찾아냅니다.',
    prompt:
      'ZONE 3 단서(COST = 15)와 ZONE 4 단서(LINE = 3)를 아래 조건문에 대입했을 때, 최종적으로 선택되는 프로토콜 이름을 고르세요.',
    inputKind: 'choice',
    options: ['ALPHA', 'BETA', 'GAMMA', 'DELTA'],
    answer: 'BETA',
    diagram: {
      type: 'code-block',
      language: 'Recovery Logic',
      lines: [
        { num: 1, code: '# COST = 15 (Zone 3), LINE = 3 (Zone 4)' },
        { num: 2, code: 'if (COST < 12 and LINE == 3):' },
        { num: 3, code: '    protocol = "ALPHA"' },
        { num: 4, code: 'else if (COST + LINE * 2 == 21):' },
        { num: 5, code: '    protocol = "BETA"' },
        { num: 6, code: 'else if (COST > 10):' },
        { num: 7, code: '    protocol = "GAMMA"' },
        { num: 8, code: 'else: protocol = "DELTA"' },
      ],
    },
    hints: [
      'COST = 15, LINE = 3을 2번 줄부터 순서대로 대입해 참/거짓을 판별해 보세요.',
      '2번 줄은 `15 < 12`가 거짓이므로 건너뜁니다. 4번 줄 `15 + 3 * 2`를 곱셈 우선순위에 따라 계산해 보세요.',
      '4번 줄은 `15 + 6 = 21`이므로 참입니다! 따라서 프로토콜 `BETA`가 선택됩니다.',
    ],
    explanation: '2번 줄 거짓 → 4번 줄 `15 + (3×2) = 21` 참 → protocol = "BETA"가 실행됩니다.',
  },
  {
    id: 'z5-p3',
    zoneId: 'zone5',
    title: '코어 모듈 복구 순서 추리',
    category: '단서 종합 추리 III',
    description: 'BLACK BOX의 4개 핵심 모듈(전원, 메모리, 보안, 통신)을 충돌 없이 복구할 유일한 순서를 논리적으로 분해해야 합니다.',
    prompt:
      '4가지 논리 단서를 모두 만족하도록 코어 모듈 복구 순서를 클릭해 배열하세요.',
    inputKind: 'sequence',
    sequencePool: ['전원 코어', '보안 코어', '메모리 코어', '통신 코어'],
    answer: '전원 코어 -> 메모리 코어 -> 보안 코어 -> 통신 코어',
    diagram: {
      type: 'logic-cards',
      cards: [
        {
          title: '마스터 코어 동기화 조건',
          items: [
            '1. [전원 코어]는 가장 첫 번째 순서에 복구되어야 합니다.',
            '2. [통신 코어]는 [보안 코어]가 복구된 이후에야 작동할 수 있습니다.',
            '3. [메모리 코어]는 [전원 코어] 바로 다음이자, [보안 코어]보다 먼저 복구됩니다.',
          ],
        },
      ],
    },
    hints: [
      '1번 조건에 따라 1번째는 무조건 [전원 코어]입니다. 3번 조건에서 전원 바로 다음이 누구인지 확인하세요.',
      '전원 코어 → 메모리 코어 순서가 확정되고, 보안 코어는 메모리보다 뒤이자 통신보다 앞입니다.',
      '정확한 순서는 [전원 코어] → [메모리 코어] → [보안 코어] → [통신 코어]입니다.',
    ],
    explanation: '조건 1·3에 의해 전원(1)→메모리(2)가 정해지고, 조건 2·3에 의해 보안(3)→통신(4)이 확정됩니다.',
  },
  {
    id: 'z5-final',
    zoneId: 'zone5',
    title: 'BLACK BOX 최종 시스템 복구',
    category: '최종 마스터 복구',
    isFinalCore: true,
    description: '연구소 중앙의 BLACK BOX 퀀텀 코어가 마지막 마스터 복구 코드를 기다리고 있습니다.',
    prompt:
      '지금까지 모은 4개의 구역 단서 숫자 [ A=7, CODE의 글자수=4, COST=15, LINE=3 ]를 모두 더한 마스터 복구 코드(숫자)를 입력하여 시스템을 완전히 복구하세요!',
    inputKind: 'text',
    answer: '29',
    acceptedAnswers: ['29'],
    diagram: {
      type: 'logic-cards',
      cards: [
        {
          title: '최종 시스템 복구 공식',
          items: [
            '• ZONE 1 제어 숫자 (A) = 7',
            '• ZONE 2 키워드 글자 수 (CODE) = 4',
            '• ZONE 3 경로 비용 (COST) = 15',
            '• ZONE 4 오류 라인 (LINE) = 3',
            '• 마스터 코드 = 7 + 4 + 15 + 3',
          ],
        },
      ],
    },
    hints: [
      '4개 구역에서 수집한 네 개의 숫자 값을 차근차근 더해 보세요.',
      '7 + 4 = 11이고, 여기에 15를 더하면 26이 됩니다.',
      '마지막으로 3을 더하면 29가 됩니다. 29를 입력하면 BLACK BOX가 완전히 복구됩니다!',
    ],
    explanation: '7 + 4 + 15 + 3 = 29. 모든 구역의 데이터가 하나로 통합되어 BLACK BOX 시스템이 정상 복구되었습니다!',
  },
];
