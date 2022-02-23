<template>
  <bulma-modal :open="!!toDelete" :card="true" @close="toDelete = null">
    <header class="modal-card-head">
      <p class="modal-card-title">{{ $t('delete_this_question') }}</p>
      <button class="delete" aria-label="close" @click="toDelete = null"></button>
    </header>
    <section class="modal-card-body">
      <!-- Content -->
      <p>
        {{ $t('this_question_will_be_deleted_forever') }}.
      </p>
    </section>
    <footer class="modal-card-foot is-flex-right">
      <button
        :disabled="deleteLoading"
        :class="{ 'button': true, 'is-danger': true, 'is-loading': deleteLoading }"
        @click="sendDestroyQuestion()"
      >{{ $t('delete') }}</button>
      <button class="button" @click="toDelete = null">{{ $t('cancel') }}</button>
    </footer>
  </bulma-modal>
</template>

<script lang="ts">
import { Component, PropSync, Vue } from "nuxt-property-decorator";
import BulmaModal from "~/components/BulmaModal/BulmaModal";
import { ISentQuestion } from "~/utils/types/sent.entities.types";
import { handleError } from "~/utils/helpers";

@Component({
  components: { BulmaModal },
})
export default class extends Vue {
  @PropSync('question', { type: Object, default: null })
  toDelete!: ISentQuestion | null;

  deleteLoading = false;

  async sendDestroyQuestion() {
    const question = this.toDelete;
    if (!question || this.deleteLoading) {
      return;
    }

    this.deleteLoading = true;

    try {
      await this.$axios.delete(`question/${question.id}`);
      this.$emit('deleted');
    } catch (e) {
      handleError(e, this);
    }

    this.deleteLoading = false;
  }
}
</script>

<style lang="scss" scoped>
.modal-card-title {
  flex-shrink: unset;
}
</style>
