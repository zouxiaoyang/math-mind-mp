App({
  globalData: {
    baseUrl: 'https://api.jiuyuefunds.com',
    userInfo: null,
    token: null,
    mistakes: [],
    theta: 2.5,
  },

  onLaunch() {
    const token = wx.getStorageSync('token')
    const userInfo = wx.getStorageSync('userInfo')
    if (token && userInfo) {
      this.globalData.token = token
      this.globalData.userInfo = userInfo
    }
    this.globalData.mistakes = wx.getStorageSync('mistakes') || []
    this.globalData.theta = wx.getStorageSync('theta') || 2.5
  },

  getCurrentUser() {
    return wx.getStorageSync('userInfo') || null
  },
  isLoggedIn() {
    return !!wx.getStorageSync('userInfo')
  },

  logout() {
    wx.clearStorageSync()
    this.globalData.userInfo = null
    this.globalData.token = null
    this.globalData.mistakes = []
    wx.reLaunch({ url: '/pages/login/index' })
  },

  addMistake(data) {
    const prev = this.globalData.mistakes || []
    const idx = prev.findIndex((m) => m.questionId === data.questionId)
    let next
    if (idx >= 0) {
      const merged = {
        ...prev[idx],
        wrongCount: (prev[idx].wrongCount || 1) + 1,
        userAnswer: data.userAnswer,
        updatedAt: new Date().toISOString(),
      }
      next = [...prev.slice(0, idx), merged, ...prev.slice(idx + 1)]
    } else {
      next = [
        {
          questionId: data.questionId,
          content: data.content,
          userAnswer: data.userAnswer,
          correctAnswer: data.correctAnswer,
          wrongCount: 1,
          createdAt: new Date().toISOString(),
        },
        ...prev,
      ]
    }
    const trimmed = next.slice(0, 50)
    this.globalData.mistakes = trimmed
    wx.setStorageSync('mistakes', trimmed)
  },

  getMistakes() {
    return this.globalData.mistakes || []
  },
  removeMistake(questionId) {
    this.globalData.mistakes = (this.globalData.mistakes || []).filter(
      (m) => m.questionId !== questionId
    )
    wx.setStorageSync('mistakes', this.globalData.mistakes)
  },
  clearMistakes() {
    this.globalData.mistakes = []
    wx.removeStorageSync('mistakes')
  },
  getMistakeCount() {
    return (this.globalData.mistakes || []).length
  },

  // IRT-like θ 估计: 答对升 / 答错降, 幅度随题目-能力差距加权
  updateTheta(isCorrect, difficulty) {
    const theta = this.globalData.theta || 2.5
    const d = difficulty != null ? difficulty : 3
    let next
    if (isCorrect) {
      next = theta + 0.1 + 0.05 * Math.max(0, d - theta)
    } else {
      next = theta - 0.15 - 0.05 * Math.max(0, theta - d)
    }
    next = Math.max(0.5, Math.min(5.5, next))
    this.globalData.theta = next
    wx.setStorageSync('theta', next)
    return next
  },
  getTheta() {
    return this.globalData.theta || 2.5
  },
})
