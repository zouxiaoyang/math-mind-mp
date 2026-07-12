Component({
  data: {
    selected: 0,
    list: [
      { pagePath: '/pages/index/index', text: '学习', icon: '📚', iconActive: '📖' },
      { pagePath: '/pages/speed/index', text: '速算', icon: '⚡', iconActive: '⚡' },
      { pagePath: '/pages/report/index', text: '报告', icon: '📊', iconActive: '📈' },
      { pagePath: '/pages/generate/index', text: '出题', icon: '🤖', iconActive: '✨' },
      { pagePath: '/pages/profile/index', text: '我的', icon: '👤', iconActive: '🧑‍🎓' },
    ],
  },

  methods: {
    switchTab(e) {
      const { index } = e.currentTarget.dataset
      const item = this.data.list[index]
      const authRequired = ['/pages/profile/index', '/pages/generate/index']
      if (authRequired.includes(item.pagePath)) {
        const app = getApp()
        if (app && !app.isLoggedIn()) {
          wx.navigateTo({ url: '/pages/login/index' })
          return
        }
      }
      wx.switchTab({ url: item.pagePath })
      this.setData({ selected: index })
    },
  },

  pageLifetimes: {
    show() {
      if (typeof this.getTabBar === 'function' && this.getTabBar()) {
        this.getTabBar().setData({ selected: this.data.selected })
      }
    },
  },
})
