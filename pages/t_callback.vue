<template>
  <div>
    <div v-if="error">
      <full-error v-if="is_api_error" :error="error"></full-error>
      <full-error v-else :title="$t('twitter_no_token')" :subtitle="$t('unable_to_login_twitter')"></full-error>
    </div>
  </div>
</template>

<script lang="ts">
import { Vue, Component } from 'nuxt-property-decorator';
import { makeTitle, isAxiosError, convertAxiosError, handleError } from '~/utils/helpers';
import { getPushSubscription } from '~/utils/push.subscription.utils';
import { ISentUser } from "~/utils/types/sent.entities.types";

// Handle requests made back with twitter API.

@Component({
  components: {},
  async asyncData({ app, query }) {
    // Get the tokens from twitter callback query
    const { oauth_token, oauth_verifier } = query;

    // If all tokens are defined
    if (oauth_token && oauth_verifier) {
      try {
        const { data: { token, user } } = await app.$axios.get('token/from-twitter/access', {
          params: { oauthToken: oauth_token, oauthVerifier: oauth_verifier },
        });

        let previous_user: [ISentUser, string] | undefined = undefined;

        // Check if account is already logged / existant in account list
        // if so, switch to this account
        // Register the user (if it doesn't exists)
        app.$accessor.addLoggedUser([user, token]);

        // Switch push notification holder if already logged in (save it in order to change it)
        if (app.$accessor.isLogged) {
          const couples: [ISentUser, string][] = app.$accessor.userTokenCouples;
          const couple = couples.find(e => e[0].id === app.$accessor.loggedUser!.id);

          if (couple) {
            previous_user = couple;
          }
        }

        app.$accessor.switchUser(user);

        // Store token & user
        app.$axios.setToken(token, 'Bearer');

        // console.log("Setting token to cookies");
        // set current token
        // Get full token list
        const list_of_tokens = app.$accessor.tokenString;

        app.$cookies.set('token', list_of_tokens, { expires: new Date("2099-01-01"), path: '/' });
        app.$cookies.set('current_token', token, { expires: new Date("2099-01-01"), path: '/' });

        // Will be redirected on mount
        return { previous_user };
      } catch (error) {
        if (isAxiosError(error) && error.response && error.response.data) {
          error = convertAxiosError(error);
        }
        return { error };
      }
    }
    else {
      return {
        error: "No token"
      };
    }
  },
  layout: 'empty',
})
export default class extends Vue {
  error: any = null;
  previous_user?: [ISentUser, string];

  head() {
    if (this.error) {
      return {
        title: makeTitle(this.$t('twitter_login_failed').toString()),
      };
    }
    return {};
  }

  get is_api_error() {
    return typeof this.error === 'object' && 'response' in this.error;
  }

  async mounted() {
    // Redirect if all is ok !
    if (!this.error) {
      if (this.previous_user && this.$accessor.isLogged) {
        // Switch push notification holder
        const current = await getPushSubscription();

        if (current) {
          try {
            // Send notif in behalf of previous user
            await this.$axios.post('push/update', {
              endpoint: current.endpoint,
              target: this.$accessor.loggedUser!.id,
              token: this.$accessor.token
            }, { headers: { 'Authorization': 'Bearer ' + this.previous_user[1] } });
          } catch (e) {
            handleError(e, this);
          }
        }
      }

      // If cookie redirect to appflow !
      const query_token = this.$cookies.get('redirect_after');

      if (query_token) {
        this.$cookies.remove('redirect_after');
        return this.$router.push(this.localePath('/appflow') + '?token=' + encodeURIComponent(query_token));
      }

      return this.$router.push(this.localePath('/s'));
    }
  }
}
</script>
