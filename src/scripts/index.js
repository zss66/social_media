/*
 * @Author: zss66 zjb520zll@gmail.com
 * @Date: 2025-07-25 14:49:54
 * @LastEditors: zss zjb520zll@gmail.com
 * @LastEditTime: 2025-09-26 17:32:04
 * @FilePath: \social_media\src\scripts\index.js
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
import { whatsappTranslateScript } from "./whatsapp/translate.js";
// import { whatsappAutoReplyScript } from './whatsapp/autoReply'
import { telegramTranslateScript } from "./telegram/translate.js";
import { telegramGetlists } from "./telegram/getlist.js";
import { wetalkTranslateScript } from "./wetalk/translate.js";
import { lineTranslateScript } from "./line/translate.js";
import { facebookTranslateScript } from "./facebook/translate.js";
import { tiktokTranslateScript } from "./tiktok/translate.js";
import { instagramTranslateScript } from "./Instagram/translate.js";
import { messengerTranslateScript } from "./messenger/translate.js";
import { whatsappSendScript } from "./whatsapp/sendmessage.js";
// ...

export const PlatformScripts = {
  whatsapp: {
    translation: whatsappTranslateScript,
    send: whatsappSendScript,
    // autoReply: whatsappAutoReplyScript
  },
  telegram: {
    translation: telegramTranslateScript,
    getlists: telegramGetlists,
  },
  wetalk: {
    translation: wetalkTranslateScript,
  },
  line: {
    translation: lineTranslateScript,
  },
  facebook: {
    translation: facebookTranslateScript,
  },
  tiktok: {
    translation: tiktokTranslateScript,
  },
  instagram: {
    translation: instagramTranslateScript,
  },
  messenger: {
    translation: messengerTranslateScript,
  },

  // ...
};
