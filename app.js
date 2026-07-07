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

  getCurrentUser() { return wx.getStorageSync('userInfo') || null },
  isLoggedIn() { return !!wx.getStorageSync('userInfo') },

  logout() {
    wx.clearStorageSync()
    this.globalData.userInfo = null
    this.globalData.token = null
    this.globalData.mistakes = []
  },

  addMistake(data) {
    const list = this.globalData.mistakes || []
    const idx = list.findIndex(m => m.questionId === data.questionId)
    if (idx >= 0) {
      list[idx].wrongCount = (list[idx].wrongCount || 1) + 1
      list[idx].userAnswer = data.userAnswer
      list[idx].updatedAt = new Date().toISOString()
    } else {
      list.unshift({
        questionId: data.questionId,
        content: data.content,
        userAnswer: data.userAnswer,
        correctAnswer: data.correctAnswer,
        wrongCount: 1,
        createdAt: new Date().toISOString(),
      })
    }
    this.globalData.mistakes = list.slice(0, 50)
    wx.setStorageSync('mistakes', this.globalData.mistakes)
  },

  getMistakes() { return this.globalData.mistakes || [] },
  removeMistake(questionId) {
    this.globalData.mistakes = (this.globalData.mistakes || []).filter(m => m.questionId !== questionId)
    wx.setStorageSync('mistakes', this.globalData.mistakes)
  },
  clearMistakes() {
    this.globalData.mistakes = []
    wx.removeStorageSync('mistakes')
  },
  getMistakeCount() { return (this.globalData.mistakes || []).length },
})
