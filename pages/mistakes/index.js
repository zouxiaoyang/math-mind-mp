const api = require('../../utils/api')
const { loginState } = require('../../utils/auth')

Page({
  data: {
    mistakes: [],
    filteredMistakes: [],
    hasLogin: false,
    activeFilter: 'all',
    subjects: [
      { key: 'all', label: '全部', icon: '📋' },
      { key: 'NUMBER_ALGEBRA', label: '数与代数', icon: '🔢' },
      { key: 'GEOMETRY', label: '图形几何', icon: '📐' },
      { key: 'STATISTICS', label: '统计概率', icon: '📊' },
      { key: 'PRACTICE', label: '综合实践', icon: '🧩' },
    ],
    showAnswer: {},
  },
  _loaded: true,
  onUnload() {
    this._loaded = false
  },

  onShow() {
    this.loadData()
  },

  loadData() {
    const { hasLogin, user } = loginState()
    this.setData({ hasLogin })
    if (!user) {
      return
    }

    // 读本地错题(与首页错题数同数据源,强一致)
    const localMistakes = getApp().getMistakes()
    if (!this._loaded) {
      return
    }

    // 按 questionId 补全题目详情(difficulty, subject 等)
    const ids = localMistakes.map((m) => m.questionId).filter(Boolean)
    if (ids.length === 0) {
      this.setData({ mistakes: [] })
      this.applyFilter()
      return
    }

    api
      .getQuestions({ ids: ids.join(',') })
      .then((res) => {
        if (!this._loaded) {
          return
        }
        const questionMap = {}
        ;(res.data || []).forEach((q) => {
          questionMap[q.id] = q
        })
        const mistakes = localMistakes.map((m) => {
          const q = questionMap[m.questionId] || {}
          const difficulty = q.difficulty || m.difficulty || 3
          const stars = []
          for (let i = 0; i < difficulty; i++) {
            stars.push(i)
          }
          return {
            ...m,
            difficulty,
            subject: q.subject || m.subject || 'NUMBER_ALGEBRA',
            stars,
            subjectLabel: this.getSubjectLabel(q.subject || m.subject || 'NUMBER_ALGEBRA'),
          }
        })
        this.setData({ mistakes })
        this.applyFilter()
      })
      .catch(() => {
        // 接口失败降级:直接用本地数据
        const mistakes = localMistakes.map((m) => {
          const difficulty = m.difficulty || 3
          const stars = []
          for (let i = 0; i < difficulty; i++) {
            stars.push(i)
          }
          return {
            ...m,
            difficulty,
            stars,
            subjectLabel: this.getSubjectLabel(m.subject || 'NUMBER_ALGEBRA'),
          }
        })
        this.setData({ mistakes })
        this.applyFilter()
      })
  },

  getSubjectLabel(subject) {
    const map = {
      NUMBER_ALGEBRA: '数与代数',
      GEOMETRY: '图形几何',
      STATISTICS: '统计概率',
      PRACTICE: '综合实践',
    }
    return map[subject] || '其他'
  },

  applyFilter() {
    const { mistakes, activeFilter } = this.data
    if (activeFilter === 'all') {
      this.setData({ filteredMistakes: mistakes })
    } else {
      this.setData({ filteredMistakes: mistakes.filter((m) => m.subject === activeFilter) })
    }
  },

  onFilterChange(e) {
    this.setData({ activeFilter: e.currentTarget.dataset.key }, () => {
      this.applyFilter()
    })
  },

  toggleAnswer(e) {
    const id = e.currentTarget.dataset.id
    const showAnswer = {}
    for (const key in this.data.showAnswer) {
      showAnswer[key] = this.data.showAnswer[key]
    }
    showAnswer[id] = !showAnswer[id]
    this.setData({ showAnswer })
  },

  retryQuestion(e) {
    const id = e.currentTarget.dataset.id
    wx.navigateTo({ url: '/pages/thinking/index?questionId=' + id })
  },

  clearAll() {
    wx.showModal({
      title: '清空错题本',
      content: '确定要清空所有错题记录吗？',
      success: (res) => {
        if (res.confirm) {
          getApp().clearMistakes()
          this.setData({ mistakes: [], filteredMistakes: [] })
        }
      },
    })
  },

  goLogin() {
    wx.navigateTo({ url: '/pages/login/index' })
  },
  goPractice() {
    wx.navigateTo({ url: '/pages/thinking/index' })
  },
})
