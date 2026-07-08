const api = require('../../utils/api')
const { makeShareHandler } = require('../../utils/share')
const { showError } = require('../../utils/toast')
const { loginState } = require('../../utils/auth')
const { syncTabBar } = require('../../utils/tabbar')

Page({
  data: {
    report: null,
    hasLogin: false,
    userName: '',
    theta: 2.5,
  },
  _loaded: true,
  onUnload() {
    this._loaded = false
  },

  onShow() {
    this.checkLogin()
    syncTabBar(this)
    if (getApp()) {
      this.setData({ theta: getApp().getTheta().toFixed(1) })
    }
  },

  checkLogin() {
    const { hasLogin, userName, user } = loginState()
    this.setData({ hasLogin, userName })
    if (user && user.id) {
      this.loadReport(user.id)
    }
  },

  async loadReport(userId) {
    try {
      const res = await api.getReport(userId)
      if (this._loaded && res.success) {
        this.setData({ report: res.data })
      }
    } catch (err) {
      showError(err)
    }
  },

  goThinking() {
    wx.navigateTo({ url: '/pages/thinking/index' })
  },
  goSpeed() {
    wx.switchTab({ url: '/pages/speed/index' })
  },
  goMistakes() {
    wx.navigateTo({ url: '/pages/mistakes/index' })
  },
  goLogin() {
    wx.navigateTo({ url: '/pages/login/index' })
  },

  onShareAppMessage: makeShareHandler({ prefix: '数学思维训练' }),
})
