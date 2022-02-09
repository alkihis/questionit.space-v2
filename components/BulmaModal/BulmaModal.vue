<template>
  <div :class="{ modal: true, 'is-active': open }">
    <div class="modal-background" @click="$emit('close')"></div>
    <div :class="{ 'modal-content': !card, 'modal-card': card, 'is-large': large, 'is-flexible': flexible }">
      <slot />
    </div>
    <button 
      v-if="!card" 
      class="modal-close is-large closer" 
      aria-label="close" 
      @click="$emit('close')"
    ></button>
  </div>
</template>

<style lang="scss" scoped>
  .modal-content.is-large {
    @media screen and (min-width: 767px) {
      width: 760px;
    }
  }

  .modal-content.is-flexible {
    @media screen and (min-width: 767px) {
      max-width: 640px;
      width: auto;
    }
  }

  .closer {
    z-index: 32767;
    background-color: rgba(10, 10, 10, 0.37);
  }
</style>

<script lang="ts" src="./BulmaModal.ts"></script>
