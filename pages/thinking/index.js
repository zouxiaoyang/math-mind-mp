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
    difficultyIndex: 2,
    count: 5,
    countIndex: 2,
    stars: '★★',
    questions: [],
    currentIdx: 0,
    questionStars: '★★',
    answer: '',
    showAnalysis: false,
    analysis: null,
    submitted: false,
    loading: false,
    poolSize: 0,
    fromMistakes: false,
    mistakeQuestionId: '',
  },

  onLoad(options) {
    // 如果是从错题本跳转来的，加载指定题目
    if (options && options.questionId) {
      this.setData({ fromMistakes: true, mistakeQuestionId: options.questionId })
      this.loadSingleQuestion(options.questionId)
    }
  },

  async loadSingleQuestion(questionId) {
    this.setData({ loading: true })
    try {
      const res = await apiRequest('/api/questions/' + questionId, null, 'GET')
      if (res.success && res.data) {
        const q = res.data
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
      wx.showToast({ title: String(err).slice(0, 50), icon: 'none' })
    } finally {
      this.setData({ loading: false })
    }
  },

  onGradeChange(e) { this.setData({ grade: parseInt(e.detail.value) + 1 }) },
  onSemesterChange(e) { this.setData({ semester: parseInt(e.detail.value) + 1 }) },
  
  onDifficultyChange(e) {
    const idx = parseInt(e.detail.value)
    const d = idx  // 索引即难度值：0=全部, 1=★, 2=★★, ...
    this.setData({ 
      difficultyIndex: idx,
      difficulty: d, 
      stars: d > 0 ? '★'.repeat(d) : '' 
    })
  },

  onCountChange(e) {
    const idx = parseInt(e.detail.value)
    const counts = [1, 3, 5, 10]
    this.setData({ 
      countIndex: idx,
      count: counts[idx] 
    })
  },

  // 预览题库
  async previewPool() {
    this.setData({ loading: true })
    try {
      const params = new URLSearchParams({
        grade: this.data.grade,
        semester: this.data.semester,
        limit: '1',
      })
      if (this.data.difficulty) params.set('difficulty', this.data.difficulty)
      
      const res = await apiRequest(`/api/exams?${params.toString()}`, null, 'GET')
      this.setData({ poolSize: res.data ? res.data.length : 0 })
    } catch (err) {
      console.log('Preview error:', err)
    } finally {
      this.setData({ loading: false })
    }
  },

  // 开始训练（从题库抽题）
  async startTraining() {
    this.setData({ loading: true })
    try {
      const user = wx.getStorageSync('userInfo')
      const res = await apiRequest('/api/exams', {
        grade: this.data.grade,
        semester: this.data.semester,
        difficulty: this.data.difficulty || null,
        count: this.data.count,
        userId: user ? user.id : null,
      })

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
      wx.showToast({ title: String(err).slice(0, 50), icon: 'none' })
    } finally {
      this.setData({ loading: false })
    }
  },

  onAnswerInput(e) { this.setData({ answer: e.detail.value }) },

  async submitAnswer() {
    const { questions, currentIdx, answer } = this.data
    if (!questions[currentIdx] || !answer.trim()) return
    try {
      const user = wx.getStorageSync('userInfo')
      const res = await apiRequest('/api/answers', {
        questionId: questions[currentIdx].id,
        content: answer,
        userId: user?.id || null,
      })
      if (res.success) {
        this.setData({ showAnalysis: true, submitted: true, analysis: { ...res.data.analysis, method: res.data.analysisMethod || 'smart_fallback' } })
        if (res.data.analysis && !res.data.analysis.isCorrect && getApp()) {
          const q = questions[currentIdx]
          getApp().addMistake({
            questionId: q.id,
            content: q.content,
            userAnswer: answer,
            correctAnswer: q.answer,
          })
        } else if (res.data.analysis && res.data.analysis.isCorrect && getApp() && this.data.fromMistakes) {
          // 答对了，从错题本移除
          getApp().removeMistake(questions[currentIdx].id)
          wx.showToast({ title: '答对了！已从错题本移除', icon: 'success' })
        }
      }
    } catch (err) {
      wx.showToast({ title: '提交失败', icon: 'none' })
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
