<template>
  <bulma-modal :open="true" @close="$emit('close')" :flexible="true">
    <video v-if="is_video" autoplay loop muted playsinline :src="url" alt="Full question GIF" />
    <img v-else :src="url" alt="Full question image" />
  </bulma-modal>
</template>

<style lang="scss" scoped>
  img, video {
    display: block;
    max-width: 100%;
    max-height: 100%;
  }
</style>

<script lang="ts">
import { Component, Vue, Prop } from 'nuxt-property-decorator';
import BulmaModal from './BulmaModal.vue';

@Component({
  components: {
    BulmaModal,
  }
})
export default class extends Vue {
  @Prop({ required: true, type: String }) url!: string;

  get is_video() {
    return this.url.endsWith('.mp4');
  }
}
</script>
