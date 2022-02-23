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

<script lang="ts">
import { Vue, Component, Prop, Watch } from 'nuxt-property-decorator';

@Component({
  components: {},
})
export default class extends Vue {
  @Prop({ type: Boolean, default: false })
  open!: boolean;

  @Prop({ type: Boolean, default: false })
  large!: boolean;

  @Prop({ type: Boolean, default: false })
  card!: boolean;

  @Prop({ type: Boolean, default: false })
  flexible!: boolean;

  uuid = String(Math.random());

  @Watch('open')
  onOpenChange(v: boolean) {
    document.documentElement.removeAttribute('data-modal-' + this.uuid);

    if (v) {
      this.set();
    }
    else {
      this.cleanup();
    }
  }

  mounted() {
    if (this.open) {
      this.set();
    }
  }

  set() {
    document.documentElement.setAttribute('data-modal-' + this.uuid, '');
    document.documentElement.style.overflow = 'hidden';
    document.documentElement.style.height = '100%';
  }

  cleanup() {
    let found = false;
    for (let i = 0; i < document.documentElement.attributes.length; i++) {
      const attr = document.documentElement.attributes[i];

      if (attr.name.startsWith('data-modal-')) {
        found = true;
        break;
      }
    }

    if (!found) {
      document.documentElement.style.removeProperty('overflow');
      document.documentElement.style.removeProperty('height');
    }
  }

  beforeDestroy() {
    if (this.open) {
      document.documentElement.removeAttribute('data-modal-' + this.uuid);
    }

    this.cleanup();
  }
}
</script>
