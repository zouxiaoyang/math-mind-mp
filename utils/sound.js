/**
 * Sound & vibration feedback utilities
 *
 * Wraps wx.vibrateShort / wx.vibrateLong for game-style haptic feedback.
 * Each function is safe to call from any page — it no-ops silently if the
 * device API is unavailable.
 */

const SCORE_MAP = {
  light: { duration: 15 },
  medium: { duration: 40 },
}

/**
 * Short single buzz — fired on a correct answer.
 */
function correctVibrate() {
  wx.vibrateShort({ type: 'light' })
}

/**
 * Double buzz — fired on a wrong answer.
 * Two light pulses separated by a brief pause.
 */
function wrongVibrate() {
  wx.vibrateShort({ type: 'light' })
  setTimeout(() => {
    wx.vibrateShort({ type: 'medium' })
  }, 120)
}

/**
 * Special celebratory pattern — fired on streak achievements.
 * Light → pause → long → pause → light.
 */
function streakVibrate() {
  wx.vibrateShort({ type: 'light' })
  setTimeout(() => {
    wx.vibrateLong()
  }, 150)
  setTimeout(() => {
    wx.vibrateShort({ type: 'light' })
  }, 500)
}

module.exports = {
  correctVibrate,
  wrongVibrate,
  streakVibrate,
}
