const api = require('../../utils/api')
const { showError } = require('../../utils/toast')

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

  async handleGenerate() {
    if (this.data.loading) {return}
    this.setData({ loading: true, result: null })
    try {
      const res = await api.generateQuestions({
        grade: this.data.grade,
        semester: this.data.semester,
        difficulty: this.data.difficulty,
        count: this.data.count,
      })
      this.setData({ result: res.results })
      wx.showToast({ title: `成功生成 ${res.results.created} 题`, icon: 'success' })
    } catch (err) {
      showError(err)
    } finally {
      this.setData({ loading: false })
    }
  },

  onShareAppMessage() {
    return { title: '数学思维训练 - AI 出题', path: '/pages/generate/index' }
  },
})
