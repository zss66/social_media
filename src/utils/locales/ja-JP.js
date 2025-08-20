const jaJP = {
  common: {
    confirm: '確認',
    cancel: 'キャンセル',
    save: '保存',
    delete: '削除',
    edit: '編集',
    add: '追加',
    remove: '削除',
    close: '閉じる',
    back: '戻る',
    next: '次へ',
    previous: '前へ',
    submit: '送信',
    reset: 'リセット',
    clear: 'クリア',
    debug: 'デバッグ',
    refresh: '更新',
    loading: '読み込み中...',
    success: '操作成功',
    error: '操作失敗',
    warning: '警告',
    info: '情報',
    yes: 'はい',
    no: 'いいえ',
    enable: '有効',
    disable: '無効',
    online: 'オンライン',
    offline: 'オフライン',
    connected: '接続済み',
    disconnected: '切断済み',
    unknown: '不明'
  },

  app: {
    title: 'マルチプラットフォームソーシャルマネージャー',
    subtitle: '複数のソーシャルプラットフォームアカウントを統合管理',
    version: 'バージョン',
    description: 'Electronベースのマルチプラットフォームソーシャルソフトウェアマネージャー'
  },

  sidebar: {
    platformList: 'プラットフォーム一覧',
    quickActions: 'クイック操作',
    importConfig: '設定のインポート',
    exportConfig: '設定のエクスポート',
    clearAll: 'すべてクリア'
  },

  container: {
    create: 'コンテナ作成',
    name: 'コンテナ名',
    status: '状態',
    actions: '操作',
    settings: '設定',
    reload: '再読み込み',
    remove: '削除',
    created: '作成済み',
    loading: '読み込み中',
    ready: '準備完了',
    error: 'エラー',
    createdAt: '作成日時',
    updatedAt: '更新日時'
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
    basicInfo: '基本情報',
    proxySettings: 'プロキシ設定',
    browserFingerprint: 'ブラウザフィンガープリント',
    featureSettings: '機能設定',
    advancedSettings: '詳細設定',
    dataManagement: 'データ管理',

    containerName: 'コンテナ名',
    platformInfo: 'プラットフォーム情報',
    enableProxy: 'プロキシを有効化',
    proxyType: 'プロキシタイプ',
    proxyAddress: 'プロキシアドレス',
    proxyPort: 'プロキシポート',
    username: 'ユーザー名',
    password: 'パスワード',
    testConnection: '接続テスト',

    enableFingerprint: 'フィンガープリント偽装を有効化',
    presetTemplate: 'プリセットテンプレート',
    userAgent: 'ユーザーエージェント',
    screenResolution: '画面解像度',
    timezone: 'タイムゾーン',
    language: '言語設定',

    enableTranslation: '翻訳機能を有効化',
    enableAutoReply: '自動返信を有効化',
    autoReplyMessage: '自動返信内容',
    replyDelay: '返信遅延',
    enableNotification: 'メッセージ通知を有効化',
    enableLogging: 'メッセージ記録を有効化',

    enableDevTools: '開発者ツールを有効化',
    disableImages: '画像読み込みを無効化',
    disableJavaScript: 'JavaScriptを無効化',
    customCSS: 'カスタムCSS',
    customJS: 'カスタムJavaScript',

    clearCookies: 'Cookieをクリア',
    clearCache: 'キャッシュをクリア',
    exportData: 'データをエクスポート',
    resetContainer: 'コンテナをリセット'
  },

  settings: {
    basicSettings: '基本設定',
    theme: 'アプリテーマ',
    lightTheme: 'ライトテーマ',
    darkTheme: 'ダークテーマ',
    autoTheme: 'システムに合わせる',
    language: '言語設定',
    autoStart: '自動起動',
    autoStartDesc: 'システム起動時にアプリを自動起動します',
    minimizeToTray: 'トレイに最小化',
    minimizeToTrayDesc: 'ウィンドウを閉じるときに終了せずトレイに最小化します',

    defaultProxy: 'デフォルトプロキシ設定',
    defaultProxyDesc: '新規作成されたコンテナはデフォルトでこのプロキシ設定を使用します',

    translationSettings: '翻訳設定',
    translationService: '翻訳サービス',
    defaultTargetLang: 'デフォルト翻訳先言語',
    apiKey: 'APIキー',
    apiKeyDesc: '翻訳APIを呼び出すためのキー、有効なキーを入力してください',
    autoDetectLanguage: '言語自動検出',

    notificationSettings: '通知設定',
    enableDesktopNotification: 'デスクトップ通知を有効化',
    notificationSound: '通知音',
    showMessagePreview: 'メッセージプレビュー表示',
    showMessagePreviewDesc: '通知にメッセージ内容のプレビューを表示します',
    quietHours: '通知オフ時間',

    securitySettings: 'セキュリティ設定',
    appLock: 'アプリロックを有効化',
    appLockDesc: 'アプリ起動時にパスワード入力が必要になります',
    appPassword: 'アプリパスワード',
    autoLockTime: '自動ロック時間',
    dataEncryption: 'データ暗号化',
    dataEncryptionDesc: '設定とデータファイルを暗号化して保存します',
    clearBrowserData: 'すべてのブラウザデータをクリア',
    clearBrowserDataDesc: 'すべてのコンテナのCookie、キャッシュなどのデータをクリアします',

    advancedSettings: '詳細設定',
    developerMode: '開発者モード',
    developerModeDesc: 'デバッグ機能と開発者ツールを有効化します',
    hardwareAcceleration: 'ハードウェアアクセラレーション',
    hardwareAccelerationDesc: 'GPUを使ってレンダリングを高速化します（再起動後有効）',
    maxContainers: '最大コンテナ数',
    maxContainersDesc: '同時に起動可能なコンテナの最大数',
    logLevel: 'ログレベル',
    autoUpdate: '自動更新',
    autoUpdateDesc: 'アプリの更新を自動で確認・ダウンロードします',

    restoreDefaults: 'デフォルトに戻す',
    exportSettings: '設定をエクスポート',
    importSettings: '設定をインポート'
  },

  translation: {
    translate: '翻訳',
    translating: '翻訳中...',
    originalText: '原文',
    translatedText: '訳文',
    copyTranslation: '訳文をコピー',
    translationResult: '翻訳結果',
    selectTextToTranslate: '翻訳するテキストを選択してください',
    translationFailed: '翻訳に失敗しました',

    languages: {
      zh: '中国語',
      en: '英語',
      ja: '日本語',
      ko: '韓国語',
      fr: 'フランス語',
      de: 'ドイツ語',
      es: 'スペイン語',
      ru: 'ロシア語'
    },

    services: {
      google: 'Google 翻訳',
      baidu: '百度翻訳',
      youdao: '有道翻訳',
      tencent: 'Tencent 翻訳'
    }
  },

  autoReply: {
    autoReply: '自動返信',
    enableAutoReply: '自動返信を有効化',
    disableAutoReply: '自動返信を無効化',
    replyContent: '返信内容',
    replyDelay: '返信遅延',
    quickMessages: 'クイックメッセージ',
    autoReplied: '自動返信済み',

    quickReplyOptions: {
      hello: 'こんにちは',
      thanks: 'ありがとう',
      ok: '了解しました',
      busy: '今は少し忙しいので、後ほど連絡します',
      later: '後で連絡します'
    }
  },

  notification: {
    newMessage: '新しいメッセージ',
    containerCreated: 'コンテナが正常に作成されました',
    containerRemoved: 'コンテナが削除されました',
    settingsSaved: '設定が保存されました',
    dataExported: 'データがエクスポートされました',
    dataImported: 'データがインポートされました',
    proxyTestSuccess: 'プロキシ接続テスト成功',
    proxyTestFailed: 'プロキシ接続テスト失敗',
    translationCopied: '訳文がクリップボードにコピーされました',
    screenshotSaved: 'スクリーンショットが保存されました'
  },

  error: {
    networkError: 'ネットワーク接続に失敗しました。ネットワーク設定を確認してください。',
    validationError: '入力データに誤りがあります。確認して再試行してください。',
    permissionError: '権限が不足しています。この操作は実行できません。',
    containerError: 'コンテナ操作に失敗しました。再試行してください。',
    translationError: '翻訳サービスが一時的に利用できません。',
    proxyError: 'プロキシ接続に失敗しました。プロキシ設定を確認してください。',
    systemError: 'システム内部エラーが発生しました。アプリを再起動してください。',
    unknownError: '不明なエラーが発生しました。',

    containerNameRequired: 'コンテナ名を入力してください。',
    proxyAddressRequired: 'プロキシアドレスを入力してください。',
    proxyPortRequired: 'プロキシポートを入力してください。',
    invalidProxyPort: 'プロキシポートは1〜65535の範囲で指定してください。',
    invalidUrl: '有効なURLを入力してください。',
    fileFormatError: 'ファイル形式エラー',

    confirmDeleteContainer: 'このコンテナを削除してもよろしいですか？',
    confirmResetContainer: 'このコンテナをリセットしてもよろしいですか？すべてのデータ、ログイン状態、カスタム設定が消去されます。この操作は取り消せません！',
    confirmClearAll: 'すべてのコンテナをクリアしてもよろしいですか？この操作は取り消せません！',
    confirmResetSettings: '設定をリセットしてもよろしいですか？すべてのカスタム設定が消去されます。',
    confirmClearCookies: 'このコンテナのすべてのCookieをクリアしてもよろしいですか？再ログインが必要になります。',
    confirmClearCache: 'このコンテナのすべてのキャッシュをクリアしてもよろしいですか？',
    confirmClearBrowserData: 'すべてのブラウザデータをクリアしてもよろしいですか？すべてのコンテナのログイン状態、Cookie、キャッシュデータが消去されます。'
  },

  time: {
    justNow: 'たった今',
    minutesAgo: '{n}分前',
    hoursAgo: '{n}時間前',
    daysAgo: '{n}日前',
    weeksAgo: '{n}週間前',
    monthsAgo: '{n}ヶ月前',
    yearsAgo: '{n}年前'
  }
}

export default jaJP;
