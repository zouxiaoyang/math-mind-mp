const api = require('../../utils/api')
const { showError } = require('../../utils/toast')

Page({
  data: {
    grade: 3,
    semester: 1,
    difficulty: 2,
    difficultyIndex: 2,
    count: 5,
    countIndex: 2,
    stars: '★★',
    theta: 2.5,
    thetaLevel: 2,
    thetaStars: '★★',
    questions: [],
    currentIdx: 0,
    questionStars: '★★',
    answer: '',
    selectedOption: '',
    showAnalysis: false,
    analysis: null,
    submitted: false,
    submitting: false,
    progress: 0,
    loading: false,
    poolSize: 0,
    fromMistakes: false,
    mistakeQuestionId: '',
    questionTypes: [
      { key: 'CHOICE', label: '选择题', active: true },
      { key: 'JUDGE', label: '判断题', active: true },
      { key: 'CALCULATION', label: '计算题', active: true },
      { key: 'APPLICATION', label: '应用题', active: true },
    ],
    selectedTypes: ['CHOICE', 'JUDGE', 'CALCULATION', 'APPLICATION'],
    optLetters: ['A', 'B', 'C', 'D'],
  },
  _loaded: true,
  _progressTimer: null,
  onUnload() {
    this._loaded = false
    if (this._progressTimer) {
      clearInterval(this._progressTimer)
    }
  },

  onLoad(options) {
    // 如果是从错题本跳转来的,加载指定题目
    if (options && options.questionId) {
      this.setData({ fromMistakes: true, mistakeQuestionId: options.questionId })
      this.loadSingleQuestion(options.questionId)
    }
    // 初始化难度为当前能力值
    const theta = getApp() ? getApp().getTheta() : 2.5
    const rounded = Math.round(theta)
    this.setData({
      theta: theta.toFixed(1),
      thetaLevel: rounded,
      thetaStars: '★'.repeat(rounded),
      difficulty: rounded,
      difficultyIndex: rounded - 1,
      stars: '★'.repeat(rounded),
    })
  },

  async loadSingleQuestion(questionId) {
    this.setData({ loading: true })
    try {
      const q = await api.getQuestionById(questionId)
      if (!this._loaded) {
        return
      }
      if (q) {
        const parsed = this.parseQuestion(q)
        this.setData({
          questions: [parsed],
          currentIdx: 0,
          questionStars: '★'.repeat(parsed.difficulty || 3),
          answer: '',
          showAnalysis: false,
          analysis: null,
          submitted: false,
        })
      } else {
        wx.showToast({ title: '题目加载失败', icon: 'none' })
      }
    } catch (err) {
      showError(err)
    } finally {
      if (this._loaded) {
        this.setData({ loading: false })
      }
    }
  },

  onGradeChange(e) {
    this.setData({ grade: parseInt(e.detail.value) + 1 })
  },
  onSemesterChange(e) {
    this.setData({ semester: parseInt(e.detail.value) + 1 })
  },

  onDifficultyChange(e) {
    const idx = parseInt(e.detail.value)
    const d = idx // 索引即难度值：0=全部, 1=★, 2=★★, ...
    this.setData({
      difficultyIndex: idx,
      difficulty: d,
      stars: d > 0 ? '★'.repeat(d) : '',
    })
  },

  onCountChange(e) {
    const idx = parseInt(e.detail.value)
    const counts = [1, 3, 5, 10]
    this.setData({
      countIndex: idx,
      count: counts[idx],
    })
  },

  // 预览题库
  async previewPool() {
    this.setData({ loading: true })
    try {
      const res = await api.getQuestions({
        grade: this.data.grade,
        semester: this.data.semester,
        difficulty: this.data.difficulty || '',
        limit: '1',
      })
      if (!this._loaded) {
        return
      }
      this.setData({ poolSize: res && res.data ? res.data.length : 0 })
    } catch (err) {
      wx.showToast({ title: '题目预览失败，可尝试开始', icon: 'none' })
    } finally {
      if (this._loaded) {
        this.setData({ loading: false })
      }
    }
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

  // 开始训练（从题库抽题）
  async startTraining() {
    this.setData({ loading: true })
    try {
      const res = await api.createExam({
        grade: this.data.grade,
        semester: this.data.semester,
        difficulty: this.data.difficulty || null,
        count: this.data.count,
        types: this.data.selectedTypes,
      })

      if (!this._loaded) {
        return
      }
      if (res.data.questions.length > 0) {
        const qs = res.data.questions.map((q) => this.parseQuestion(q))
        this.setData({
          questions: qs,
          currentIdx: 0,
          questionStars: '★'.repeat(qs[0].difficulty || 3),
          answer: '',
          selectedOption: '',
          showAnalysis: false,
        })
      } else {
        wx.showToast({ title: '暂无可用题目', icon: 'none' })
      }
    } catch (err) {
      showError(err)
    } finally {
      if (this._loaded) {
        this.setData({ loading: false })
      }
    }
  },

  parseQuestion(q) {
    if (q.type !== 'CHOICE') {return q}
    // 后端已解析 options,直接使用
    if (q.options && Object.keys(q.options).length >= 2) {
      return q
    }
    // 兜底:content 里仍包含选项行,客户端解析
    if (!q.content) {return q}
    const optPattern = /^([A-D])[．.、:：)）\]\s]+(.+)$/
    const options = {}
    const stemLines = []
    for (const line of q.content.split('\n')) {
      const trimmed = line.trim()
      if (!trimmed) {continue}
      const m = trimmed.match(optPattern)
      if (m) {
        options[m[1]] = m[2].trim()
      } else {
        stemLines.push(line.trim())
      }
    }
    if (Object.keys(options).length >= 2) {
      return { ...q, stem: stemLines.join('\n'), options }
    }
    return q
  },

  onAnswerInput(e) {
    this.setData({ answer: e.detail.value })
  },

  selectOption(e) {
    if (this.data.submitted) {return}
    const opt = e.currentTarget.dataset.opt
    const q = this.data.questions[this.data.currentIdx]
    if (q.type === 'JUDGE') {
      this.setData({ selectedOption: opt, answer: opt })
    } else {
      this.setData({ selectedOption: opt, answer: opt })
    }
  },

  // 模拟进度:前快后慢,到 90% 等接口完成再拉到 100%
  _startProgress() {
    this.setData({ progress: 0 })
    this._progressTimer = setInterval(() => {
      const p = this.data.progress
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

  async submitAnswer() {
    if (this.data.submitting || this.data.submitted) {
      return
    }
    const { questions, currentIdx, answer, selectedOption } = this.data
    const q = questions[currentIdx]
    if (!q) {return}
    if (q.type === 'CHOICE' || q.type === 'JUDGE') {
      if (!selectedOption) {return}
    } else if (!answer.trim()) {
      return
    }
    this.setData({ submitting: true })
    this._startProgress()
    try {
      const res = await api.submitAnswer({
        questionId: q.id,
        content: answer,
        selectedOption: q.type === 'CHOICE' || q.type === 'JUDGE' ? selectedOption : undefined,
      })
      this._stopProgress()
      if (!this._loaded) {
        return
      }
      if (res.success) {
        this.setData({
          showAnalysis: true,
          submitted: true,
          submitting: false,
          analysis: { ...res.data.analysis, method: res.data.analysisMethod || 'smart_fallback' },
        })
        if (res.data.analysis && getApp()) {
          const q = questions[currentIdx]
          const newTheta = getApp().updateTheta(res.data.analysis.isCorrect, q.difficulty || 3)
          this.setData({ theta: newTheta.toFixed(1) })
        }
        if (res.data.analysis && !res.data.analysis.isCorrect && getApp()) {
          const q = questions[currentIdx]
          getApp().addMistake({
            questionId: q.id,
            content: q.content,
            userAnswer: answer,
            correctAnswer: q.answer,
          })
        } else if (
          res.data.analysis &&
          res.data.analysis.isCorrect &&
          getApp() &&
          this.data.fromMistakes
        ) {
          getApp().removeMistake(questions[currentIdx].id)
          wx.showToast({ title: '答对了！已从错题本移除', icon: 'success' })
        }
      }
    } catch (err) {
      this._stopProgress()
      wx.showToast({ title: '提交失败', icon: 'none' })
      this.setData({ submitting: false })
    }
  },

  nextQuestion() {
    if (this.data.currentIdx + 1 < this.data.questions.length) {
      const next = this.data.currentIdx + 1
      this.setData({
        currentIdx: next,
        answer: '',
        selectedOption: '',
        showAnalysis: false,
        analysis: null,
        submitted: false,
        questionStars: '★'.repeat(this.data.questions[next].difficulty || 3),
      })
    } else {
      wx.showModal({
        title: '完成！',
        content: '你已完成所有题目',
        showCancel: false,
        success: () => wx.switchTab({ url: '/pages/index/index' }),
      })
    }
  },

  onShareAppMessage() {
    return { title: '数学思维训练 - 来挑战你的思维！', path: '/pages/thinking/index' }
  },
})
