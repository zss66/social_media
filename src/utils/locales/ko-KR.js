const koKR = {
  common: {
    confirm: '확인',
    cancel: '취소',
    save: '저장',
    delete: '삭제',
    edit: '편집',
    add: '추가',
    remove: '제거',
    close: '닫기',
    back: '뒤로',
    next: '다음',
    previous: '이전',
    submit: '제출',
    reset: '초기화',
    clear: '지우기',
    debug: '디버그',
    refresh: '새로고침',
    loading: '로딩 중...',
    success: '작업 성공',
    error: '작업 실패',
    warning: '경고',
    info: '정보',
    yes: '예',
    no: '아니오',
    enable: '활성화',
    disable: '비활성화',
    online: '온라인',
    offline: '오프라인',
    connected: '연결됨',
    disconnected: '연결 끊김',
    unknown: '알 수 없음'
  },

  app: {
    title: '멀티 플랫폼 소셜 관리자',
    subtitle: '여러 소셜 플랫폼 계정을 통합 관리',
    version: '버전',
    description: 'Electron 기반 멀티 플랫폼 소셜 소프트웨어 관리자'
  },

  sidebar: {
    platformList: '플랫폼 목록',
    quickActions: '빠른 작업',
    importConfig: '설정 가져오기',
    exportConfig: '설정 내보내기',
    clearAll: '모두 지우기'
  },

  container: {
    create: '컨테이너 생성',
    name: '컨테이너 이름',
    status: '상태',
    actions: '작업',
    settings: '설정',
    reload: '새로 고침',
    remove: '제거',
    created: '생성됨',
    loading: '로딩 중',
    ready: '준비 완료',
    error: '오류',
    createdAt: '생성일',
    updatedAt: '업데이트일'
  },

  platform: {
    whatsapp: 'WhatsApp',
    telegram: 'Telegram',
    wechat: 'WeChat',
    line: 'LINE',
    discord: 'Discord',
    slack: 'Slack',
    teams: 'Microsoft Teams',
    skype: 'Skype',
    messenger: 'Facebook Messenger',
    instagram: 'Instagram'
  },

  config: {
    basicInfo: '기본 정보',
    proxySettings: '프록시 설정',
    browserFingerprint: '브라우저 지문',
    featureSettings: '기능 설정',
    advancedSettings: '고급 설정',
    dataManagement: '데이터 관리',

    containerName: '컨테이너 이름',
    platformInfo: '플랫폼 정보',
    enableProxy: '프록시 활성화',
    proxyType: '프록시 유형',
    proxyAddress: '프록시 주소',
    proxyPort: '프록시 포트',
    username: '사용자 이름',
    password: '비밀번호',
    testConnection: '연결 테스트',

    enableFingerprint: '지문 위장 활성화',
    presetTemplate: '사전 설정 템플릿',
    userAgent: '사용자 에이전트',
    screenResolution: '화면 해상도',
    timezone: '시간대',
    language: '언어 설정',

    enableTranslation: '번역 기능 활성화',
    enableAutoReply: '자동 응답 활성화',
    autoReplyMessage: '자동 응답 내용',
    replyDelay: '응답 지연',
    enableNotification: '메시지 알림 활성화',
    enableLogging: '메시지 기록 활성화',

    enableDevTools: '개발자 도구 활성화',
    disableImages: '이미지 로딩 비활성화',
    disableJavaScript: 'JavaScript 비활성화',
    customCSS: '커스텀 CSS',
    customJS: '커스텀 JavaScript',

    clearCookies: '쿠키 삭제',
    clearCache: '캐시 삭제',
    exportData: '데이터 내보내기',
    resetContainer: '컨테이너 초기화'
  },

  settings: {
    basicSettings: '기본 설정',
    theme: '앱 테마',
    lightTheme: '라이트 테마',
    darkTheme: '다크 테마',
    autoTheme: '시스템에 맞춤',
    language: '언어 설정',
    autoStart: '자동 시작',
    autoStartDesc: '시스템 시작 시 앱을 자동 실행합니다',
    minimizeToTray: '트레이로 최소화',
    minimizeToTrayDesc: '창을 닫을 때 종료하지 않고 시스템 트레이로 최소화합니다',

    defaultProxy: '기본 프록시 설정',
    defaultProxyDesc: '새로 생성된 컨테이너는 기본적으로 이 프록시 설정을 사용합니다',

    translationSettings: '번역 설정',
    translationService: '번역 서비스',
    defaultTargetLang: '기본 번역 대상 언어',
    apiKey: 'API 키',
    apiKeyDesc: '번역 API 호출에 사용되는 키입니다. 유효한 키를 입력하세요',
    autoDetectLanguage: '자동 언어 감지',

    notificationSettings: '알림 설정',
    enableDesktopNotification: '데스크톱 알림 활성화',
    notificationSound: '알림 소리',
    showMessagePreview: '메시지 미리보기 표시',
    showMessagePreviewDesc: '알림에 메시지 내용을 미리 보여줍니다',
    quietHours: '방해 금지 시간',

    securitySettings: '보안 설정',
    appLock: '앱 잠금 활성화',
    appLockDesc: '앱 시작 시 비밀번호를 입력해야 합니다',
    appPassword: '앱 비밀번호',
    autoLockTime: '자동 잠금 시간',
    dataEncryption: '데이터 암호화',
    dataEncryptionDesc: '설정 및 데이터 파일을 암호화하여 저장합니다',
    clearBrowserData: '모든 브라우저 데이터 삭제',
    clearBrowserDataDesc: '모든 컨테이너의 쿠키, 캐시 등을 삭제합니다',

    advancedSettings: '고급 설정',
    developerMode: '개발자 모드',
    developerModeDesc: '디버그 기능과 개발자 도구를 활성화합니다',
    hardwareAcceleration: '하드웨어 가속',
    hardwareAccelerationDesc: 'GPU를 사용하여 렌더링을 가속화합니다 (재시작 후 적용)',
    maxContainers: '최대 컨테이너 수',
    maxContainersDesc: '동시에 실행 가능한 컨테이너 최대 수',
    logLevel: '로그 레벨',
    autoUpdate: '자동 업데이트',
    autoUpdateDesc: '앱 업데이트를 자동으로 확인하고 다운로드합니다',

    restoreDefaults: '기본 설정 복원',
    exportSettings: '설정 내보내기',
    importSettings: '설정 가져오기'
  },

  translation: {
    translate: '번역',
    translating: '번역 중...',
    originalText: '원문',
    translatedText: '번역문',
    copyTranslation: '번역문 복사',
    translationResult: '번역 결과',
    selectTextToTranslate: '번역할 텍스트를 선택하세요',
    translationFailed: '번역 실패',

    languages: {
      zh: '중국어',
      en: '영어',
      ja: '일본어',
      ko: '한국어',
      fr: '프랑스어',
      de: '독일어',
      es: '스페인어',
      ru: '러시아어'
    },

    services: {
      google: '구글 번역',
      baidu: '바이두 번역',
      youdao: '요다오 번역',
      tencent: '텐센트 번역'
    }
  },

  autoReply: {
    autoReply: '자동 응답',
    enableAutoReply: '자동 응답 활성화',
    disableAutoReply: '자동 응답 비활성화',
    replyContent: '응답 내용',
    replyDelay: '응답 지연',
    quickMessages: '빠른 메시지',
    autoReplied: '자동 응답됨',

    quickReplyOptions: {
      hello: '안녕하세요',
      thanks: '감사합니다',
      ok: '알겠습니다',
      busy: '지금 좀 바쁘니 나중에 연락드리겠습니다',
      later: '나중에 연락드리겠습니다'
    }
  },

  notification: {
    newMessage: '새 메시지',
    containerCreated: '컨테이너가 성공적으로 생성되었습니다',
    containerRemoved: '컨테이너가 삭제되었습니다',
    settingsSaved: '설정이 저장되었습니다',
    dataExported: '데이터가 내보내졌습니다',
    dataImported: '데이터가 가져와졌습니다',
    proxyTestSuccess: '프록시 연결 테스트 성공',
    proxyTestFailed: '프록시 연결 테스트 실패',
    translationCopied: '번역문이 클립보드에 복사되었습니다',
    screenshotSaved: '스크린샷이 저장되었습니다'
  },

  error: {
    networkError: '네트워크 연결에 실패했습니다. 네트워크 설정을 확인하세요.',
    validationError: '입력 데이터에 오류가 있습니다. 확인 후 다시 시도하세요.',
    permissionError: '권한이 부족하여 이 작업을 수행할 수 없습니다.',
    containerError: '컨테이너 작업 실패. 다시 시도하세요.',
    translationError: '번역 서비스를 일시적으로 사용할 수 없습니다.',
    proxyError: '프록시 연결 실패. 프록시 설정을 확인하세요.',
    systemError: '시스템 내부 오류가 발생했습니다. 앱을 재시작하세요.',
    unknownError: '알 수 없는 오류가 발생했습니다.',

    containerNameRequired: '컨테이너 이름을 입력하세요.',
    proxyAddressRequired: '프록시 주소를 입력하세요.',
    proxyPortRequired: '프록시 포트를 입력하세요.',
    invalidProxyPort: '프록시 포트는 1~65535 사이여야 합니다.',
    invalidUrl: '유효한 URL을 입력하세요.',
    fileFormatError: '파일 형식 오류',

    confirmDeleteContainer: '이 컨테이너를 삭제하시겠습니까?',
    confirmResetContainer: '이 컨테이너를 리셋하시겠습니까? 모든 데이터, 로그인 상태, 사용자 설정이 삭제되며 복구할 수 없습니다!',
    confirmClearAll: '모든 컨테이너를 지우시겠습니까? 이 작업은 취소할 수 없습니다!',
    confirmResetSettings: '설정을 초기화하시겠습니까? 모든 사용자 설정이 삭제됩니다.',
    confirmClearCookies: '이 컨테이너의 모든 쿠키를 삭제하시겠습니까? 재로그인이 필요합니다.',
    confirmClearCache: '이 컨테이너의 모든 캐시를 삭제하시겠습니까?',
    confirmClearBrowserData: '모든 브라우저 데이터를 삭제하시겠습니까? 모든 컨테이너의 로그인 상태, 쿠키 및 캐시 데이터가 삭제됩니다.'
  },

  time: {
    justNow: '방금 전',
    minutesAgo: '{n}분 전',
    hoursAgo: '{n}시간 전',
    daysAgo: '{n}일 전',
    weeksAgo: '{n}주 전',
    monthsAgo: '{n}개월 전',
    yearsAgo: '{n}년 전'
  }
}

export default koKR;
