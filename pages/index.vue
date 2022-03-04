<template>
  <main>
    <section>
      <div style="flex-grow: 2"></div>

      <div>
        <img class="main-img" src="/images/logo/BannerWhite.png" />
        <h2 class="slogan nanum">{{ $t('slogan') }}</h2>
      </div>

      <aside class="main-buttons">
        <nuxt-link v-if="!$accessor.isLogged" :to="localePath('/login')" class="button is-white is-outlined has-bg-transition is-large-desktop">
          <span class="icon twitter-i">
            <i class="fab fa-twitter" />
          </span>
          <span>{{ $t('login') }}</span>
        </nuxt-link>

        <nuxt-link v-else :to="localePath('/home')" class="button is-white is-outlined has-bg-transition is-large-desktop">
          <span class="icon twitter-i">
            <i class="fas fa-globe-europe" />
          </span>
          <span>{{ $t('timeline') }}</span>
        </nuxt-link>
      </aside>
    </section>
    <footer>
      <div class="content nanum">
        <p>
          <span class="questionit-copyright">
            QuestionIt.space - Version {{ version }}
          </span>
          <br />

          <copyright-footer />
        </p>
      </div>
    </footer>
  </main>
</template>

<style lang="scss" scoped>
  main {
    display: flex;
    flex-direction: column;
    flex: 1 0 auto;
    background-image: url('/images/background/astro.jpg');

    html.webp & {
      background-image: url('/images/background/astro.webp');
    }

    background-size: cover;
    background-position: center;
    height: 100vh;
    text-align: center;
    overflow-y: hidden;

    section {
      display: flex;
      justify-content: space-around;
      flex-flow: column wrap;
      align-items: stretch;
      height: 100%;
      color: white;

      .main-img {
        max-width: 1200px;
        width: 50vw;
        height: auto;

        @media screen and (max-width: 900px) {
          width: 70vw;
        }

        @media screen and (max-width: 500px) {
          width: 90vw;
        }
      }

      h2 {
        font-size: 3rem;
        color: white;
        opacity: .85;
        margin-top: -2rem;

        @media screen and (max-width: 900px) {
          font-size: 5vw;
          letter-spacing: -.08rem;
          margin-top: -1rem;
        }

        @media screen and (max-width: 500px) {
          font-size: 7vw;
        }
      }

      aside {
        display: flex;
        justify-content: center;
        flex-grow: 3;
        align-items: center;

        .icon:first-child:not(:last-child).twitter-i {
          margin-right: .7rem;
          margin-left: 0;
        }
      }
    }
  }

  .main-buttons {
    display: flex;
    flex-direction: column;

    & > *:not(:last-child) {
      margin-bottom: 1rem;
    }
  }

  .is-large-desktop {
    @media screen and (min-width: 1024px) {
      font-size: 1.4rem;
    }
  }

  .slogan {
    font-weight: bold;
    letter-spacing: -.05rem;
    text-shadow: 1px 1px 3px black;
  }

  footer {
    width: 100%;
    color: white;
    text-align: center;
    padding-bottom: 1.5rem;
    font-size: 1.2rem;

    @media screen and (max-width: 1023px) {
      font-size: 1.1rem;
    }

    .content {
      margin: 0 auto;
      width: 70%;
      max-width: 800px;

      @media screen and (max-width: 1023px) {
        width: 90%;
      }
    }

    .questionit-copyright {
      font-weight: bold;
    }
  }
</style>

<script lang="ts">
import { Vue, Component } from 'nuxt-property-decorator';
// @ts-ignore
import Logo from '~/components/Logo.vue';
// @ts-ignore
import CopyrightFooter from '~/components/CopyrightFooter.vue';
import { makeTitle, QUESTION_IT_VERSION } from '~/utils/helpers';

// see https://github.com/nuxt-community/nuxt-property-decorator/
// https://github.com/kaorun343/vue-property-decorator
@Component({
  components: { Logo, CopyrightFooter },
  layout: 'raw_navbar',
  asyncData({ redirect, app }) {
    if (app.$accessor.loggedUser) {
      // If we're logged in, redirect to home timeline.
      return redirect(app.localePath('/home'));
    }
  },
})
export default class extends Vue {
  crop_modal = false;

  get token() {
    return this.$accessor.token;
  }

  get version() {
    return QUESTION_IT_VERSION;
  }

  get user() {
    return this.$accessor.loggedUser;
  }

  get is_logged() {
    return this.$accessor.isLogged;
  }

  head() {
    return {
      title: makeTitle(this.$t('home_title').toString()),
    };
  }

  async mounted() {
    // This is only called on client side !
  }
}
</script>
