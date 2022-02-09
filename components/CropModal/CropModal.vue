<template>
  <bulma-modal :open="true" @card="true" @close="$emit('close')" :large="true">
    <header class="modal-card-head">
      <p class="modal-card-title">{{ $t('crop_image') }}</p>
      <button class="delete" aria-label="close" @click="$emit('close')"></button>
    </header>
    <section class="modal-card-body">
      <div v-if="image">
        <div class="modal-crop-container"></div>
      </div>
    </section>
    <footer class="modal-card-foot is-flex-right">
      <button class="button" @click="$emit('close')">{{ $t('cancel') }}</button>
      <button 
        :disabled="croppie_loading"
        :class="{ 'button': true, 'is-success': true, 'is-loading': croppie_loading }" 
        @click="crop()"
      >{{ $t('apply') }}</button>
    </footer>
  </bulma-modal>
</template>

<style lang="scss" scoped>
  .modal-crop-container {
    width: 100%;
    min-height: 200px;
  }
</style>

<script lang="ts" src="./CropModal.ts"></script>
