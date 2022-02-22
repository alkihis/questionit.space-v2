<template>
  <bulma-modal v-if="pinned" open card @close="pinned = null">
    <header class="modal-card-head">
      <p v-if="pinned.type === 'pin'" class="modal-card-title">{{ $t('pin_question') }}</p>
      <p v-else class="modal-card-title">{{ $t('unpin_question') }}</p>
      <button class="delete" aria-label="close" @click="pinned = null"></button>
    </header>
    <section class="modal-card-body">
      <!-- Content -->
      <p v-if="pinned.type === 'pin'">
        {{ $t('pin_message') }}.
      </p>
      <p v-else>
        {{ $t('unpin_message') }}.
      </p>
    </section>
    <footer class="modal-card-foot is-flex-right">
      <button class="button" @click="pinned = null">{{ $t('cancel') }}</button>
      <button
        :disabled="pinLoading"
        :class="{ button: true, 'is-success': true, 'is-loading': pinLoading }"
        @click="pin()"
      >{{ $t('validate') }}</button>
    </footer>
  </bulma-modal>
</template>

<script lang="ts">
import { Component, PropSync, Vue } from "nuxt-property-decorator";
import BulmaModal from "~/components/BulmaModal/BulmaModal";
import { ISentUser } from "~/utils/types/sent.entities.types";
import { handleError } from "~/utils/helpers";

export type TQuestionPin = { type: 'pin' | 'unpin', question: number };

@Component({
  components: { BulmaModal },
})
export default class extends Vue {
  @PropSync('question', { type: Object, default: null })
  pinned!: TQuestionPin | null;

  pinLoading = false;

  async pin() {
    if (this.pinLoading || !this.pinned)
      return;

    const action = this.pinned;
    this.pinLoading = true;

    try {
      let user: ISentUser;
      if (action.type === 'pin') {
        user = (await this.$axios.patch('questions/pin', { id: action.question })).data as ISentUser;
        this.$toast.success(this.$t('pin_success'));
      }
      else {
        user = (await this.$axios.delete('questions/pin')).data as ISentUser;
        this.$toast.success(this.$t('unpin_success'));
      }

      this.$accessor.setLoggedUser({ ...user });

      this.$emit('pinned', user);
      this.pinned = null;
    } catch (e) {
      handleError(e, this);
    }

    this.pinLoading = false;
  }
}
</script>

<style lang="scss" scoped>
.modal-card-title {
  flex-shrink: unset;
}
</style>
