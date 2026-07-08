const BASE_URL = 'https://api.jiuyuefunds.com'

let loadingCount = 0
function showLoading() {
  loadingCount++
  if (loadingCount === 1) {
    wx.showLoading({ title: '加载中...', mask: true })
  }
}
function hideLoading() {
  loadingCount = Math.max(0, loadingCount - 1)
  if (loadingCount === 0) {
    wx.hideLoading()
  }
}

function request(options) {
  const app = getApp()
  const token = app && app.isLoggedIn() ? wx.getStorageSync('token') : null

  return new Promise(function (resolve, reject) {
    showLoading()
    var ms = options.timeout || 15000
    var timeout = setTimeout(function () {
      hideLoading()
      reject('请求超时，请检查网络')
    }, ms)

    wx.request({
      url: BASE_URL + options.url,
      method: options.method || 'GET',
      data: options.data || {},
      header: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: 'Bearer ' + token } : {}),
      },
      success: function (res) {
        clearTimeout(timeout)
        hideLoading()
        if (res.statusCode === 401) {
          wx.removeStorageSync('token')
          wx.removeStorageSync('userInfo')
          var a = getApp()
          if (a) {
            a.globalData.token = null
            a.globalData.userInfo = null
          }
          wx.showToast({ title: '登录已过期', icon: 'none' })
          setTimeout(function () {
            wx.reLaunch({ url: '/pages/login/index' })
          }, 1000)
          return reject('未登录')
        }
        if (res.data && res.data.success) {
          resolve(res.data)
        } else {
          reject(res.data ? res.data.error : '请求失败')
        }
      },
      fail: function (err) {
        clearTimeout(timeout)
        hideLoading()
        reject(err.errMsg || '网络错误')
      },
    })
  })
}

function getUserId() {
  var user = wx.getStorageSync('userInfo')
  return user ? user.id : null
}

module.exports = {
  login: function (code, name, grade) {
    return new Promise(function (resolve, reject) {
      wx.request({
        url: BASE_URL + '/api/auth',
        method: 'POST',
        data: { code: code, name: name, grade: grade },
        header: { 'Content-Type': 'application/json' },
        success: function (res) {
          if (res.data && res.data.success && res.data.data) {
            var user = res.data.data
            wx.setStorageSync('token', user.id)
            wx.setStorageSync('userInfo', user)
            var a = getApp()
            if (a) {
              a.globalData.token = user.id
              a.globalData.userInfo = user
            }
            resolve(user)
          } else {
            reject(res.data ? res.data.error : '登录失败')
          }
        },
        fail: function (err) {
          reject(err.errMsg || '网络错误')
        },
      })
    })
  },
  getQuestions: function (params) {
    var qs = Object.entries(params)
      .filter(function (v) {
        return v[1] !== undefined && v[1] !== ''
      })
      .map(function (v) {
        return v[0] + '=' + v[1]
      })
      .join('&')
    return request({ url: '/api/exams?' + qs, method: 'GET' }).then(function (res) {
      return Object.assign({}, res, { data: res.data })
    })
  },
  createExam: function (data) {
    return request({
      url: '/api/exams',
      method: 'POST',
      data: Object.assign({}, data, { userId: getUserId() }),
    })
  },
  submitAnswer: function (data) {
    return request({
      url: '/api/answers',
      method: 'POST',
      timeout: 60000,
      data: Object.assign({}, data, { userId: getUserId() }),
    })
  },
  generateQuestions: function (data) {
    return request({
      url: '/api/questions/generate',
      method: 'POST',
      timeout: 60000,
      data: Object.assign({}, data, { userId: getUserId() }),
    })
  },
  getReport: function () {
    var userId = getUserId()
    return request({ url: '/api/reports/user/' + (userId || 'anonymous'), method: 'GET' })
  },
  getParentReport: function () {
    var userId = getUserId()
    return request({ url: '/api/reports/parent?userId=' + (userId || 'anonymous'), method: 'GET' })
  },
  saveSpeedResult: function (data) {
    return request({
      url: '/api/speed',
      method: 'POST',
      data: Object.assign({}, data, { userId: getUserId() }),
    })
  },
  getCurrentUser: function () {
    return wx.getStorageSync('userInfo') || null
  },
  isLoggedIn: function () {
    return !!wx.getStorageSync('userInfo')
  },
  logout: function () {
    wx.removeStorageSync('token')
    wx.removeStorageSync('userInfo')
    var a = getApp()
    if (a) {
      a.globalData.token = null
      a.globalData.userInfo = null
    }
  },

  // 获取错题列表（后端优先，后端不可用时回读到本地缓存）
  getMistakes: function () {
    var userId = getUserId()
    return request({ url: '/api/mistakes?userId=' + (userId || 'anonymous'), method: 'GET' })
      .then(function (res) {
        return res.data
      })
      .catch(function (err) {
        console.log('Get mistakes failed, falling back to local cache:', err)
        return getApp() && getApp().getMistakes ? getApp().getMistakes() : []
      })
  },

  // 获取单道题目（用于错题重做）
  getQuestionById: function (questionId) {
    return request({ url: '/api/questions/' + questionId, method: 'GET' })
      .then(function (res) {
        return res.data
      })
      .catch(function (err) {
        console.log('Get question failed:', err)
        return null
      })
  },
}
