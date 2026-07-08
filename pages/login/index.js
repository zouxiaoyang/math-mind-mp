const api = require('../../utils/api')
const { showError } = require('../../utils/toast')

Page({
  data: {
    name: '',
    gradeIndex: 2,
    gradeList: [1, 2, 3, 4, 5, 6],
    semesterIndex: 0,
    semesterList: ['上学期', '下学期'],
    loading: false,
  },

  onNameInput(e) {
    this.setData({ name: e.detail.value })
  },

  onGradeChange(e) {
    this.setData({ gradeIndex: e.currentTarget.dataset.index })
  },

  onSemesterChange(e) {
    this.setData({ semesterIndex: e.currentTarget.dataset.index })
  },

  async handleLogin() {
    if (!this.data.name.trim()) {
      wx.showToast({ title: '请输入姓名', icon: 'none' })
      return
    }
    this.setData({ loading: true })
    try {
      const loginRes = await new Promise((resolve, reject) => {
        wx.login({ success: resolve, fail: reject })
      })
      if (!loginRes.code) {
        throw new Error('获取微信授权失败')
      }

      await api.login(
        loginRes.code,
        this.data.name.trim(),
        this.data.gradeList[this.data.gradeIndex]
      )
      wx.showToast({ title: '登录成功', icon: 'success' })
      setTimeout(() => wx.switchTab({ url: '/pages/index/index' }), 800)
    } catch (err) {
      showError(err)
    } finally {
      this.setData({ loading: false })
    }
  },
})
