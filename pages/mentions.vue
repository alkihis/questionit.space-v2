<template>
  <main>
    <section class="hero is-light">
      <div class="hero-body">
        <div class="container">
          <h1 class="title">
            {{ $t('legal_mentions') }}
          </h1>
          <h2 class="subtitle">
            {{ $t('learn_more_about_questionit') }}.
          </h2>
        </div>
      </div>
    </section>

    <fluid-container class="main content">
      <p class="is-size-4">
        {{ $t('mentions_page.preambule') }}
      </p>
      <p>
        {{ $t('mentions_page.preambule_1') }}

        <br>

        {{ $t('mentions_page.preambule_2') }}

        <br>

        {{ $t('mentions_page.preambule_3') }}
      </p>

      <p class="is-size-4">
        {{ $t('mentions_page.privacy_policy') }}
      </p>

      <p>
        <i18n path="mentions_page.privacy_policy_1" tag="span">
          <template #link>
            <nuxt-link :to="localePath('/privacy')">{{ $t('mentions_page.privacy_policy_find_here') }}</nuxt-link>
          </template>
        </i18n>
      </p>

      <p class="is-size-4">
        {{ $t('mentions_page.legal_mentions') }}
      </p>
      <p>
        <i18n path="mentions_page.legal_mentions_1" tag="span">
          <template #name>
            <strong>Louis BÉRANGER</strong>
          </template>
          <template #location>
            <strong>Saint-Priest (69800)</strong>
          </template>
        </i18n>
        <br>

        {{ $t('mentions_page.legal_mentions_2') }}
        <br>

        SAS PulseHeberg, 55 avenue des champs Pierreux, 92012 Nanterre Cedex<br>
        +33 (0) 1 79 73 62 22<br>
        <a href="https://pulseheberg.com/fr" target="_blank">pulseheberg.com/fr</a><br>
      </p>

      <p class="is-size-4">
        {{ $t('mentions_page.services') }}
      </p>

      <p>
        {{ $t('mentions_page.services_1') }}
      </p>
      <ul>
        <li>
          {{ $t('mentions_page.services_2') }}
        </li>
        <li>
          {{ $t('mentions_page.services_3') }}
        </li>
        <li>
          {{ $t('mentions_page.services_4') }}
        </li>
      </ul>

      <p>
        {{ $t('mentions_page.services_5') }}

        <br>

        {{ $t('mentions_page.services_6') }}
      </p>

      <ul>
        <li>
          {{ $t('mentions_page.services_7') }}
        </li>
        <li>
          {{ $t('mentions_page.services_8') }}
        </li>
      </ul>

      <p>
        {{ $t('mentions_page.services_9') }}

        <br>

        {{ $t('mentions_page.services_10') }}

        <br>

        {{ $t('mentions_page.services_11') }}

        <br>

        <i18n path="mentions_page.services_12" tag="span">
          <template #link>
            <a href="mailto:questionit.space@gmail.com" target="_blank">questionit.space@gmail.com</a>
          </template>
        </i18n>
      </p>


      <p class="is-size-4">
        {{ $t('mentions_page.intellectual_property') }}
      </p>

      <p>
        {{ $t('mentions_page.intellectual_property_1') }}<br>

        {{ $t('mentions_page.intellectual_property_2') }}<br>

        {{ $t('mentions_page.intellectual_property_3') }}<br>

        {{ $t('mentions_page.intellectual_property_4') }}<br>

        {{ $t('mentions_page.intellectual_property_5') }}<br>

        <br>

        <strong>
          <i18n path="mentions_page.intellectual_property_6" tag="span">
            <template #link>
              <a href="mailto:questionit.space@gmail.com" target="_blank">questionit.space@gmail.com</a>
            </template>
          </i18n>
        </strong>

        {{ $t('mentions_page.intellectual_property_7') }}
      </p>

      <p class="is-size-4">
        {{ $t('mentions_page.personal_data') }}
      </p>

      <p>
        {{ $t('mentions_page.personal_data_1') }}

        <br>

        {{ $t('mentions_page.personal_data_2') }}

        <br>

        {{ $t('mentions_page.personal_data_3') }}

        <br>

        {{ $t('mentions_page.personal_data_4') }}

        <br>

        <i18n path="mentions_page.personal_data_5" tag="span">
          <template #link>
            <a href="mailto:questionit.space@gmail.com" target="_blank">questionit.space@gmail.com</a>
          </template>
        </i18n>
      </p>

      <p class="is-size-4">
        {{ $t('mentions_page.responsability') }}
      </p>

      <p>
        {{ $t('mentions_page.responsability_1') }}

        <br>

        {{ $t('mentions_page.responsability_2') }}

        <br>

        {{ $t('mentions_page.responsability_3') }}

        <br>

        {{ $t('mentions_page.responsability_4') }}
      </p>

      <p class="is-size-4">
        {{ $t('mentions_page.contract') }}
      </p>

      <p>
        {{ $t('mentions_page.contract_1') }}

        <br>

        {{ $t('mentions_page.contract_2') }}

        <br>

        {{ $t('mentions_page.contract_3') }}
      </p>

      <p class="is-size-4">
        {{ $t('mentions_page.publications') }}
      </p>

      <p>
        {{ $t('mentions_page.publications_1') }}
        <br>

        {{ $t('mentions_page.publications_2') }}
        <br>

        {{ $t('mentions_page.publications_3') }}
        <br>

        {{ $t('mentions_page.publications_4') }}
      </p>

      <p class="is-size-4">
        {{ $t('mentions_page.images') }}
      </p>
      <p>
        {{ $t('mentions_page.images_1') }}
        <br>

        <i18n path="mentions_page.images_2" tag="span">
          <template #link>
            <a href="http://www.freepik.com" target="_blank" rel="noopener noreferrer">designées par Freepik</a>
          </template>
        </i18n>
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
      title: makeTitle(this.$t('legal_mentions').toString()),
    };
  }
}
</script>

<style lang="scss" scoped>
.main {
  padding: 2rem 0 5rem 0;
}
</style>
