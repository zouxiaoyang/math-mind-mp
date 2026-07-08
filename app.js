App({
  globalData: {
    baseUrl: 'https://api.jiuyuefunds.com',
    userInfo: null,
    token: null,
    mistakes: [],
  },

  onLaunch() {
    const token = wx.getStorageSync('token')
    const userInfo = wx.getStorageSync('userInfo')
    if (token && userInfo) {
      this.globalData.token = token
      this.globalData.userInfo = userInfo
    }
    this.globalData.mistakes = wx.getStorageSync('mistakes') || []
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
})
