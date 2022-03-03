<template>
  <main>
    <section class="hero is-light">
      <div class="hero-body">
        <div class="container">
          <h1 class="title">
            {{ $t('privacy_policy') }}
          </h1>
          <h2 class="subtitle">
            {{ $t('privacy_policy_message') }}.
          </h2>
        </div>
      </div>
    </section>

    <fluid-container class="main content">
      <p class="is-size-4">
        {{ $t('privacy_page.intro') }}
      </p>

      <p>
        {{ $t('privacy_page.intro_1') }}

        <br><br>

        {{ $t('privacy_page.intro_2') }}

        <br><br>
        <strong>
          {{ $t('privacy_page.intro_3') }}
        </strong>
        <br>

        {{ $t('privacy_page.intro_4') }}
      </p>

      <p class="is-size-4">
        {{ $t('privacy_page.which_data') }}
      </p>

      <p>
        {{ $t('privacy_page.which_data_1') }}
      </p>
      <ul>
        <li>
          {{ $t('privacy_page.which_data_2') }}
        </li>
        <li>
          {{ $t('privacy_page.which_data_3') }}
        </li>
        <li>
          {{ $t('privacy_page.which_data_4') }}
        </li>
      </ul>

      <p class="is-size-4">
        {{ $t('privacy_page.usage') }}
      </p>

      <p>
        {{ $t('privacy_page.usage_1') }}

        <br>

        {{ $t('privacy_page.usage_2') }}
      </p>

      <p class="is-size-4">
       {{ $t('privacy_page.data') }}
      </p>

      <p>
        <i18n path="privacy_page.data_1" tag="span">
          <template #settings>
            <nuxt-link :to="localePath('/settings')">{{ $t('privacy_page.data_settings') }}</nuxt-link>
          </template>
          <template #mail>
            <a href="mailto:questionit.space@gmail.com">questionit.space@gmail.com</a>
          </template>
        </i18n>
      </p>

      <p class="is-size-4">
        {{ $t('privacy_page.data_access') }}
      </p>
      <p>
        {{ $t('privacy_page.data_access_1') }}
      </p>

      <p class="is-size-4">
        {{ $t('privacy_page.cookies') }}
      </p>
      <p>
        {{ $t('privacy_page.cookies_1') }}

        <br>
        {{ $t('privacy_page.cookies_2') }}
      </p>
    </fluid-container>
  </main>
</template>

<script lang="ts">
import { Vue, Component } from 'nuxt-property-decorator';
import { makeTitle } from '~/utils/helpers';

@Component({
  components: {},
  layout: 'default_solid',
})
export default class extends Vue {
  head() {
    return {
      title: makeTitle(this.$t('privacy_policy').toString()),
    };
  }
}
</script>

<style lang="scss" scoped>
.main {
  padding: 2rem 0 5rem 0;
  font-size: 1.15rem;
}
</style>
