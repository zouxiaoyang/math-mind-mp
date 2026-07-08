/**
 * Auth state helpers shared across pages.
 *
 * The "read current user + set hasLogin/userName" pattern repeats in every
 * page. Centralise it so the source-of-truth logic lives in one place.
 */
const api = require('./api')

/**
 * Compute the fields a page usually wants from the logged-in user.
 * @returns {{ hasLogin: boolean, userName: string, user: object|null }}
 */
function loginState() {
  const user = api.getCurrentUser()
  return { hasLogin: !!user, userName: user ? user.name : '', user }
}

module.exports = { loginState }
