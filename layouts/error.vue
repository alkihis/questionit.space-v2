<template>
  <full-error :title="errorText()" :subtitle="errorFullText()" />
</template>

<script>
import { makeTitle } from '../utils/helpers';
export default {
  props: ['error'],
  layout: 'default', // vous pouvez définir une mise en page personnalisée pour la page d'erreur
  mounted() {
    // { statusCode: number, path: string, message: string }
  },
  methods: {
    errorText() {
      switch (this.error.statusCode) {
        case 400:
          return this.$t('bad_request');
        case 403:
          return this.$t('forbidden');
        case 404:
          return this.$t('page_not_found');
        case 500:
        case 504:
          return this.$t('server_error');
        default:
          return this.$t('unknown_error');
      };
    },
    errorFullText() {
      switch (this.error.statusCode) {
        case 400:
          return this.$t('bad_request_message');
        case 403:
          return this.$t('forbidden_message');
        case 404:
          return this.$t('page_not_found_message');
        case 500:
        case 504:
          return this.$t('server_error_message');
        default:
          return this.$t('unknown_error_message');
      };
    },
    getThemeClass() {
      return this.$accessor.theme || '';
    }
  },
  head() {
    return {
      title: makeTitle(this.errorText()),
      htmlAttrs: {
        lang: this.$i18n.locale,
        'data-theme': this.getThemeClass(),
      },
      meta: [
        {
          hid: 'description',
          name: 'description',
          content: this.$t('home_catch_phrase'),
        },
        {
          property: 'og:description',
          content: this.$t('home_catch_phrase'),
          hid: 'og:description',
        },
      ],
    };
  },

}
</script>
