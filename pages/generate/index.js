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
    questionTypes: [
      { key: 'CHOICE', label: '选择题', active: true },
      { key: 'JUDGE', label: '判断题', active: true },
      { key: 'CALCULATION', label: '计算题', active: true },
      { key: 'APPLICATION', label: '应用题', active: true },
    ],
    selectedTypes: ['CHOICE', 'JUDGE', 'CALCULATION', 'APPLICATION'],
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

  toggleType(e) {
    const type = e.currentTarget.dataset.type
    if (!type) {return}
    const selected = this.data.selectedTypes
    const idx = selected.indexOf(type)
    let next
    if (idx >= 0) {
      if (selected.length === 1) {
        wx.showToast({ title: '至少选择一种题型', icon: 'none' })
        return
      }
      next = selected.filter((t) => t !== type)
    } else {
      next = [...selected, type]
    }
    const types = this.data.questionTypes.map((t) => ({
      ...t,
      active: next.indexOf(t.key) >= 0,
    }))
    this.setData({ selectedTypes: next, questionTypes: types })
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
        types: this.data.selectedTypes,
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
