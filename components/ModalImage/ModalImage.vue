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

<script lang="ts" src="./ModalImage.ts"></script>
