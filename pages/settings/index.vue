<template>
  <main>
    <section class="hero is-light">
      <div class="hero-body">
        <div class="container">
          <h1 class="title">
            {{ $t('account_settings') }}
          </h1>
          <h2 class="subtitle">
            {{ $t('manage_your_account_and_preferences') }}.
          </h2>
        </div>
      </div>
    </section>

    <fluid-container class="root">
      <h1 class="is-size-4 nanum" style="margin-bottom: 1rem">
        {{ $t('account') }}
      </h1>

      <user-settings-toggles />

      <!-- Theme -->
      <h1 class="is-size-4 nanum" style="margin-bottom: 1rem">
        {{ $t('theme') }}
      </h1>

      <user-settings-theme-chooser />

      <!-- Muted words -->
      <h1 class="is-size-4 nanum" style="margin: 2rem 0 1rem 0">
        {{ $t('muted_words') }}
      </h1>

      <user-settings-blocked-words />

      <h1 class="is-size-4 nanum" style="margin: 2rem 0 1rem 0">
        {{ $t('applications') }}
      </h1>

      <nuxt-link class="app-count" :to="localePath('/settings/apps')">
        {{ $t('x_authorized_applications', { apps: applicationCount === 0 ? $t('no_one').toString() : applicationCount, s: applicationCount > 1 ? 's' : '' }) }}
      </nuxt-link>

      <h1 class="is-size-4 nanum" style="margin: 2rem 0 1rem 0">
        {{ $t('danger_zone') }}
      </h1>

      <p style="margin-bottom: 1rem;">
        <a href="#!" @click.prevent="willDeleteMutedQuestions" class="has-text-danger">
          <span class="icon is-medium">
            <i class="fas fa-minus-circle fa-lg"></i>
          </span>
          <span class="delete-acc">
            {{ $t('delete_muted_words_waiting_questions') }}
          </span>
        </a>
      </p>
      <p>
        <a href="#!" @click.prevent="willDeleteAccount" class="has-text-danger">
          <span class="icon is-medium">
            <i class="fas fa-trash fa-lg"></i>
          </span>
          <span class="delete-acc">
            {{ $t('delete_account') }}
          </span>
        </a>
      </p>

      <div class="divider copyright-divider">
        {{ $t('miscellaneous') }}
      </div>

      <div class="dev-space">
        <nuxt-link :to="localePath('/settings/developer')">
          {{ $t('developer_space') }}
        </nuxt-link>
      </div>

      <div class="copyright">
        <copyright-footer :useTheme="true" />
      </div>
    </fluid-container>

    <!-- Modal for user delete -->
    <bulma-modal :open="deleteAccount" :card="true" @close="cancelDeleteAccount()">
      <header class="modal-card-head">
        <p class="modal-card-title">{{ $t('delete_account') }}</p>
        <button class="delete" aria-label="close" @click="cancelDeleteAccount()"></button>
      </header>
      <section class="modal-card-body">
        <!-- Content -->
        <p>
          {{ $t('you_account_will_be_deleted_forever') }}
        </p>
      </section>
      <footer class="modal-card-foot is-flex-right">
        <button
          :disabled="deleteLoad"
          :class="{ 'button': true, 'is-danger': true, 'is-loading': deleteLoad }"
          @click="willSureDeleteAccount()"
        >{{ $t('delete') }}</button>
        <button class="button" @click="cancelDeleteAccount()">{{ $t('cancel') }}</button>
      </footer>
    </bulma-modal>

    <!-- Modal for user delete sure -->
    <bulma-modal :open="sureDeleteAccount" :card="true" @close="cancelDeleteAccount()">
      <header class="modal-card-head">
        <p class="modal-card-title">{{ $t('really_sure') }}</p>
        <button class="delete" aria-label="close" @click="cancelDeleteAccount()"></button>
      </header>
      <section class="modal-card-body">
        <!-- Content -->
        <p>
          {{ $t('you_account_will_be_deleted_forever_can_undone') }}
        </p>
      </section>
      <footer class="modal-card-foot is-flex-right">
        <button class="button" @click="cancelDeleteAccount()">{{ $t('cancel') }}</button>
        <button
          :disabled="deleteLoad"
          :class="{ 'button': true, 'is-danger': true, 'is-loading': deleteLoad }"
          @click="makeDeleteAccount()"
        >{{ $t('i_am_sure') }}</button>
      </footer>
    </bulma-modal>

    <!-- Modal for questions delete -->
    <bulma-modal :open="deleteMutedQuestions" :card="true" @close="cancelDeleteMuted()">
      <header class="modal-card-head">
        <p class="modal-card-title">{{ $t('delete_muted_words') }}</p>
        <button class="delete" aria-label="close" @click="cancelDeleteMuted()"></button>
      </header>
      <section class="modal-card-body">
        <!-- Content -->
        <p>
          {{ $t('waiting_questions_that_match_muted_words_will_be_removed') }}
        </p>
      </section>
      <footer class="modal-card-foot is-flex-right">
        <button class="button" @click="cancelDeleteMuted()">{{ $t('cancel') }}</button>
        <button
          :disabled="deleteMuteLoad"
          :class="{ 'button': true, 'is-danger': true, 'is-loading': deleteMuteLoad }"
          @click="makeDeleteMutedQuestions()"
        >{{ $t('delete') }}</button>
      </footer>
    </bulma-modal>
  </main>
</template>

<script lang="ts">
import { Vue, Component } from 'nuxt-property-decorator';
import BulmaModal from '~/components/BulmaModal/BulmaModal';
import { makeTitle, handleError, isAxiosError, convertAxiosError } from '~/utils/helpers';
import { v4 as uuid } from 'uuid';
import CopyrightFooter from '~/components/CopyrightFooter.vue';
import UserSettingsToggles from "~/components/pages/settings/UserSettingsToggles.vue";
import UserSettingsThemeChooser from "~/components/pages/settings/UserSettingsThemeChooser.vue";
import UserSettingsBlockedWords from "~/components/pages/settings/UserSettingsBlockedWords.vue";

@Component({
  components: {
    UserSettingsBlockedWords,
    UserSettingsThemeChooser,
    UserSettingsToggles,
    BulmaModal,
    CopyrightFooter,
  },
  middleware: 'logged',
  layout: 'default_solid',
  async asyncData({ app }) {
    try {
      const applicationCount = app.$axios.$get('application/subscribed');

      return { applicationCount: (await applicationCount).length };
    } catch (e) {
      if (isAxiosError(e)) {
        e = convertAxiosError(e);
      }
      return { error: e };
    }
  },
})
export default class extends Vue {
  deleteAccount = false;
  sureDeleteAccount = false;
  deleteLoad = false;
  deleteMutedQuestions = false;
  deleteMuteLoad = false;
  error?: any = null;

  applicationCount!: number;

  head() {
    return {
      title: makeTitle(this.$t('account_settings').toString())
    };
  }

  willDeleteAccount() {
    this.deleteAccount = true;
  }

  willSureDeleteAccount() {
    this.deleteAccount = false;
    this.sureDeleteAccount = true;
  }

  cancelDeleteAccount() {
    if (this.deleteLoad)
      return;

    this.deleteAccount = false;
    this.sureDeleteAccount = false;
  }

  async makeDeleteAccount() {
    if (this.deleteLoad)
      return;

    this.deleteLoad = true;

    try {
      // TODO crsf
      await this.$axios.delete('user');
      this.$accessor.unlog();

      const session_id = uuid();
      this.$axios.setToken(session_id, 'Session');
      this.$accessor.setSessionId(session_id);

      // Delete the cookie that store tokens
      this.$cookies.remove('token', { path: '/' });
      this.$cookies.remove('current_token', { path: '/' });

      this.$router.push(this.localePath('/'));
    } catch (e) {
      handleError(e, this);
    }

    this.deleteLoad = false;
  }

  willDeleteMutedQuestions() {
    this.deleteMutedQuestions = true;
  }

  cancelDeleteMuted() {
    if (this.deleteMuteLoad)
      return;

    this.deleteMutedQuestions = false;
  }

  async makeDeleteMutedQuestions() {
    if (this.deleteMuteLoad)
      return;

    this.deleteMuteLoad = true;

    try {
      const sum: string[] = await this.$axios.$delete('question/waiting/blocked');

      this.$toast.success(this.$t('deleted_x_muted_questions', { x: sum.length }));

      const new_count = this.$accessor.waitingAnswerCount - sum.length;
      this.$accessor.setAnswerWait(new_count);

      this.deleteMutedQuestions = false;
    } catch (e) {
      handleError(e, this);
    }

    this.deleteMuteLoad = false;
  }
}
</script>

<style lang="scss" scoped>
@import '~/assets/css/functions.scss';

.root {
  padding: 1.5rem 0 7rem 0;
}

.icon {
  vertical-align: bottom !important;
}

.delete-acc {
  font-size: 1.3rem;
}

::v-deep .validate-btn {
  margin: 2rem 0 1rem 0;
}

@media screen and (max-width: 767px) {
  ::v-deep .validate-btn .button {
    width: 100%;
  }
}

.copyright-divider {
  margin-top: 3rem;
}

.copyright {
  margin-top: 1.5rem;
  text-align: center;
  font-size: 1.2rem;
}

.dev-space {
  font-size: 1.2rem;
  text-align: center;
  font-weight: 300;
}

.app-count {
  font-size: 1.2rem;
}
</style>
