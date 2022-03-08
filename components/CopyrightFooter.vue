<template>
  <span :class="{ 'with-theme-colors': useTheme }">
    <span>
      <nuxt-link :to="localePath('/mentions')" class="lang-link legal-mentions">{{ $t('legal_mentions') }}</nuxt-link>
      •
      <nuxt-link v-if="$i18n.locale !== 'en'" :to="switchLocalePath('en')" class="lang-link">Switch to <strong>English</strong></nuxt-link>
      <nuxt-link v-if="$i18n.locale !== 'fr'" :to="switchLocalePath('fr')" class="lang-link">Voir en <strong>Français</strong></nuxt-link>
    </span>

    <br />

    <span>
      <a href="https://github.com/alkihis/questionit.space-v2" target="_blank" class="lang-link legal-mentions">{{ $t('view_on_github') }}</a>
    </span>
  </span>

</template>

<style lang="scss" scoped>
  .lang-link {
    color: rgb(180, 236, 255);

    &:hover {
      text-decoration: underline;
    }
  }

  .with-theme-colors .lang-link {
    color: var(--link-color);
  }
</style>

<script lang="ts">
import { Vue, Component, Prop } from 'nuxt-property-decorator';

@Component({})
export default class extends Vue {
  @Prop({ default: false, type: Boolean })
  useTheme!: boolean;
}
</script>
