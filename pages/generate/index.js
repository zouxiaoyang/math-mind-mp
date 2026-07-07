const BASE_URL = 'https://api.jiuyuefunds.com'

function apiRequest(url, data, method) {
  return new Promise((resolve, reject) => {
    wx.request({
      url: `${BASE_URL}${url}`,
      method: method || (data ? 'POST' : 'GET'),
      data: data || {},
      header: { 'Content-Type': 'application/json' },
      success: (res) => {
        if (res.data && res.data.success) resolve(res.data)
        else reject(res.data?.error || '请求失败')
      },
      fail: (err) => reject(err.errMsg || '网络错误'),
    })
  })
}

Page({
  data: {
    grade: 3,
    semester: 1,
    difficulty: 2,
    count: 5,
    stars: '★★',
    loading: false,
    result: null,
  },

  onGradeChange(e) { this.setData({ grade: parseInt(e.detail.value) + 1 }) },
  onSemesterChange(e) { this.setData({ semester: parseInt(e.detail.value) + 1 }) },
  onDifficultyChange(e) {
    const d = parseInt(e.detail.value) + 1
    this.setData({ difficulty: d, stars: '★'.repeat(d) })
  },
  onCountChange(e) {
    const c = parseInt(e.detail.value) + 1
    this.setData({ count: c })
  },

  async handleGenerate() {
    this.setData({ loading: true, result: null })
    try {
      const user = wx.getStorageSync('userInfo')
      const res = await apiRequest('/api/questions/generate', {
        grade: this.data.grade,
        semester: this.data.semester,
        difficulty: this.data.difficulty,
        count: this.data.count,
        userId: user ? user.id : null,
      })
      this.setData({ result: res.results })
      wx.showToast({ title: `成功生成 ${res.results.created} 题`, icon: 'success' })
    } catch (err) {
      wx.showToast({ title: String(err).slice(0, 50), icon: 'none' })
    } finally {
      this.setData({ loading: false })
    }
  },

  onShareAppMessage() {
    return { title: '数学思维训练 - AI 出题', path: '/pages/generate/index' }
  },
})
