<script lang="ts">
import { Vue, Component } from 'nuxt-property-decorator';
import { v4 as uuid } from 'uuid';

@Component({
  middleware: 'logged',
  components: {},
  layout: 'empty',
  async asyncData({ app, redirect }) {
    // Revoke the token (default: remove used token to make request)
    const all_tokens: string[] = app.$accessor.availableTokens;

    // Delete the token from axios cache
    app.$axios.setToken(false);

    // Remove every token
    for (const token of all_tokens) {
      try {
        await app.$axios.delete('auth/token', { headers: { Authorization: 'Bearer ' + token } });
      } catch (e) { }
    }

    // Empty the store
    app.$accessor.removeAllUsers();

    // Delete the cookie that store tokens
    app.$cookies.remove('token', { path: '/' });
    app.$cookies.remove('current_token', { path: '/' });

    // Set the session ID instead
    let sessionId = app.$accessor.sessionId || uuid();
    app.$accessor.setSessionId(sessionId);
    app.$axios.setToken(sessionId, 'Session');
    app.$cookies.set('session_id', sessionId, { path: '/' });

    return redirect(app.localePath('/'));
  }
})
export default class extends Vue {}
</script>
