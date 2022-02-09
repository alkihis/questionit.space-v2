<template>
  <div v-if="enable_pull_to_refresh" data-pull-enabled="ptr">
    <div key="content">
      <slot />
    </div>
  </div>
  <div v-else data-pull-disabled>
    <div key="content">
      <slot />
    </div>
  </div>
</template>

<style lang="scss" scoped>
</style>

<script lang="ts">
import { Vue, Component, Prop } from 'nuxt-property-decorator';
import { getLoaderText } from '~/utils/helpers';

@Component({})
export default class extends Vue {
  @Prop({ type: Function, required: true }) method!: Function;

  enable_pull_to_refresh = false;

  get pull_loader_config() {
    return getLoaderText(this);
  }

  mounted() {
    this.enable_pull_to_refresh = true;
    const config = this.pull_loader_config;

    this.$nextTick(() => {
      window.PullToRefresh.init({
        mainElement: '[data-pull-enabled="ptr"]',
        onRefresh: async () => {
          await this.method();
        },
        ...config,
      });
    });
  }

  beforeDestroy() {
    window.PullToRefresh.destroyAll();
  }
}
</script>
