const api = require('../../utils/api')
const { makeShareHandler } = require('../../utils/share')

Page({
  data: {
    userInfo: null,
    hasLogin: false,
    userName: '同学',
    totalAnswers: 0,
    accuracy: 0,
    speedGames: 0,
    dailyGoal: 10,
    mistakeCount: 0,
    level: 1,
  },

  onShow() {
    const user = api.getCurrentUser()
    this.setData({
      userInfo: user,
      hasLogin: !!user,
      userName: user ? user.name : '同学',
      mistakeCount: getApp().getMistakeCount(),
    })
    if (user) this.loadStats()
  },

  async loadStats() {
    try {
      const res = await api.getReport()
      if (res.success && res.data) {
        const o = res.data.overview
        this.setData({
          totalAnswers: o.totalAnswers || 0,
          accuracy: o.accuracy || 0,
          speedGames: o.speedGames || 0,
          level: this.calcLevel(o.totalAnswers || 0, o.accuracy || 0),
        })
      }
    } catch (err) { console.log('Load stats failed:', err) }
  },

  calcLevel(total, accuracy) {
    const score = total * (accuracy / 100)
    if (score >= 500) return 5
    if (score >= 200) return 4
    if (score >= 100) return 3
    if (score >= 30) return 2
    return 1
  },

  handleLogout() {
    wx.showModal({
      title: '确认退出',
      content: '退出后将清除登录信息',
      success: (res) => {
        if (res.confirm) {
          if (getApp()) getApp().logout()
          this.setData({ userInfo: null, hasLogin: false, totalAnswers: 0, accuracy: 0 })
        }
      },
    })
  },

  goLogin() { wx.navigateTo({ url: '/pages/login/index' }) },
  goMistakes() { wx.navigateTo({ url: '/pages/mistakes/index' }) },
  onShareAppMessage: makeShareHandler({ prefix: '数学思维训练' }),
})
