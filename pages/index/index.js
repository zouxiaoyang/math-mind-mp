const api = require('../../utils/api')
const { makeShareHandler } = require('../../utils/share')

Page({
  data: {
    stats: { total: 0, correctRate: 0, streak: 0 },
    hasLogin: false,
    userName: '',
    dailyGoal: 10,
    greeting: '你好',
    level: 1,
    mistakeCount: 0,
  },

  onShow() {
    this.setGreeting()
    this.checkLogin()
    if (this.data.hasLogin) {
      this.loadStats()
      this.setData({ mistakeCount: getApp().getMistakeCount() })
    }
  },

  setGreeting() {
    const h = new Date().getHours()
    let g = '你好'
    if (h < 6) g = '凌晨好'
    else if (h < 12) g = '早上好'
    else if (h < 14) g = '中午好'
    else if (h < 18) g = '下午好'
    else g = '晚上好'
    this.setData({ greeting: g })
  },

  checkLogin() {
    const user = api.getCurrentUser()
    this.setData({ hasLogin: !!user, userName: user ? user.name : '' })
  },

  async loadStats() {
    try {
      const res = await api.getReport()
      if (res.success && res.data) {
        const o = res.data.overview
        this.setData({
          stats: {
            total: o.totalAnswers || 0,
            correctRate: o.accuracy || 0,
            avgScore: o.avgScore || 0,
            speedGames: o.speedGames || 0,
          },
          level: this.calcLevel(o.totalAnswers || 0, o.accuracy || 0),
        })
      }
    } catch (err) { console.log('Load stats failed:', err) }
  },

  calcLevel(total, accuracy) {
    // 根据答题量和正确率计算等级
    const score = total * (accuracy / 100)
    if (score >= 500) return 5
    if (score >= 200) return 4
    if (score >= 100) return 3
    if (score >= 30) return 2
    return 1
  },

  onShareAppMessage: makeShareHandler({ prefix: '数学思维训练' }),

  goSpeed() { wx.switchTab({ url: '/pages/speed/index' }) },
  goLogin() { wx.navigateTo({ url: '/pages/login/index' }) },
  goGenerate() { wx.switchTab({ url: '/pages/generate/index' }) },
  goThinking() { wx.navigateTo({ url: '/pages/thinking/index' }) },
  goReport() { wx.switchTab({ url: '/pages/report/index' }) },
  goMistakes() { wx.navigateTo({ url: '/pages/mistakes/index' }) },
})
