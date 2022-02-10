<template>
  <div class="user-settings-theme-chooser">
    <div class="select">
      <select v-model="theme">
        <option v-for="theme in availableThemes" :key="theme[0]" :value="theme[0]">
          {{ theme[1] }}
        </option>
      </select>
    </div>
    <client-only>
      <div v-if="selectedTheme === 'Auto'" class="field-explaination">
        {{ $t('theme_automatic_tooltip') }}
      </div>
    </client-only>
  </div>
</template>

<script lang="ts">
import { Component, Vue } from "nuxt-property-decorator";
import { EAllowedThemes } from "~/utils/types/theme.types";
import { switchTheme } from "~/utils/helpers";

@Component({
  components: {}
})
export default class extends Vue {
  selectedTheme: keyof typeof EAllowedThemes = 'Auto';

  beforeMount() {
    const t = this.$accessor.theme;
    this.selectedTheme = t.slice(0, 1).toUpperCase() + t.slice(1) as keyof typeof EAllowedThemes;
  }

  get availableThemes() {
    return [
      ['Auto', this.$t('auto_theme')],
      ['Light', this.$t('light_theme')],
      ['Dark', this.$t('dark_theme')]
    ];
  }

  get theme() {
    return this.selectedTheme;
  }

  set theme(value: keyof typeof EAllowedThemes) {
    this.selectedTheme = value;

    (async () => {
      await switchTheme(value);

      if (value && value in EAllowedThemes) {
        this.$accessor.setTheme(value.toLowerCase());
        this.$cookies.set('theme', value, { path: '/', expires: new Date('2099-01-01') });
      }
    })();
  }
}
</script>

<style lang="scss" scoped>
.select + .field-explaination {
  margin-top: .5rem;
  color: var(--settings-field-explaination);
  font-size: .9rem;
}
</style>
