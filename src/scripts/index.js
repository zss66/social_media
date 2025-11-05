/*
 * @Author: zss66 zjb520zll@gmail.com
 * @Date: 2025-07-25 14:49:54
 * @LastEditors: zss zjb520zll@gmail.com
 * @LastEditTime: 2025-11-05 10:52:39
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
import { telegramSendScript } from "./telegram/sendmessage.js";
import { telegramNewmessageScript } from "./telegram/newmessage.js";
import { getWhatsAppList } from "./whatsapp/getlist.js";
import { newWhatsAppMessage } from "./whatsapp/newmessage.js";
import { newTikTokMessage } from "./tiktok/newmessage.js";
import { sendTikTokMessage } from "./tiktok/sendmessage.js";
import { sendFacebookMessage } from "./facebook/sendmessage.js";
import { newFacebookMessage } from "./facebook/newmessage.js";
import { newMessengerMessage } from "./messenger/newmessage.js";
import { sendMessengerMessage } from "./messenger/sendmessage.js";
import { newInstagramMessage } from "./Instagram/newmessage.js";
import { newLinemessage } from "./line/newmessage.js";
import { sendLineMessage } from "./line/sendmessage.js";
import { sendInstagramMessage } from "./Instagram/sendmessage.js";
// ...

export const PlatformScripts = {
  whatsapp: {
    newmessage: newWhatsAppMessage,
    translation: whatsappTranslateScript,
    send: whatsappSendScript,
    getlists: getWhatsAppList,
    // autoReply: whatsappAutoReplyScript
  },
  telegram: {
    newmessage: telegramNewmessageScript,
    translation: telegramTranslateScript,
    getlists: telegramGetlists,
    send: telegramSendScript,
  },
  wetalk: {
    translation: wetalkTranslateScript,
  },
  line: {
    newmessage: newLinemessage,
    translation: lineTranslateScript,
    send: sendLineMessage,
  },
  facebook: {
    newmessage: newFacebookMessage,
    translation: facebookTranslateScript,
    send: sendFacebookMessage,
  },
  tiktok: {
    newmessage: newTikTokMessage,
    translation: tiktokTranslateScript,
    send: sendTikTokMessage,
  },
  instagram: {
    newmessage: newInstagramMessage,
    translation: instagramTranslateScript,
    send: sendInstagramMessage,
  },
  messenger: {
    newmessage: newMessengerMessage,
    translation: messengerTranslateScript,
    send: sendMessengerMessage,
  },

  // ...
};
