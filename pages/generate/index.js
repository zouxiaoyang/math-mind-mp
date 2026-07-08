const api = require('../../utils/api')
const { showError } = require('../../utils/toast')
const { syncTabBar } = require('../../utils/tabbar')

Page({
  data: {
    grade: 3,
    semester: 1,
    difficulty: 2,
    count: 5,
    stars: '★★',
    loading: false,
    progress: 0,
    result: null,
  },
  _progressTimer: null,

  onShow() {
    syncTabBar(this)
  },

  onGradeChange(e) {
    this.setData({ grade: parseInt(e.detail.value) + 1 })
  },
  onSemesterChange(e) {
    this.setData({ semester: parseInt(e.detail.value) + 1 })
  },
  onDifficultyChange(e) {
    const d = parseInt(e.detail.value) + 1
    this.setData({ difficulty: d, stars: '★'.repeat(d) })
  },
  onCountChange(e) {
    const c = parseInt(e.detail.value) + 1
    this.setData({ count: c })
  },

  // 模拟进度:前快后慢,到 90% 等接口完成再拉到 100%
  _startProgress() {
    this.setData({ progress: 0 })
    this._progressTimer = setInterval(() => {
      const p = this.data.progress
      // 0→70 快,70→90 慢,90 以上等接口
      const next = p < 70 ? p + 8 : p < 90 ? p + 2 : p
      if (next >= 90) {
        clearInterval(this._progressTimer)
        this._progressTimer = null
      }
      this.setData({ progress: Math.min(next, 90) })
    }, 500)
  },
  _stopProgress() {
    if (this._progressTimer) {
      clearInterval(this._progressTimer)
      this._progressTimer = null
    }
    this.setData({ progress: 100 })
  },

  async handleGenerate() {
    if (this.data.loading) {
      return
    }
    this.setData({ loading: true, result: null })
    this._startProgress()
    try {
      const res = await api.generateQuestions({
        grade: this.data.grade,
        semester: this.data.semester,
        difficulty: this.data.difficulty,
        count: this.data.count,
      })
      this._stopProgress()
      this.setData({ result: res.results })
      wx.showToast({ title: `成功生成 ${res.results.created} 题`, icon: 'success' })
    } catch (err) {
      this._stopProgress()
      showError(err)
    } finally {
      this.setData({ loading: false })
    }
  },

  onUnload() {
    if (this._progressTimer) {
      clearInterval(this._progressTimer)
    }
  },

  onShareAppMessage() {
    return { title: '数学思维训练 - AI 出题', path: '/pages/generate/index' }
  },
})
