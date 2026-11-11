// Detail-page guide content shared by the server renderer (api/company-page.js)
// and the React client (src/CompanyGuide.tsx) so both produce the same text.

const text = (value) => (typeof value === 'string' ? value.trim() : '')

const NAME_SUFFIX_PATTERN = /\s*(?:사칭\s*사기|사기\s*사칭|사기\s*의심|사칭|사기)\s*$/u

// "Bookook 사기 사칭" -> "Bookook"; keeps the original name when stripping would empty it.
export const getCompanyBaseName = (name) => {
  const original = text(name)
  let base = original

  for (let i = 0; i < 3; i += 1) {
    const next = base.replace(NAME_SUFFIX_PATTERN, '').trim()
    if (!next || next === base) break
    base = next
  }

  return base || original
}

const hashString = (value) => {
  let hash = 0
  for (const char of String(value)) {
    hash = (hash * 31 + char.codePointAt(0)) >>> 0
  }
  return hash
}

const pick = (items, seed) => items[seed % items.length]

const CATEGORIES = [
  {
    key: 'romance',
    pattern: /로맨스|연애|결혼|데이팅|교제/u,
    label: '로맨스스캠',
    flow: [
      '메신저나 SNS로 친분을 쌓은 뒤 투자·송금·통관비 등을 이유로 돈을 요구하는 흐름이 반복적으로 보고됩니다.',
      '얼굴을 확인할 수 없거나 영상통화를 피하면서 특정 투자 사이트나 앱으로 이동을 권하는 경우가 많습니다.',
    ],
    signals: [
      '직접 만난 적 없는 상대가 투자 수익을 보장하며 특정 사이트 가입을 권했다',
      '영상통화를 피하거나 해외 체류·군인·의사 등 신분을 내세웠다',
      '수익 출금 전에 세금·보증금을 먼저 내라고 했다',
      '대화 앱을 바꾸자고 하거나 대화 삭제를 요구했다',
    ],
    prepare: [
      '상대 프로필 화면과 처음부터 마지막까지의 대화 전체',
      '송금한 계좌·지갑 주소와 이체 확인증',
      '상대가 안내한 사이트 주소와 가입·출금 화면 캡처',
      '상대가 보낸 사진·신분증 등 자료 원본',
    ],
    faq: [
      {
        q: '상대가 아직 연락을 하는데 계속 대화해도 되나요?',
        a: '추가 송금 요구에는 응하지 않는 것이 우선입니다. 대화방을 나가거나 차단하기 전에 대화 전체를 저장해 두고, 이후 연락 방식은 상담에서 함께 정하는 것이 안전합니다.',
      },
    ],
  },
  {
    key: 'sidejob',
    pattern: /부업|팀\s*미션|미션|쇼핑몰|재택|알바|리뷰|좋아요|공구/u,
    label: '부업·팀미션 사기',
    flow: [
      '쇼핑몰 주문·리뷰 작성 같은 간단한 부업으로 소액 수익을 먼저 지급해 신뢰를 쌓은 뒤, 팀미션·고액 미션을 이유로 입금을 늘리게 하는 구조가 반복적으로 보고됩니다.',
      '미션 실수나 정산 오류를 이유로 “추가 입금해야 원금과 수익을 돌려받을 수 있다”고 안내하는 경우가 많습니다.',
    ],
    signals: [
      '처음 몇 번은 소액 수익이 실제로 입금됐다',
      '팀미션에서 다른 참여자 때문에 정산이 막혔다며 추가 입금을 요구했다',
      '출금하려면 수수료·보증금·등급 상향 비용을 내라고 했다',
      '입금 계좌가 매번 다른 개인 명의였다',
    ],
    prepare: [
      '부업 안내 문자·광고와 처음 연락이 온 경로',
      '미션 화면, 주문 내역, 정산 화면 캡처',
      '입금한 계좌별 이체 확인증(받는 사람 명의 포함)',
      '오픈채팅·텔레그램 등 대화 전체와 참여자 목록',
    ],
    faq: [
      {
        q: '처음에 수익을 받았는데 그것도 문제가 되나요?',
        a: '초기 소액 수익 지급은 신뢰를 얻기 위해 흔히 쓰이는 방식입니다. 받은 금액도 피해 경위 정리에 필요하니 입금·출금 내역을 모두 함께 정리해 주세요.',
      },
    ],
  },
  {
    key: 'loan',
    pattern: /대출|캐피탈|저금리|대환|신용\s*등급/u,
    label: '대출·캐피탈 사칭',
    flow: [
      '대출 실행 전에 보증금·전산작업비·신용등급 상향 비용 등을 먼저 받는 방식이 반복적으로 보고됩니다.',
      '저금리 대환을 이유로 기존 대출을 특정 계좌로 상환하게 하거나 체크카드·통장을 요구하는 경우도 있습니다.',
    ],
    signals: [
      '대출 실행 전에 수수료나 보증금을 개인 계좌로 보내라고 했다',
      '저금리 전환을 위해 기존 대출을 먼저 갚으라고 했다',
      '대출 승인을 이유로 체크카드·통장·OTP를 보내 달라고 했다',
      '상담이 메신저로만 이뤄졌다',
    ],
    prepare: [
      '대출 안내 문자·광고 화면과 상담 대화 전체',
      '보증금·수수료를 보낸 이체 확인증',
      '안내받은 상호·등록번호 캡처(금융감독원 파인에서 등록 여부 확인 가능)',
      '체크카드·통장을 넘겼다면 넘긴 날짜와 방법',
    ],
    faq: [
      {
        q: '체크카드나 통장을 넘겼는데 저도 처벌받나요?',
        a: '경위에 따라 판단이 달라질 수 있으므로 넘긴 날짜와 방법, 받은 안내를 그대로 정리해 바로 상담을 받는 것이 좋습니다. 해당 계좌가 더 쓰이지 않도록 할 조치도 함께 확인해야 합니다.',
      },
    ],
  },
  {
    key: 'futures',
    pattern: /해외\s*선물|선물\s*옵션|(?<![A-Za-z])FX(?![A-Za-z])|외환|마진\s*거래/u,
    label: '해외선물·FX 투자 사기',
    flow: [
      '해외선물·FX 리딩을 내세워 자체 HTS나 앱 설치를 유도하고, 화면상 수익을 보여 준 뒤 출금 단계에서 추가 비용을 요구하는 흐름이 반복적으로 보고됩니다.',
      '국내에서 해외선물 거래는 금융투자업 인가를 받은 증권사·선물사를 통해야 하며, 개인 계좌로 증거금을 받는 곳은 정상 거래로 보기 어렵습니다.',
    ],
    signals: [
      '증권사가 아닌 곳에서 받은 HTS·앱으로 거래했다',
      '증거금을 개인 또는 법인 명의 일반 계좌로 입금했다',
      '수익이 났지만 출금하려면 세금·수수료를 먼저 내라고 했다',
      '손실을 만회하자며 증거금 증액을 권유했다',
    ],
    prepare: [
      'HTS·앱 설치 경로와 로그인 화면, 잔고·거래 내역 캡처',
      '증거금 입금 계좌별 이체 확인증',
      '리딩방 대화와 운영자 프로필',
      '출금 신청 화면과 거절·지연 안내',
    ],
    faq: [
      {
        q: '앱 화면에는 수익이 보이는데 실제로 출금이 되지 않습니다.',
        a: '화면의 잔고가 실제 거래 결과가 아닐 수 있습니다. 추가 비용 입금은 멈추고, 잔고 화면과 출금 거절 안내를 캡처해 입금 내역과 함께 정리해 주세요.',
      },
    ],
  },
  {
    key: 'coin',
    pattern: /코인|가상\s*자산|가상\s*화폐|암호\s*화폐|거래소|비트|USDT|테더|이더리움|토큰|(?<![A-Za-z])NFT(?![A-Za-z])|채굴|전자\s*지갑|환전/u,
    label: '코인·가상자산 사기',
    flow: [
      '거래소나 코인 투자 플랫폼을 사칭해 가입과 입금을 유도하고, 내부 화면의 수치로 수익을 보여 준 뒤 출금 단계에서 세금·수수료를 추가로 요구하는 흐름이 반복적으로 보고됩니다.',
      '국내 원화 계좌로 입금하게 한 뒤 코인으로 바꿔 보내게 하거나, 특정 지갑 주소로 직접 전송하게 하는 경우가 많습니다.',
    ],
    signals: [
      '금융정보분석원(FIU)에 신고되지 않은 거래소·플랫폼이었다',
      '잔고는 늘어나는데 출금하려면 세금·수수료·보증금을 먼저 내라고 했다',
      '계정 동결 해제를 이유로 추가 입금을 요구했다',
      '사이트 주소가 자주 바뀌었다',
    ],
    prepare: [
      '입금한 원화 계좌 이체 확인증과 코인 전송 내역(TXID)',
      '전송한 지갑 주소와 사용한 거래소 내역',
      '플랫폼 주소(변경된 주소 포함)와 잔고·출금 화면 캡처',
      '가입을 권유한 사람과의 대화 전체',
    ],
    faq: [
      {
        q: '코인으로 보낸 돈도 추적할 수 있나요?',
        a: '전송 내역(TXID)과 지갑 주소가 있으면 자금 흐름을 확인할 수 있는 경우가 있습니다. 다만 해외 거래소나 개인 지갑으로 빠져나간 경우 회수가 어려울 수 있어, 자료를 먼저 확인한 뒤 가능한 절차를 안내합니다.',
      },
    ],
  },
  {
    key: 'leading',
    pattern: /리딩|주식|종목|증권|자산\s*운용|투자\s*정보|공모주|블록딜|상장|자동\s*매매|(?<![A-Za-z])AI(?![A-Za-z])|알고리즘|퀀트|투자\s*자문|애널리스트|전문가/u,
    label: '주식·리딩방 투자 사기',
    flow: [
      '주식 리딩방이나 투자 정보 제공을 내세워 신뢰를 쌓은 뒤, 공모주·블록딜·자동매매 등 “특별한 기회”를 이유로 별도 플랫폼 가입과 입금을 유도하는 흐름이 반복적으로 보고됩니다.',
      '실제 증권사 계좌가 아닌 자체 앱·사이트에서 수익을 보여 주고, 출금 시 세금·수수료를 이유로 추가 입금을 요구하는 경우가 많습니다.',
    ],
    signals: [
      '증권사 계좌가 아닌 별도 앱·사이트에서 거래했다',
      '원금 보장이나 고수익 확정을 약속했다',
      '공모주·블록딜 배정을 이유로 큰 금액 입금을 요구했다',
      '출금하려면 세금·수수료를 먼저 내라고 했다',
    ],
    prepare: [
      '리딩방 대화 전체와 운영자·매니저 프로필',
      '입금한 계좌별 이체 확인증',
      '앱·사이트 주소와 잔고·출금 신청 화면 캡처',
      '수익 인증 자료나 투자 권유 문구 캡처',
    ],
    faq: [
      {
        q: '리딩방 운영자가 유명 증권사·운용사 직원이라고 했습니다.',
        a: '실제 회사 이름이 도용되는 경우가 많습니다. 해당 회사 대표번호로 직접 확인하고, 금융감독원 파인(FINE)에서 제도권 금융회사·유사투자자문업자 여부를 조회해 볼 수 있습니다.',
      },
    ],
  },
]

const GENERAL_CATEGORY = {
  key: 'general',
  label: '금융사기',
  flow: [
    '처음에는 소액 수익이나 혜택으로 신뢰를 쌓은 뒤, 수익 출금이나 문제 해결을 이유로 추가 입금을 요구하는 흐름이 반복적으로 보고됩니다.',
    '입금 계좌가 개인 명의이거나 자주 바뀌고, 연락이 메신저로만 이뤄지는 경우가 많습니다.',
  ],
  signals: [
    '원금 보장이나 확정 수익을 약속했다',
    '출금하려면 세금·수수료·보증금을 먼저 내라고 했다',
    '입금 계좌가 개인 명의이거나 매번 달랐다',
    '연락이 메신저로만 이뤄졌다',
  ],
  prepare: [
    '처음 연락을 받은 경로와 대화 전체',
    '송금한 계좌별 이체 확인증',
    '안내받은 사이트·앱 주소와 화면 캡처',
    '출금 신청과 거절·지연 안내 캡처',
  ],
  faq: [],
}

const COMMON_STEPS = [
  {
    title: '추가 송금 중단과 자료 보존',
    body: '더 보내지 않는 것이 먼저입니다. 대화방을 나가거나 앱을 지우기 전에 화면부터 저장하고, 송금 시각을 분 단위까지 적어 둡니다.',
  },
  {
    title: '지급정지·보전 조치 검토',
    body: '받는 계좌가 확인되면 통신사기피해환급법상 지급정지 대상인지 먼저 살펴봅니다. 사기 유형에 따라 대상이 아닐 수 있어, 그 경우 가압류 등 민사 보전 조치를 함께 검토합니다.',
  },
  {
    title: '형사 고소와 민사 청구 구분',
    body: '형사 절차의 목적은 처벌이고, 보낸 돈을 돌려받는 일은 손해배상·부당이득반환 청구와 집행으로 따로 진행합니다. 두 절차를 함께 설계해야 시간을 줄일 수 있습니다.',
  },
  {
    title: '실익 검토 후 진행 결정',
    body: '예상 비용과 기간, 상대방 재산 확인 결과를 놓고 진행 여부를 정합니다. 실익이 낮다면 그 사정도 그대로 안내합니다.',
  },
]

const COMMON_FAQ = [
  {
    q: '경찰에 신고하면 상대 계좌가 바로 막히나요?',
    a: '신고만으로 계좌가 자동으로 막히지는 않습니다. 지급정지는 별도 요건과 절차가 있고, 대상이 아니면 법원의 가압류 결정이 필요할 수 있습니다.',
  },
  {
    q: '피해 금액이 크지 않아도 상담할 수 있나요?',
    a: '가능합니다. 피해 금액과 예상 비용을 비교해 진행할 실익이 있는지부터 안내합니다.',
  },
  {
    q: '가족이 대신 상담을 받아도 되나요?',
    a: '가능합니다. 다만 실제 송금한 분의 자료와 경위 확인이 필요하니 피해자 본인과 연락할 수 있는 방법을 함께 남겨 주세요.',
  },
]

const INTRO_VARIANTS = [
  (base, label) =>
    `‘${base}’ 이름으로 연락을 받고 돈을 보냈다면, 추가 송금을 멈추고 송금 수단과 날짜부터 정리해 두세요. 아래는 ${label} 유형에서 확인할 신호와 피해금 회수를 위해 검토하는 절차입니다.`,
  (base, label) =>
    `‘${base}’ 관련 거래에서 출금이 막히거나 추가 입금을 요구받았다면 ${label} 피해를 의심해 볼 수 있습니다. 확인할 신호, 준비할 자료, 피해금 회수 절차를 순서대로 정리했습니다.`,
  (base, label) =>
    `‘${base}’ 명칭이 등장한 ${label} 의심 사례입니다. 이미 송금했다면 시간이 지날수록 회수할 수 있는 재산이 줄어들 수 있으니, 아래 순서대로 자료를 정리하고 대응 방향을 확인하세요.`,
]

export const getCompanyCategory = (item) => {
  const primary = `${text(item?.name)} ${text(item?.service)}`
  const secondary = text(item?.description)

  return (
    CATEGORIES.find((category) => category.pattern.test(primary)) ??
    CATEGORIES.find((category) => category.pattern.test(secondary)) ??
    GENERAL_CATEGORY
  )
}

export const getCompanyGuide = (item) => {
  const name = text(item?.name)
  const base = getCompanyBaseName(name)
  const category = getCompanyCategory(item)
  const seed = hashString(text(item?.id) || name)

  return {
    baseName: base,
    categoryKey: category.key,
    categoryLabel: category.label,
    intro: pick(INTRO_VARIANTS, seed)(base, category.label),
    flowTitle: `${category.label}: ‘${base}’ 같은 명칭이 등장하는 흐름`,
    flow: category.flow,
    signalsTitle: `‘${base}’ 관련 거래에서 확인할 신호`,
    signals: category.signals,
    prepareTitle: `‘${base}’ 건, 상담 전에 챙길 자료`,
    prepare: category.prepare,
    stepsTitle: '피해금 회수를 위해 검토하는 순서',
    steps: COMMON_STEPS,
    faqTitle: `‘${base}’ 관련 자주 묻는 질문`,
    faq: [...category.faq, ...COMMON_FAQ],
    disclaimer: `이 페이지는 ‘${base}’ 명칭과 관련해 접수·확인된 피해 정황을 바탕으로 한 안내입니다. 같은 이름을 쓰는 정상 업체·기관·인물을 사기 주체로 지칭하지 않으며, 명칭이 도용되었을 가능성도 있습니다. 일반적인 법률 정보이며 개별 사건의 결과를 보장하지 않습니다.`,
  }
}

const SEO_TITLE_SUFFIX = '피해 대응·피해금 회수 절차 | 법무법인 나란'

export const getCompanyCaseSeoTitle = (item) => `${text(item?.name)} ${SEO_TITLE_SUFFIX}`

export const getCompanyCaseSeoDescription = (item) => {
  const { baseName, categoryLabel } = getCompanyGuide(item)
  return `${baseName} 관련 ${categoryLabel} 피해가 의심된다면 추가 송금을 멈추고 지급정지·가압류·민사 청구 가능성을 확인하세요. 확인할 신호와 준비할 자료를 법무법인 나란이 정리했습니다.`
}

export const getCompanyCaseSeoKeywords = (item) => {
  const { baseName, categoryLabel } = getCompanyGuide(item)
  return [
    text(item?.name),
    `${baseName} 사기`,
    `${baseName} 피해`,
    `${baseName} 출금`,
    `${baseName} 환불`,
    text(item?.service),
    categoryLabel,
    '피해금 회수',
    '법무법인 나란',
  ]
    .filter(Boolean)
    .join(', ')
}

// ISO string -> "YYYY-MM-DD" in Korea time; '' when missing/invalid.
export const formatKstDate = (value) => {
  const date = new Date(text(value))
  if (Number.isNaN(date.getTime())) return ''
  return new Date(date.getTime() + 9 * 60 * 60 * 1000).toISOString().slice(0, 10)
}

export const getCompanyFaqStructuredData = (item, pageUrl) => {
  const guide = getCompanyGuide(item)
  return {
    '@type': 'FAQPage',
    '@id': `${pageUrl}#faq`,
    inLanguage: 'ko-KR',
    mainEntity: guide.faq.map(({ q, a }) => ({
      '@type': 'Question',
      name: q,
      acceptedAnswer: { '@type': 'Answer', text: a },
    })),
  }
}

// Builds the related-case list from chronological neighbours: newer first, then older,
// skipping the page itself and anything not shown publicly.
export const pickRelatedCompanyCases = (newer, older, selfId, max = 12) => {
  const usable = (item) =>
    item &&
    item.id !== selfId &&
    item.isPublic !== false &&
    item.isSearchBlocked !== true &&
    text(item.name) &&
    text(item.service)
  const newerItems = newer.filter(usable)
  const olderItems = older.filter(usable)
  const half = Math.ceil(max / 2)
  const takeNewer = Math.max(half, max - olderItems.length)
  const picked = [...newerItems.slice(0, takeNewer), ...olderItems].slice(0, max)
  const seen = new Set()

  return picked
    .filter((item) => (seen.has(item.id) ? false : seen.add(item.id)))
    .map((item) => ({ id: item.id, name: text(item.name), service: text(item.service) }))
}
