/*
 * @Author: zss66 zjb520zll@gmail.com
 * @Date: 2025-08-07 18:28:17
 * @LastEditors: zss66 zjb520zll@gmail.com
 * @LastEditTime: 2025-08-08 15:31:19
 * @FilePath: \social_media\public\lockRenderer.js
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
// lockRenderer.js
window.addEventListener('DOMContentLoaded', () => {
  const passwordInput = document.getElementById('password')
  const unlockBtn = document.getElementById('unlockBtn')
  const errorText = document.getElementById('errorText')

  unlockBtn.addEventListener('click', async () => {
    const pwd = passwordInput.value.trim()
    
    try{
        const success = await window.electronAPI.verifyPassword(pwd)
        console.log('解锁结果:', success)
    if (success) {
      errorText.textContent = ''
    } else {
      errorText.textContent = '密码错误，请重试'
    }
    }
    catch(e){
        console.log(e)
    }
   
  })

  // 回车解锁
  passwordInput.addEventListener('keydown', e => {
    if (e.key === 'Enter') {
      unlockBtn.click()
    }
  })
})
