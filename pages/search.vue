<template>
  <main>
    <section class="hero is-light">
      <div class="hero-body">
        <div class="container">
          <h1 class="title">
            {{ $t('search') }}
          </h1>
          <h2 class="subtitle">
            {{ $t('find_users_quickly') }}.
          </h2>
        </div>
      </div>
    </section>

    <section style="margin-top: 1rem;">
      <fluid-container>
        <div class="field">
          <div :class="{ 'control': true, 'has-icons-left': true, 'is-loading': is_searching }">
            <input class="input is-medium main-search-field" type="text" :placeholder="$t('search_users') + '...'" v-model="search_text">
            <span class="icon is-small is-left">
              <i class="fas fa-search"></i>
            </span>
          </div>
        </div>

        <div v-if="is_searching || current_search" class="wrapper">
          <div class="loader-5 center"><span></span></div>
        </div>

        <div v-if="matches && matches.length" class="box">
          <user-card
            v-for="item in matches"
            :key="item.id"
            :user="item"
          >
            {{ item }}
          </user-card>
        </div>
        <div v-if="matches && !matches.length" class="no-results">
          <p class="nanum">
            {{ $t('no_users') }}.
          </p>
        </div>

        <client-only>
          <infinite-loading v-if="matches" @infinite="nextPage" />
        </client-only>
      </fluid-container>
    </section>
  </main>
</template>

<script lang="ts">
import { Component, Vue } from 'nuxt-property-decorator';
import { handleError, makeTitle } from '~/utils/helpers';
import UserCard from '~/components/UserCard/UserCard';
import { StateChanger } from 'vue-infinite-loading';
import { ISentUser } from "~/utils/types/sent.entities.types";

@Component({
  components: {
    UserCard: UserCard,
  },
  scrollToTop: true,
  async asyncData({ route, app }) {
    if (route.query.q) {
      const query = route.query.q as string;

      try {
        const matches = (await app.$axios.get('users/find', { params: { q: query, size: 30 } })).data;
        return {
          matches,
          last_search: query,
          real_search_text: query,
          can_load_more: matches.length >= 30,
        };
      } catch (e) {
        // tant pis :(
      }
    }

    return { matches: null, last_search: "", real_search_text: "", can_load_more: false };
  },
  layout: 'default_solid',
})
export default class extends Vue {
  is_searching: any = 0;
  real_search_text!: string;
  last_search!: string;
  matches!: ISentUser[] | null;
  can_load_more!: boolean;
  current_search: number = 0;

  head() {
    return {
      title: makeTitle(this.$t('search').toString())
    }
  };

  get search_text() {
    return this.real_search_text;
  }

  set search_text(v: string) {
    this.real_search_text = v;

    if (v !== this.$route.query.q) {
      if (!v) {
        this.$router.replace({ query: {} });
      }
      else {
        this.$router.replace({ query: { q: v } });
      }
    }

    if (this.is_searching === -1) {
      return;
    }

    clearTimeout(this.is_searching);

    if (!v.trim()) {
      this.is_searching = 0;
      this.matches = null;
      this.last_search = "";
      this.can_load_more = false;
      return;
    }

    this.matches = null;
    this.is_searching = setTimeout(async () => {
      this.is_searching = 0;
      this.current_search = Math.random();
      const local_search = this.current_search;

      try {
        const matches = (await this.$axios.get('users/find', { params: { q: v.trim(), size: 30 } })).data as ISentUser[];

        if (this.current_search !== local_search) {
          // New search made
          return;
        }

        this.matches = matches;
        this.last_search = v;
        this.can_load_more = this.matches.length >= 30;
      } catch (e) {
        handleError(e, this);
      }

      this.current_search = 0;
    }, 700);
  }

  async nextPage($state: StateChanger) {
    if (this.is_searching === -1)
      return;

    if (!this.matches || this.matches.length === 0 || !this.can_load_more) {
      $state.complete();
      return;
    }

    this.is_searching = -1;

    try {
      const matches = (await this.$axios.get('users/find', {
        params: {
          q: this.last_search,
          until: this.matches[this.matches.length - 1].id
        }
      })).data as ISentUser[];

      this.matches = [...this.matches, ...matches];

      if (!matches.length) {
        $state.complete();
        this.can_load_more = false;
      }
      else {
        $state.loaded();
      }
    } catch (e) {
      handleError(e, this);
      $state.error();
    } finally {
      this.is_searching = 0;
    }
  }

  mounted() {
    const el = this.$el.querySelector('.main-search-field') as HTMLInputElement;
    el?.focus();
  }
}
</script>

<style lang="scss" scoped>
.no-results {
  margin-top: 3rem;
  text-align: center;
  font-size: 1.2rem;
}
.center {
  display: block;
  top: 0; left: 0;
  bottom: 0; right: 0;
  margin: auto;
}
.wrapper {
  width: 100%;
  max-width: 1000px;
  height: 100%;
  margin: 0 auto;
  margin-top: 3rem;
  margin-bottom: 2rem;
  animation: fade-in .3s;
}
@keyframes fade-in {
  0% {
    opacity: 0;
  }
  100% {
    opacity: 1;
  }
}
</style>
