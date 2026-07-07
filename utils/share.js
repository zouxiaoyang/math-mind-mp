/**
 * Share poster & share-menu utilities
 *
 * Helps pages configure wx.showShareMenu and build dynamic
 * onShareAppMessage responses based on the user's score.
 */

/**
 * Enable both share channels (friends + moments) on a page.
 * Call from onLoad or onReady inside a page.
 *
 * @param {string[]} [additionalPaths] — optional list of paths that can open the shared card
 */
function enableShare(additionalPaths) {
  wx.showShareMenu({
    withShareTicket: true,
    menus: ['shareAppMessage', 'shareTimeline'],
    ...(additionalPaths ? { sharePaths: additionalPaths } : {}),
  })
}

/**
 * Returns an onShareAppMessage handler that picks a title based on score.
 *
 * Usage inside a page:
 *   Page({
 *     onShareAppMessage: makeShareHandler({ prefix: '数学思维训练', getPath })
 *   })
 *
 * @param {Object}   opts
 * @param {string}   opts.prefix          — app / subject name prepended to the title
 * @param {number}   [opts.score]         — current score (0-100)
 * @param {number}   [opts.streak]        — current streak count
 * @param {Function} [opts.getPath]       — () => string  returns the share target page path
 * @returns {WechatMiniprogram.Page.ICustomShareContent}
 */
function makeShareHandler({ prefix = '数学思维训练', score, streak, getPath } = {}) {
  return function onShareAppMessage() {
    let title = prefix

    if (typeof score === 'number') {
      if (score >= 90) {
        title = `我在${prefix}拿了 ${score} 分，来挑战我吧！`
      } else if (score >= 60) {
        title = `我在${prefix}拿了 ${score} 分，一起加油！`
      } else {
        title = `一起来${prefix}练数学吧！`
      }
    }

    if (typeof streak === 'number' && streak >= 3) {
      title = `🔥 连对 ${streak} 题！${title}`
    }

    return {
      title,
      path: getPath ? getPath() : '/pages/index/index',
      promise: undefined,
    }
  }
}

/**
 * Convenience: share to friends only (no moments).
 * Use when the card content is not suitable for timeline.
 */
function enableShareToFriends() {
  wx.showShareMenu({
    withShareTicket: false,
    menus: ['shareAppMessage'],
  })
}

module.exports = {
  enableShare,
  enableShareToFriends,
  makeShareHandler,
}
