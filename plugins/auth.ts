import { Context } from '@nuxt/types';

export default ({ app: { $axios, $accessor } }: Context) => {
  // Register credential helper
  if ($accessor.token) {
    $axios.setToken($accessor.token, 'Bearer');
  }
  else if ($accessor.sessionId) {
    $axios.setToken($accessor.sessionId, 'Session');
  }
}
