const api = require('../../utils/api')

Page({
  data: {
    gameState: 'idle',
    grade: 3,
    difficulty: 2,
    stars: '★★',
    timeLeft: 60,
    score: 0,
    streak: 0,
    maxStreak: 0,
    problem: null,
    input: '',
    feedback: null,
    totalAnswered: 0,
    correctCount: 0,
  },

  timer: null,

  onUnload() { if (this.timer) clearInterval(this.timer) },

  generateProblem() {
    const d = this.data.difficulty
    const ops = d <= 2 ? ['+', '-'] : d <= 4 ? ['+', '-', '×'] : ['+', '-', '×', '÷']
    const op = ops[Math.floor(Math.random() * ops.length)]
    const maxNum = d <= 2 ? 50 : d <= 4 ? 100 : 500
    const maxMult = d <= 2 ? 9 : 12
    let a, b, answer
    switch (op) {
      case '+': a = Math.floor(Math.random() * maxNum) + 1; b = Math.floor(Math.random() * maxNum) + 1; answer = a + b; break
      case '-': a = Math.floor(Math.random() * maxNum) + 1; b = Math.floor(Math.random() * a) + 1; answer = a - b; break
      case '×': a = Math.floor(Math.random() * maxMult) + 1; b = Math.floor(Math.random() * maxMult) + 1; answer = a * b; break
      case '÷': b = Math.floor(Math.random() * (maxMult - 1)) + 2; answer = Math.floor(Math.random() * maxMult) + 1; a = b * answer; break
      default: a = 1; b = 1; answer = 2
    }
    return { a, b, op, answer }
  },

  startGame() {
    const problem = this.generateProblem()
    const startTime = Date.now()
    this.setData({ gameState: 'playing', timeLeft: 60, score: 0, streak: 0, maxStreak: 0, problem, input: '', feedback: null, totalAnswered: 0, correctCount: 0, startTime })
    if (this.timer) clearInterval(this.timer)
    this.timer = setInterval(() => {
      if (this.data.timeLeft <= 0) {
        clearInterval(this.timer)
        this.setData({ gameState: 'finished' })
        this.saveResult(startTime)
        return
      }
      this.setData({ timeLeft: this.data.timeLeft - 1 })
    }, 1000)
  },

  async saveResult(startTime) {
    const { score, correctCount, totalAnswered, maxStreak, difficulty } = this.data
    if (totalAnswered === 0) return
    try {
      const timeSpent = Math.round((Date.now() - startTime) / 1000)
      await api.saveSpeedResult({ score, correctCount, totalAnswered, maxStreak, difficulty, timeSpent })
    } catch (err) {
      console.log('Save speed result failed:', err)
    }
  },

  onInput(e) { this.setData({ input: e.detail.value }) },

  onKeyTap(e) {
    const key = e.currentTarget.dataset.key
    const input = this.data.input + key
    if (input.length <= 5) this.setData({ input })
  },

  onBackspace() {
    const input = this.data.input
    if (input.length > 0) this.setData({ input: input.slice(0, -1) })
  },

  focusInput() {
    // 兼容：点击输入框区域不再弹出系统键盘（自定义键盘已替代）
  },

  submitAnswer() {
    const { problem, input, streak, totalAnswered, correctCount, maxStreak } = this.data
    if (!problem || !input.trim()) return
    const isCorrect = parseInt(input, 10) === problem.answer
    if (isCorrect) {
      const newStreak = streak + 1
      this.setData({ score: this.data.score + 10 * Math.min(newStreak, 5), streak: newStreak, maxStreak: Math.max(maxStreak, newStreak), feedback: 'correct', correctCount: correctCount + 1 })
    } else {
      this.setData({ streak: 0, feedback: 'wrong' })
    }
    this.setData({ totalAnswered: totalAnswered + 1 })
    setTimeout(() => this.setData({ feedback: null }), 350)
    this.setData({ problem: this.generateProblem(), input: '' })
  },

  selectGrade(e) {
    const g = parseInt(e.currentTarget.dataset.grade)
    this.setData({ grade: g })
  },

  onGradeChange(e) { this.setData({ grade: parseInt(e.detail.value) + 1 }) },

  onDifficultyChange(e) {
    const d = parseInt(e.detail.value) + 1
    this.setData({ difficulty: d, stars: '★'.repeat(d) })
  },

  changeDifficulty(e) {
    const d = e.currentTarget.dataset.diff
    this.setData({ difficulty: d, stars: '★'.repeat(d) })
  },
})