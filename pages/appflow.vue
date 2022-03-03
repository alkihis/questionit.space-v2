<template>
  <main>
    <div v-if="emitter === null" class="error">
      <section class="hero is-light">
        <div class="hero-body">
          <div class="container">
            <h1 class="title">
              {{ $t('bad_request') }}
            </h1>
          </div>
        </div>
      </section>

      <fluid-container class="error-root">
        <p class="nanum error-text">
          {{ $t('unable_to_check_application') }}
        </p>
      </fluid-container>
    </div>
    <div v-else class="app-flow-root">
      <section class="hero is-light">
        <div class="hero-body">
          <div class="container">
            <h1 class="title">
              {{ $t('using_app_name', { name: emitter }) }}
            </h1>
          </div>
        </div>
      </section>

      <fluid-container class="auth-content nanum">
        <div class="auth-account">
          <img :src="$accessor.loggedUser.profilePictureUrl" alt="Profile picture of logged used" />
          <span class="name">{{ $accessor.loggedUser.name }}</span>
          <span class="slug">@{{ $accessor.loggedUser.slug }}</span>
        </div>

        <div v-if="!has_approved" class="auth-permissions">
          <p class="auth-header">
            {{ $t('this_app_can_do') }}
          </p>

          <ul class="auth-list">
            <li class="auth-option">
              - {{ $t('read_profile_informations') }}
            </li>
            <li v-for="option in permissions" :key="option[0]" class="auth-option">
              - {{ option[1] }}
            </li>
          </ul>
        </div>
        <div v-else-if="pin" class="auth-pin">
          <p>
            {{ $t('please_enter_pin_in_app') }}
          </p>

          <pre>{{ pin }}</pre>
        </div>
        <div v-else class="auth-denied">
          {{ $t('auth_flow_denied') }}
        </div>

        <div v-if="!has_approved" class="authorization-buttons">
          <button
            :disabled="loading"
            :class="{ button: true, 'is-loading': loading }"
            @click="deny()"
          >{{ $t('deny') }}</button>

          <button
            :disabled="loading"
            :class="{ button: true, 'is-info': true, 'is-loading': loading }"
            @click="approve()"
          >{{ $t('approve') }}</button>
        </div>
      </fluid-container>
    </div>

    <div class="auth-footer">
      <div class="logo-container">
        <img class="white" :src="white_logo" alt="QuestionIt logo" />
        <img class="black" :src="black_logo" alt="QuestionIt logo" />
        <span>QuestionIt.space</span>
      </div>

      <p class="nanum go-home">
        <nuxt-link :to="localePath('/privacy')">{{ $t('privacy_policy') }}</nuxt-link>
        <br />
        <nuxt-link :to="localePath('/')">{{ $t('home_title') }}</nuxt-link>
      </p>
    </div>
  </main>
</template>

<style lang="scss" scoped>
  @import '~/assets/css/functions.scss';

  .auth-content {
    margin-top: 2rem;

    .auth-account {
      display: grid;

      width: max-content;
      margin-left: 1rem;
      margin-bottom: 2rem;

      grid-template-areas:
        "picture name"
        "picture slug";

      img {
        grid-area: picture;
        display: block;
        height: 56px;
        width: auto;
        border-radius: 10px;
        border: 1px solid var(--divider-border-color);
        margin-right: .8rem;
      }

      .name {
        grid-area: name;
        align-self: flex-end;
        font-weight: bold;
        font-size: 1.3rem;
      }

      .slug {
        grid-area: slug;
        align-self: flex-start;
        font-size: .95rem;
        margin-top: -.3rem;
      }
    }

    .auth-permissions {
      .auth-header {
        font-size: 1.7rem;
      }

      .auth-list {
        margin: 1rem 0 3rem .5rem;

        .auth-option {
          font-size: 1.1rem;
          font-weight: bold;
        }
      }
    }

    .auth-pin {
      p {
        margin-top: 2rem;
        font-size: 1.2rem;
      }

      pre {
        text-align: center;
        border-radius: 8px;
        font-size: 2.5rem;
        padding: 1rem;
        margin-top: 2rem;
        margin-bottom: 3rem;
      }
    }

    .auth-denied {
      margin-top: 2rem;
      margin-bottom: 3rem;
      font-size: 1.2rem;
    }

    .authorization-buttons {
      display: flex;
      justify-content: space-between;
      margin-bottom: 3rem;

      & > button:first-child {
        margin-right: 1rem;
      }
    }
  }

  .error {
    margin-bottom: 3rem;

    .error-text {
      font-size: 1.2rem;
    }

    .error-root {
      margin-top: 2rem;
    }
  }

  .auth-footer {
    margin-bottom: 4rem;

    .logo-container {
      text-align: center;
      margin-bottom: 2rem;

      img {
        height: 56px;
        width: auto;
        display: block;
        margin: auto;

        &.black {
          @include dark-theme {
            display: none;
          }
        }

        &.white {
          display: none;

          @include dark-theme {
            display: block;
          }
        }
      }

      span {
        font-weight: 300;
        font-size: .8rem;
      }
    }

    .go-home {
      text-align: center;
      font-size: 1.3rem;
    }
  }
</style>

<script lang="ts">
import { Component, Vue } from 'nuxt-property-decorator';
import { convertAxiosError, FULL_BLACK_LOGO, FULL_WHITE_LOGO, handleError, makeTitle } from '~/utils/helpers';
import { allowedPermissions } from "~/utils/types/sent.entities.types";

type ValidatedToken = { pin: string } | { validator: string, url: string };

@Component({
  components: {
  },
  scrollToTop: true,
  async asyncData({ route, app, redirect }) {
    if (!app.$accessor.isLogged) {
      // Store redirect app flow
      if (typeof route.query.token === 'string') {
        app.$cookies.set('redirect_after', route.query.token, { path: '/', expires: new Date('2099-01-01') });
      }
      return redirect(app.localePath('/login'));
    }

    if (typeof route.query.token === 'string') {
      const token = route.query.token;

      try {
        const data = await app.$axios.$get('application/token', { params: { token } });

        return {
          emitter: data.emitter,
          rights: data.rights,
        };
      } catch (e: any) {
        // tant pis :(
        console.log(convertAxiosError(e));
      }
    }

    return { emitter: null, rights: {} };
  },
  layout: 'empty',
})
export default class extends Vue {
  emitter!: null | string;
  rights!: { [name: string]: string };

  loading = false;
  pin: string | null = null;
  denied = false;

  get white_logo() {
    return FULL_WHITE_LOGO;
  }

  get black_logo() {
    return FULL_BLACK_LOGO;
  }

  head() {
    return {
      title: this.emitter ? makeTitle(this.$t('authorize_app_title', { name: this.emitter }).toString()) : makeTitle()
    };
  }

  get has_approved() {
    return !!(this.pin || this.denied);
  }

  get token() {
    return this.$route.query.token;
  }

  get permissions() {
    return allowedPermissions
      .filter(option => this.rights[option])
      .map(option => [option, this.$t('end_user_permissions.' + option)]);
  }

  async approve() {
    if (this.loading || this.has_approved)
      return;

    this.loading = true;

    try {
      const verification: ValidatedToken = await this.$axios.$post('application/approve', { token: this.token });

      if ('pin' in verification) {
        // Pin check
        this.pin = verification.pin;
      }
      else {
        // URL is already valid, redirecting
        window.location.href = verification.url;
      }
    } catch (e) {
      handleError(e, this);
    }

    this.loading = false;
  }

  async deny() {
    if (this.loading || this.has_approved)
      return;

    this.loading = true;

    try {
      const verification: { denied: boolean | string } = await this.$axios.$post('application/approve', { deny: this.token });

      if (typeof verification.denied === 'boolean') {
        // Pin check
        this.denied = true;
      }
      else {
        // URL is already valid, redirecting
        window.location.href = verification.denied;
      }
    } catch (e) {
      handleError(e, this);
    }

    this.loading = false;
  }
}
</script>
