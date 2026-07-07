const api = require('../../utils/api')
const { makeShareHandler } = require('../../utils/share')

Page({
  data: {
    report: null,
    hasLogin: false,
    userName: '',
  },

  onShow() { this.checkLogin() },

  checkLogin() {
    const userInfo = wx.getStorageSync('userInfo')
    this.setData({ hasLogin: !!userInfo, userName: userInfo ? userInfo.name : '' })
    if (userInfo && userInfo.id) this.loadReport(userInfo.id)
  },

  async loadReport(userId) {
    try {
      const res = await api.getReport(userId)
      if (res.success) this.setData({ report: res.data })
    } catch (err) { console.log(err) }
  },

  goThinking() { wx.navigateTo({ url: '/pages/thinking/index' }) },
  goSpeed() { wx.switchTab({ url: '/pages/speed/index' }) },
  goMistakes() { wx.navigateTo({ url: '/pages/mistakes/index' }) },
  goLogin() { wx.navigateTo({ url: '/pages/login/index' }) },

  onShareAppMessage: makeShareHandler({ prefix: '数学思维训练' }),
})
