<template>
  <div :class="{ 'allow-choice': allowChoice, 'poll-choices-root': true }">
    <div
      v-for="ichoice in choices"
      :key="ichoice"
      :class="{ 'poll-choice': true, 'selected': choice === ichoice, 'nanum': true }"
      @click="$emit('item-select', ichoice)"
    >
      {{ ichoice }}
    </div>
  </div>
</template>

<style lang="scss" scoped>
  @import '~/assets/css/functions.scss';

  .poll-choices-root {
    display: flex;
    flex-direction: column;
    width: 100%;

    &:not(.allow-choice) {
      margin-top: 1rem;

      .poll-choice:not(.selected) {
        color: var(--poll-answered-text-color);
        border-color: var(--poll-answered-not-selected-border-color);
      }
    }

    &.allow-choice .poll-choice {
      cursor: pointer;
      transition: background-color .3s, border-color .3s;

      &:hover {
        background-color: var(--poll-hover-background);
      }

      & + .poll-choice {
        margin-top: .8rem;
      }
    }

    .poll-choice {
      width: 100%;
      border-radius: 8px;
      min-height: 2rem;
      padding: 8px 14px;
      border: 1px var(--poll-not-selected-border-color) solid;
      color: var(--poll-unanswered-text-color);
      font-weight: 500;

      & + .poll-choice {
        margin-top: .5rem;
      }

      &.selected {
        background-color: var(--poll-selected-background);
        border-color: var(--poll-selected-border-color);
        font-weight: 600;
      }
    }
  }
</style>

<script lang="ts">
import { Vue, Component, Prop } from 'nuxt-property-decorator';

@Component({})
export default class extends Vue {
  @Prop({ required: true, type: Array }) choices!: string[];
  @Prop({ required: false, type: String, default: '' }) choice!: string;
  @Prop({ required: false, type: Boolean, default: false }) allowChoice!: boolean;
}
</script>
