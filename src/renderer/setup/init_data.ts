import { initSessionsIfNeeded } from '../stores/session-store'

export async function initData() {
  await initSessionsIfNeeded()
}
