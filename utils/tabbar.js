// 在 tab 页 onShow 里调用,同步自定义 tabBar 选中态
function syncTabBar(page) {
  if (typeof page.getTabBar === 'function' && page.getTabBar()) {
    const tabBar = page.getTabBar()
    const currentRoute = '/' + page.route
    const idx = tabBar.data.list.findIndex(function (item) {
      return item.pagePath === currentRoute
    })
    if (idx >= 0 && tabBar.data.selected !== idx) {
      tabBar.setData({ selected: idx })
    }
  }
}

module.exports = { syncTabBar }
