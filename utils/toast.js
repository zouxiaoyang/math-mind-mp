/**
 * User-facing toast helpers.
 *
 * Centralises the "extract a readable message from an unknown error" logic so
 * every catch block doesn't re-invent String(e).slice(0, 50).
 */

function normalizeError(e) {
  if (!e) {return '出错了，请稍后再试'}
  if (typeof e === 'string') {return e}
  if (e.msg || e.message) {return e.msg || e.message}
  return '出错了，请稍后再试'
}

function showError(e) {
  wx.showToast({ title: String(normalizeError(e)).slice(0, 50), icon: 'none' })
}

function showSuccess(title) {
  wx.showToast({ title, icon: 'success' })
}

module.exports = { normalizeError, showError, showSuccess }
