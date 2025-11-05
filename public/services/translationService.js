/**
 * 翻译服务类
 * 支持多种翻译API提供商
 */

class TranslationService {
  constructor() {
    this.providers = {
      google: this.googleTranslate.bind(this),
      baidu: this.baiduTranslate.bind(this),
      youdao: this.youdaoTranslate.bind(this),
      tencent: this.tencentTranslate.bind(this),
    };

    this.languageCodes = {
      // 语言代码映射
      zh: { google: "zh-cn", baidu: "zh", youdao: "zh-CHS", tencent: "zh" },
      en: { google: "en", baidu: "en", youdao: "en", tencent: "en" },
      ja: { google: "ja", baidu: "jp", youdao: "ja", tencent: "ja" },
      ko: { google: "ko", baidu: "kor", youdao: "ko", tencent: "ko" },
      fr: { google: "fr", baidu: "fra", youdao: "fr", tencent: "fr" },
      de: { google: "de", baidu: "de", youdao: "de", tencent: "de" },
      es: { google: "es", baidu: "spa", youdao: "es", tencent: "es" },
      ru: { google: "ru", baidu: "ru", youdao: "ru", tencent: "ru" },
    };
  }

  /**
   * 翻译文本
   * @param {string} text - 要翻译的文本
   * @param {string} targetLang - 目标语言
   * @param {string} sourceLang - 源语言（可选，自动检测）
   * @param {string} provider - 翻译服务提供商
   * @param {string} apiKey - API密钥
   * @returns {Promise<Object>} 翻译结果
   */
  async translate(
    text,
    targetLang,
    sourceLang = "auto",
    provider = "google",
    apiKey = ""
  ) {
    try {
      if (!text || !text.trim()) {
        throw new Error("翻译文本不能为空");
      }

      if (!this.providers[provider]) {
        throw new Error(`不支持的翻译服务提供商: ${provider}`);
      }

      const translateFunc = this.providers[provider];
      const result = await translateFunc(text, targetLang, sourceLang, apiKey);

      return {
        success: true,
        originalText: text,
        translatedText: result.translatedText,
        sourceLanguage: result.sourceLanguage || sourceLang,
        targetLanguage: targetLang,
        provider: provider,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error("Translation failed:", error);
      return {
        success: false,
        error: error.message,
        originalText: text,
        provider: provider,
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * 检测语言
   * @param {string} text - 要检测的文本
   * @param {string} provider - 检测服务提供商
   * @param {string} apiKey - API密钥
   * @returns {Promise<string>} 检测到的语言代码
   */
  async detectLanguage(text, provider = "google", apiKey = "") {
    try {
      // 这里可以实现真实的语言检测逻辑
      // 暂时使用简单的规则检测
      const result = this.simpleLanguageDetection(text);
      return result;
    } catch (error) {
      console.error("Language detection failed:", error);
      return "auto";
    }
  }

  /**
   * Google 翻译
   * @param {string} text - 文本
   * @param {string} targetLang - 目标语言
   * @param {string} sourceLang - 源语言
   * @param {string} apiKey - API密钥
   * @returns {Promise<Object>} 翻译结果
   */

  async googleTranslate(text, targetLang, sourceLang, apiKey) {
    try {
      if (apiKey) {
        // 使用官方API
        const url = `https://translation.googleapis.com/language/translate/v2?key=${apiKey}`;
        const response = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            q: text,
            target: this.getLanguageCode(targetLang, "google"),
            source:
              sourceLang === "auto"
                ? undefined
                : this.getLanguageCode(sourceLang, "google"),
          }),
        });

        const data = await response.json();

        if (data.error) {
          throw new Error(data.error.message);
        }

        return {
          translatedText: data.data.translations[0].translatedText,
          sourceLanguage: data.data.translations[0].detectedSourceLanguage,
        };
      } else {
        // 使用免费的翻译接口（这里只是示例，实际需要找到可用的免费接口）
        console.warn("未提供API密钥，使用免费接口可能不稳定");
        console.log("✅ 请求参数:", { text, targetLang, sourceLang });
        const response = await fetch(
          "http://119.45.9.228:83/v1/completion-messages",
          {
            method: "POST",
            headers: {
              Authorization: "Bearer app-xI95EJcTFdfQy1oyfbwoCPRD",
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              inputs: { query: text, targetlang: targetLang },
              response_mode: "blocking",
              user: "test-zss",
            }),
          }
        );

        // 检查 HTTP 状态
        if (!response.ok) {
          console.error("请求失败:", response.status, response.statusText);
          throw new Error(
            `请求失败: ${response.status} ${response.statusText}`
          );
        }

        let data;
        try {
          data = await response.json();
        } catch (err) {
          throw new Error("解析 JSON 失败: " + err.message);
        }

        if (!data.answer) {
          throw new Error(
            "接口返回不包含 answer 字段: " + JSON.stringify(data)
          );
        }
        console.log("✅ 响应数据:", data);

        return data.answer;
      }
    } catch (error) {
      throw new Error(`Google翻译失败: ${error.message}`);
    }
  }

  /**
   * 百度翻译
   * @param {string} text - 文本
   * @param {string} targetLang - 目标语言
   * @param {string} sourceLang - 源语言
   * @param {string} apiKey - API密钥
   * @returns {Promise<Object>} 翻译结果
   */
  async baiduTranslate(text, targetLang, sourceLang, apiKey) {
    try {
      // 百度翻译API实现
      // 这里需要实现具体的百度翻译逻辑
      return await this.simulateTranslation(text, targetLang, sourceLang);
    } catch (error) {
      throw new Error(`百度翻译失败: ${error.message}`);
    }
  }

  /**
   * 有道翻译
   * @param {string} text - 文本
   * @param {string} targetLang - 目标语言
   * @param {string} sourceLang - 源语言
   * @param {string} apiKey - API密钥
   * @returns {Promise<Object>} 翻译结果
   */
  async youdaoTranslate(text, targetLang, sourceLang, apiKey) {
    try {
      // 有道翻译API实现
      return await this.simulateTranslation(text, targetLang, sourceLang);
    } catch (error) {
      throw new Error(`有道翻译失败: ${error.message}`);
    }
  }

  /**
   * 腾讯翻译
   * @param {string} text - 文本
   * @param {string} targetLang - 目标语言
   * @param {string} sourceLang - 源语言
   * @param {string} apiKey - API密钥
   * @returns {Promise<Object>} 翻译结果
   */
  async tencentTranslate(text, targetLang, sourceLang, apiKey) {
    try {
      // 腾讯翻译API实现
      return await this.simulateTranslation(text, targetLang, sourceLang);
    } catch (error) {
      throw new Error(`腾讯翻译失败: ${error.message}`);
    }
  }

  /**
   * 模拟翻译（用于演示）
   * @param {string} text - 文本
   * @param {string} targetLang - 目标语言
   * @param {string} sourceLang - 源语言
   * @returns {Promise<Object>} 翻译结果
   */
  async simulateTranslation(text, targetLang, sourceLang) {
    // 模拟API延迟
    await new Promise((resolve) =>
      setTimeout(resolve, 1000 + Math.random() * 2000)
    );

    const translations = {
      zh: {
        Hello: "你好",
        "Thank you": "谢谢",
        "Good morning": "早上好",
        "How are you?": "你好吗？",
        "I love you": "我爱你",
      },
      en: {
        你好: "Hello",
        谢谢: "Thank you",
        早上好: "Good morning",
        "你好吗？": "How are you?",
        我爱你: "I love you",
      },
    };

    // 简单的词典翻译
    if (translations[targetLang] && translations[targetLang][text]) {
      return {
        translatedText: translations[targetLang][text],
        sourceLanguage:
          sourceLang === "auto"
            ? this.simpleLanguageDetection(text)
            : sourceLang,
      };
    }

    // 如果没有找到翻译，返回带标识的原文
    const langNames = {
      zh: "中文",
      en: "English",
      ja: "日本語",
      ko: "한국어",
    };

    return {
      translatedText: `[${langNames[targetLang] || targetLang}] ${text}`,
      sourceLanguage:
        sourceLang === "auto" ? this.simpleLanguageDetection(text) : sourceLang,
    };
  }

  /**
   * 简单语言检测
   * @param {string} text - 文本
   * @returns {string} 语言代码
   */
  simpleLanguageDetection(text) {
    // 检测中文
    if (/[\u4e00-\u9fff]/.test(text)) {
      return "zh";
    }

    // 检测日文
    if (/[\u3040-\u309f\u30a0-\u30ff]/.test(text)) {
      return "ja";
    }

    // 检测韩文
    if (/[\uac00-\ud7af]/.test(text)) {
      return "ko";
    }

    // 检测俄文
    if (/[\u0400-\u04ff]/.test(text)) {
      return "ru";
    }

    // 默认为英文
    return "en";
  }

  /**
   * 获取特定提供商的语言代码
   * @param {string} lang - 标准语言代码
   * @param {string} provider - 提供商
   * @returns {string} 提供商特定的语言代码
   */
  getLanguageCode(lang, provider) {
    return this.languageCodes[lang]?.[provider] || lang;
  }

  /**
   * 获取支持的语言列表
   * @returns {Array} 支持的语言列表
   */
  getSupportedLanguages() {
    return [
      { code: "zh", name: "中文", nativeName: "中文" },
      { code: "en", name: "英语", nativeName: "English" },
      { code: "ja", name: "日语", nativeName: "日本語" },
      { code: "ko", name: "韩语", nativeName: "한국어" },
      { code: "fr", name: "法语", nativeName: "Français" },
      { code: "de", name: "德语", nativeName: "Deutsch" },
      { code: "es", name: "西班牙语", nativeName: "Español" },
      { code: "ru", name: "俄语", nativeName: "Русский" },
    ];
  }

  /**
   * 获取支持的翻译服务提供商
   * @returns {Array} 提供商列表
   */
  getSupportedProviders() {
    return [
      { id: "google", name: "Google 翻译", requiresApiKey: false },
      { id: "baidu", name: "百度翻译", requiresApiKey: true },
      { id: "youdao", name: "有道翻译", requiresApiKey: true },
      { id: "tencent", name: "腾讯翻译", requiresApiKey: true },
    ];
  }
}

// 导出单例实例
module.exports = new TranslationService();
