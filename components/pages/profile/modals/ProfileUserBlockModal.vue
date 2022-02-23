<template>
  <bulma-modal :open="toBlock" :card="true" @close="toBlock = false">
    <header class="modal-card-head">
      <p v-if="$accessor.profile.relationship.hasBlocked" class="modal-card-title">{{ $t('unblock_this_user') }}</p>
      <p v-else class="modal-card-title">{{ $t('block_this_user') }}</p>
      <button class="delete" aria-label="close" @click="toBlock = false"></button>
    </header>
    <section class="modal-card-body">
      <!-- Content -->
      <p v-if="$accessor.profile.relationship.hasBlocked">
        {{ $t('unblock_user_message') }}
      </p>
      <p v-else>
        {{ $t('block_user_message') }}
      </p>
    </section>
    <footer class="modal-card-foot is-flex-right">
      <button
        :disabled="blockLoading"
        :class="{ button: true, 'is-danger': true, 'is-loading': blockLoading }" @click="blockUnblock()"
      >
        <span v-if="$accessor.profile.relationship.hasBlocked">
          {{ $t('unblock') }}
        </span>
       <span v-else>
          {{ $t('block') }}
        </span>
      </button>
      <button class="button" @click="toBlock = false">{{ $t('cancel') }}</button>
    </footer>
  </bulma-modal>
</template>

<script lang="ts">
import { Component, PropSync, Vue } from 'nuxt-property-decorator';
import BulmaModal from '~/components/BulmaModal.vue';
import { handleError } from '~/utils/helpers';

@Component({
  components: { BulmaModal },
})
export default class extends Vue {
  @PropSync('open', { type: Boolean, default: false })
  toBlock!: boolean;

  blockLoading = false;

  async blockUnblock() {
    if (
      !this.$accessor.profile.relationship ||
      !this.$accessor.isLogged
    )
      return;

    const action = this.$accessor.profile.relationship.hasBlocked ? 'unblock' : 'block';
    this.blockLoading = true;

    if (action === 'block') {
      try {
        await this.$axios.post('blocks/' + this.$accessor.profile.user!.id);
        this.$toast.success(this.$t('user_has_been_block'));

        this.$accessor.profile.updateRelationshipAfterBlock();
      } catch (e) {
        handleError(e, this);
      }

      this.$emit('blocked');
    }
    else {
      try {
        await this.$axios.delete('blocks/' + this.$accessor.profile.user!.id);
        this.$toast.success(this.$t('user_has_been_unblock'));

        this.$accessor.profile.updateRelationshipAfterUnblock();
      } catch (e) {
        handleError(e, this);
      }
    }

    this.blockLoading = false;
  }
}
</script>

<style lang="scss" scoped>
.modal-card-title {
  flex-shrink: unset;
}
</style>
