/*
 * @Author: zss66 zjb520zll@gmail.com
 * @Date: 2025-07-30 19:38:15
 * @LastEditors: zss66 zjb520zll@gmail.com
 * @LastEditTime: 2025-07-30 19:51:28
 * @FilePath: \social_media\public\fillChromeAPI.js
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
(function initChromeAPI() {
    console.log('fillChromeAPI.js');
    window.chrome.notifications = {
        onClicked: {
            addListener: function () {
            }
        },
        onClosed: {
            addListener: function () {
            }
        },
        create: function () {
        },
        clear: function () {
        },
        getAll: function () {
        },
        update: function () {
        }
    };
    window.chrome.tabs = {
        getZoom: function () {
            return {
                then: function (_0x5a223b) {
                    if (_0x5a223b) {
                        _0x5a223b();
                    }
                }
            };
        }
    };
    window.chrome.action = {
        setBadgeText: function () {
        }
    };
    window.chrome.downloads = {
        download: async function (_0x205148) {
            window.saveAsFile(_0x205148.url, _0x205148.filename);
        },
        onChanged: {
            addListener: function (_0x2b0c7e) {
            }
        }
    };
    window.chrome.cookies = {
        remove: function () {
        },
        getAll: function () {
        },
        getAllCookieStores: function () {
        },
        onChanged: {
            addListener: function () {
            }
        }
    };
})()