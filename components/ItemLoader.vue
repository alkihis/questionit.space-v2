<template>
  <div>
    <transition name="slide">
      <div v-if="count > 0" class="loader-root nanum" @click="$emit('load')">
        <div class="loader-content">
          {{ formatted_count }} {{ text }}
        </div>
      </div>
    </transition>
  </div>
</template>

<style lang="scss" scoped>
.slide-enter-active {
  transition-duration: .5s;
  transition-timing-function: ease;
}

.slide-leave-active {
  transition-duration: .2s;
  transition-timing-function: ease-out;
}

.slide-enter-to, .slide-leave {
  max-height: 5rem;
  overflow: hidden;
}

.slide-enter, .slide-leave-to {
  overflow: hidden;
  max-height: 0;
}

.loader-root {
  text-align: center;
  display: flex;
  align-content: center;
  align-items: center;
  justify-content: center;
  height: 5rem;
  color: var(--item-loader-text-color);
  font-size: 1.2rem;

  .loader-content {
    cursor: pointer;
    padding: .5rem 1rem;
    border-radius: 12px;
    background-color: var(--item-loader-bg-color);
  }
}
</style>

<script lang="ts">
import { Vue, Component, Prop } from 'nuxt-property-decorator';

@Component({})
export default class extends Vue {
  @Prop({ required: true, type: Number }) count!: number;
  @Prop({ required: true, type: String }) text!: string;

  get formatted_count() {
    if (this.count > 9)
      return '9+';
    return this.count;
  }
}
</script>
