/**
 * Sound & vibration feedback utilities
 *
 * Each function is safe to call from any page — it no-ops silently if the
 * device API is unavailable.
 */

// Base64-encoded short keyboard click sound (800Hz sine, 50ms fade-out)
const CLICK_B64 = 'UklGRkQDAABXQVZFZm10IBAAAAABAAEAQB8AAIA+AAACABAAZGF0YSADAAAAAFISkh1/HS8SAADp7c3i4OIM7gAA3BHUHMEcuREAAF7ui+Oe44LuAABnERUcAhxEEQAA1O5K5F3k9+4AAPEQVxtEG84QAABJ7wjlG+Vt7wAAfBCZGoYaWRAAAL/vxuXZ5eLvAAAGENsZyBnjDwAANfCE5pfmWPAAAJEPHRkKGW0PAACq8ELnVefN8AAAGw9eGEsY+A4AACDxAegU6EPxAACmDqAXjReCDgAAlfG/6NLouPEAADAO4hbPFg0OAAAL8n3pkOku8gAAug0kFhEWlw0AAIDyO+pO6qTyAABFDWYVUxUiDQAA9vL66g3rGfMAAM8MpxSUFKwMAABr87jry+uP8wAAWgzpE9YTNwwAAOHzduyJ7AT0AADkCysTGBPBCwAAV/Q07UftevQAAG8LbRJaEksLAADM9PLtBe7v9AAA+QqvEZwR1goAAEL1se7E7mX1AACECvAQ3RBgCgAAt/Vv74Lv2vUAAA4KMhAfEOsJAAAt9i3wQPBQ9gAAmAl0D2EPdQkAAKL26/D+8Mb2AAAjCbYOow4ACQAAGPep8bzxO/cAAK0I9w3kDYoIAACN92jye/Kx9wAAOAg5DSYNFQgAAAP4JvM58yb4AADCB3sMaAyfBwAAefjk8/fznPgAAE0HvQuqCykHAADu+KL0tfQR+QAA1wb/CuwKtAYAAGT5YPVz9Yf5AABiBkAKLQo+BgAA2fkf9jL2/fkAAOwFgglvCckFAABP+t328PZy+gAAdgXECLEIUwUAAMT6m/eu9+j6AAABBQYI8wfeBAAAOvtZ+Gz4XfsAAIsESAc1B2gEAACv+xj5K/nT+wAAFgSJBnYG8gMAACX81vnp+Uj8AACgA8sFuAV9AwAAm/yU+qf6vvwAACsDDQX6BAcDAAAQ/VL7Zfsz/QAAtQJPBDwEkgIAAIb9EPwj/Kn9AABAApEDfQMcAgAA+/3P/OL8H/4AAMoB0gK/AqcBAABx/o39oP2U/gAAVAEUAgECMQEAAOb+S/5e/gr/AADfAFYBQwG8AAAAXP8J/xz/f/8AAGkAmACFAEYAAADR/8f/2v/1/w=='

let clickAudioCtx = null

/**
 * Play a short keyboard click sound.
 * Uses a base64 WAV — no external files needed.
 */
function playTap() {
  try {
    if (!clickAudioCtx) {
      clickAudioCtx = wx.createInnerAudioContext()
      clickAudioCtx.src = `data:audio/wav;base64,${CLICK_B64}`
    }
    clickAudioCtx.stop()
    clickAudioCtx.play()
  } catch (e) {
    // silent fail — some environments don't support audio
  }
}

/**
 * Short single buzz — fired on a correct answer.
 */
function correctVibrate() {
  playTap()
  wx.vibrateShort({ type: 'light' })
}

/**
 * Double buzz — fired on a wrong answer.
 * Two light pulses separated by a brief pause.
 */
function wrongVibrate() {
  playTap()
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
  playTap()
  wx.vibrateShort({ type: 'light' })
  setTimeout(() => {
    wx.vibrateLong()
  }, 150)
  setTimeout(() => {
    wx.vibrateShort({ type: 'light' })
  }, 500)
}

module.exports = {
  playTap,
  correctVibrate,
  wrongVibrate,
  streakVibrate,
}
