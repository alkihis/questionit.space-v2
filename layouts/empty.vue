<template>
  <nuxt />
</template>

<script lang="ts">
import { Component, Vue } from 'nuxt-property-decorator';

@Component({
  components: {}
})
export default class extends Vue {
  head() {
    // Set the lang attribute in html tag
    return {
      htmlAttrs: {
        lang: this.$i18n.locale,
        'data-theme': this.theme_class,
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
  }

  get theme_class() {
    return this.$accessor.theme || '';
  }
}
</script>
