<template>
  <main>
    <section class="hero is-light">
      <div class="hero-body">
        <div class="container">
          <h1 class="title">
            {{ $t('registred_applications') }}
          </h1>
          <h2 class="subtitle">
            {{ $t('see_which_app_has_access_to_your_account') }}.
          </h2>
          <h3 class="back-to-settings">
            <nuxt-link :to="localePath('/settings')">&lsaquo; {{ $t('back_to_settings') }}</nuxt-link>
          </h3>
        </div>
      </div>
    </section>

    <fluid-container class="root">
      <div v-if="!error" class="apps">
        <application-card
          v-for="app in apps"
          :key="app.id"
          :app="app"
          @delete-app="openDeleteApplication"
        />

        <p v-if="apps.length === 0" class="no-apps">
          {{ $t('your_account_isnt_linked_to_any_app') }}
        </p>
      </div>
      <div v-else>
        <p class="no-apps">
          Unable to load apps.
        </p>
      </div>
    </fluid-container>

    <bulma-modal :open="!!deleteAppId" :card="true" @close="cancelDeleteApplication">
      <header class="modal-card-head">
        <p class="modal-card-title">{{ $t('delete_app_subscription') }}</p>
        <button class="delete" aria-label="close" @click="cancelDeleteApplication"></button>
      </header>

      <section class="modal-card-body">
        <!-- Content -->
        <p>
          {{ $t('all_sessions_of_that_app_will_be_closed') }}
        </p>
      </section>

      <footer class="modal-card-foot is-flex-right">
        <button class="button" @click="cancelDeleteApplication">{{ $t('cancel') }}</button>
        <button
          :disabled="deleteLoading"
          :class="{ 'button': true, 'is-danger': true, 'is-loading': deleteLoading }"
          @click="deleteApplication"
        >{{ $t('delete') }}</button>
      </footer>
    </bulma-modal>
  </main>
</template>

<script lang="ts">
import { Vue, Component } from 'nuxt-property-decorator';
import BulmaModal from '~/components/BulmaModal/BulmaModal';
import { makeTitle, handleError, isAxiosError, convertAxiosError } from '~/utils/helpers';
import ApplicationCard from '~/components/pages/settings/apps/ApplicationCard.vue';
import { ISentRegistredApplication } from "~/utils/types/sent.entities.types";

@Component({
  components: {
    BulmaModal: BulmaModal,
    ApplicationCard: ApplicationCard,
  },
  middleware: 'logged',
  layout: 'default_solid',
  async asyncData({ app }) {
    try {
      const apps = await app.$axios.$get('application/subscribed');

      return { apps, error: null };
    } catch (e: any) {
      if (isAxiosError(e)) {
        e = convertAxiosError(e);
      }
      return { error: e, apps: [] };
    }
  },
})
export default class extends Vue {
  apps!: ISentRegistredApplication[];
  error!: any;

  deleteAppId = 0;
  deleteLoading = false;

  head() {
    return {
      title: makeTitle(this.$t('account_settings').toString())
    };
  }

  openDeleteApplication(id: number) {
    this.deleteAppId = id;
  }

  cancelDeleteApplication() {
    if (this.deleteLoading)
      return;

    this.deleteAppId = 0;
  }

  async deleteApplication() {
    if (this.deleteLoading || !this.deleteAppId)
      return;

    this.deleteLoading = true;

    try {
      await this.$axios.$delete('application/subscribed/' + this.deleteAppId);

      this.apps = this.apps.filter(app => app.id !== this.deleteAppId);
      this.deleteAppId = 0;
    } catch (e) {
      handleError(e, this);
    }

    this.deleteLoading = false;
  }
}
</script>

<style lang="scss" scoped>
@import '~/assets/css/functions.scss';

.root {
  padding: 1.5rem 0 7rem 0;

  .no-apps {
    margin-top: 2rem;
    text-align: center;
    font-size: 1.4rem;
    font-weight: 300;
  }
}

.back-to-settings {
  font-size: 1.15rem;
}
</style>
