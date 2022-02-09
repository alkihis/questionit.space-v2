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
          <div :class="{ 'control': true, 'has-icons-left': true }">
            <input class="input is-medium main-search-field" type="text" :placeholder="$t('search_users') + '...'" v-model="searchText">
            <span class="icon is-small is-left">
              <i class="fas fa-search"></i>
            </span>
          </div>
        </div>

        <div v-if="matches && matches.items.length" class="box">
          <user-card
            v-for="item in matches.items"
            :key="item.id"
            :user="item"
          >
            {{ item }}
          </user-card>
        </div>
        <div v-if="matches && !matches.items.length" class="no-results">
          <p class="nanum">
            {{ $t('no_users') }}.
          </p>
        </div>

        <client-only>
          <infinite-loading v-if="matches" :identifier="infiniteId" @infinite="nextPage">
            <template #spinner>
              <span />
            </template>
          </infinite-loading>
        </client-only>

        <div v-if="loading" class="wrapper">
          <div class="loader-5 center"><span></span></div>
        </div>
      </fluid-container>
    </section>
  </main>
</template>

<script lang="ts">
import { Component, Vue } from "nuxt-property-decorator";
import { handleError, makeTitle } from "~/utils/helpers";
import UserCard from "~/components/UserCard.vue";
import { StateChanger } from "vue-infinite-loading";
import { IPaginatedWithIdsResult, ISentUser } from "~/utils/types/sent.entities.types";

const pageSize = 30;

@Component({
  components: {
    UserCard,
  },
  scrollToTop: true,
  layout: 'default_solid',
})
export default class extends Vue {
  loading = false;
  isSearching: any = 0;
  realSearchText: string = '';
  lastSearch: string = '';
  matches: IPaginatedWithIdsResult<ISentUser> | null = null;
  canLoadMore: boolean = false;
  infiniteId = 0;

  head() {
    return {
      title: makeTitle(this.$t('search').toString()),
    }
  };

  get searchText() {
    return this.realSearchText;
  }

  set searchText(value: string) {
    this.realSearchText = value;

    if (value !== this.$route.query.q) {
      if (!value) {
        this.$router.replace({ query: {} });
      }
      else {
        this.$router.replace({ query: { q: value } });
      }
    }

    this.makeNewSearch(value);
  }

  makeNewSearch(value: string) {
    clearTimeout(this.isSearching);

    if (!value.trim()) {
      this.isSearching = 0;
      this.matches = null;
      this.lastSearch = '';
      this.canLoadMore = false;
      this.loading = false;
      return;
    }

    this.matches = null;
    this.loading = true;

    this.isSearching = setTimeout(async () => {
      this.isSearching = 0;

      try {
        this.matches = await this.$axios.$get('user/search', {
          params: {
            q: value.trim(),
            pageSize
          },
        }) as IPaginatedWithIdsResult<ISentUser>;
        this.lastSearch = value;
        this.canLoadMore = this.matches.items.length >= pageSize;
        this.infiniteId = Math.random();
        this.loading = false;
      } catch (e) {
        handleError(e, this);
      }
    }, 700);
  }

  async nextPage($state: StateChanger) {
    if (this.isSearching === -1)
      return;

    if (!this.matches || this.matches.items.length === 0 || !this.canLoadMore) {
      $state.complete();
      return;
    }

    this.isSearching = -1;
    const idBeforeFetch = this.infiniteId;
    this.loading = true;

    try {
      const matches = await this.$axios.$get('user/search', {
        params: {
          q: this.lastSearch,
          untilId: this.matches.items[this.matches.items.length - 1].id,
          pageSize,
        }
      }) as IPaginatedWithIdsResult<ISentUser>;

      if (this.infiniteId !== idBeforeFetch) {
        return;
      }

      this.matches.items = [...this.matches.items, ...matches.items];
      this.loading = false;

      if (!matches.items.length) {
        $state.complete();
        this.canLoadMore = false;
      }
      else {
        $state.loaded();
      }
    } catch (e) {
      handleError(e, this);
      $state.error();
      this.loading = false;
    } finally {
      this.isSearching = 0;
    }
  }

  mounted() {
    const el = this.$el.querySelector('.main-search-field') as HTMLInputElement;
    el?.focus();

    const query = this.$route.query.q as string;

    if (query) {
      this.searchText = query;
    }
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
