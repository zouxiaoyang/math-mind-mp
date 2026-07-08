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
    showAnalysis: false,
    analysis: null,
    submitted: false,
    submitting: false,
    progress: 0,
    loading: false,
    poolSize: 0,
    fromMistakes: false,
    mistakeQuestionId: '',
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
        this.setData({
          questions: [q],
          currentIdx: 0,
          questionStars: '★'.repeat(q.difficulty || 3),
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

  // 开始训练（从题库抽题）
  async startTraining() {
    this.setData({ loading: true })
    try {
      const res = await api.createExam({
        grade: this.data.grade,
        semester: this.data.semester,
        difficulty: this.data.difficulty || null,
        count: this.data.count,
      })

      if (!this._loaded) {
        return
      }
      if (res.data.questions.length > 0) {
        this.setData({
          questions: res.data.questions,
          currentIdx: 0,
          questionStars: '★'.repeat(res.data.questions[0].difficulty || 3),
          answer: '',
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

  onAnswerInput(e) {
    this.setData({ answer: e.detail.value })
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
    const { questions, currentIdx, answer } = this.data
    if (!questions[currentIdx] || !answer.trim()) {
      return
    }
    this.setData({ submitting: true })
    this._startProgress()
    try {
      const res = await api.submitAnswer({
        questionId: questions[currentIdx].id,
        content: answer,
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
