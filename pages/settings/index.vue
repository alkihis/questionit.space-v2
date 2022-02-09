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

      <!-- Post twitter default field -->
      <div class="field">
        <input
          type="checkbox"
          class="is-checkradio is-circle is-info"
          id="pdt-desktop"
          value="post"
          v-model="post_twitter"
          :disabled="edit_load"
        >
        <label class="checkbox" for="pdt-desktop">
          {{ $t('post_default_on_twitter') }}
        </label>
      </div>

      <!-- Enable question of the day field -->
      <div class="field">
        <input
          type="checkbox"
          value="day"
          class="is-checkradio is-circle is-info"
          id="qotd-desktop"
          v-model="enable_question_of_the_day"
          :disabled="edit_load"
        >
        <label class="checkbox" for="qotd-desktop">
          {{ $t('show_qotd') }}
        </label>
      </div>

      <!-- Be seen field -->
      <div class="field">
        <input
          type="checkbox"
          value="be-seen"
          class="is-checkradio is-circle is-info"
          id="be-seen-desktop"
          v-model="visible"
          :disabled="edit_load"
        >
        <label class="checkbox" for="be-seen-desktop">
          {{ $t('be_visible_in_search') }}
        </label>
      </div>

      <!-- Drop block match -->
      <div class="field">
        <input
          type="checkbox"
          value="be-seen"
          class="is-checkradio is-circle is-info"
          id="drop-block-desktop"
          v-model="drop_on_block_match"
          :disabled="edit_load"
        >
        <label class="checkbox" for="drop-block-desktop">
          {{ $t('drop_block_match') }}
        </label>
      </div>

      <!-- Safe mode -->
      <div class="field">
        <input
          type="checkbox"
          value="safe-mode"
          class="is-checkradio is-circle is-info"
          id="safe-mode-desktop"
          v-model="safe_mode"
          :disabled="edit_load"
        >
        <label class="checkbox" for="safe-mode-desktop">
          {{ $t('safe_mode') }}
        </label>
      </div>
      <div class="field-explaination">
        {{ $t('safe_mode_tooltip') }}
      </div>

      <div class="buttons validate-btn">
        <button
          :class="{ 'button': true, 'is-link': true, 'is-light': true, 'is-loading': edit_load }"
          @click="update()"
        >
          {{ $t('validate') }}
        </button>
      </div>

      <!-- Theme -->
      <h1 class="is-size-4 nanum" style="margin-bottom: 1rem">
        {{ $t('theme') }}
      </h1>
      <div class="select">
        <select v-model="selected_theme">
          <option v-for="theme in available_themes" :key="theme[0]" :value="theme[0]">
            {{ theme[1] }}
          </option>
        </select>
      </div>
      <client-only>
        <div v-if="the_selected_theme === 'Auto'" class="field-explaination">
          {{ $t('theme_automatic_tooltip') }}
        </div>
      </client-only>

      <!-- Muted words -->
      <h1 class="is-size-4 nanum" style="margin: 2rem 0 1rem 0">
        {{ $t('muted_words') }}
      </h1>

      <p class="muted-words-description">
        {{ $t('muted_words_description') }}
      </p>

      <div class="add-word-wrapper">
        <div class="field">
          <div class="control has-icons-left">
            <input
              :class="{ input: true, 'is-danger': !is_blocked_word_valid }"
              type="text"
              placeholder="Curious Cat, Ask.fm..."
              v-model="new_block_word"
              @keydown.enter="addBlockedWord()"
              :disabled="blocked_load"
            >
            <span class="icon is-small is-left">
              <i class="fas fa-ban"></i>
            </span>
          </div>
          <p :class="{ help: true, 'is-danger': !is_blocked_word_valid }">{{ $t('muted_word_help') }}</p>
        </div>
        <div class="add-word-btn">
          <button class="button" :disabled="blocked_load" @click="addBlockedWord()">
            <span class="icon">
              <i class="fas fa-plus"></i>
            </span>
          </button>
        </div>
      </div>

      <div class="field is-grouped is-grouped-multiline">
        <div v-for="word in blocked_words" :key="word" class="control">
          <div class="tags has-addons">
            <a class="tag is-link">{{ word }}</a>
            <a class="tag is-delete" @click="deleteBlockedWord(word)"></a>
          </div>
        </div>
      </div>
      <div v-if="blocked_words.length === 0" class="no-muted-words nanum">
        {{ $t('no_muted_words') }}
      </div>

      <div class="buttons validate-btn">
        <button
          :class="{ 'button': true, 'is-link': true, 'is-light': true, 'is-loading': blocked_load }"
          @click="updateBlockedWords()"
        >
          {{ $t('save') }}
        </button>
      </div>

      <h1 class="is-size-4 nanum" style="margin: 2rem 0 1rem 0">
        {{ $t('applications') }}
      </h1>

      <nuxt-link class="app-count" :to="localePath('/settings/apps')">
        {{ $t('x_authorized_applications', { apps: app_count === 0 ? $t('no_one').toString() : app_count, s: app_count > 1 ? 's' : '' }) }}
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
    <bulma-modal :open="delete_account" :card="true" @close="cancelDeleteAccount()">
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
          :disabled="delete_load"
          :class="{ 'button': true, 'is-danger': true, 'is-loading': delete_load }"
          @click="willSureDeleteAccount()"
        >{{ $t('delete') }}</button>
        <button class="button" @click="cancelDeleteAccount()">{{ $t('cancel') }}</button>
      </footer>
    </bulma-modal>

    <!-- Modal for user delete sure -->
    <bulma-modal :open="sure_delete_account" :card="true" @close="cancelDeleteAccount()">
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
          :disabled="delete_load"
          :class="{ 'button': true, 'is-danger': true, 'is-loading': delete_load }"
          @click="deleteAccount()"
        >{{ $t('i_am_sure') }}</button>
      </footer>
    </bulma-modal>

    <!-- Modal for questions delete -->
    <bulma-modal :open="delete_muted_questions" :card="true" @close="cancelDeleteMuted()">
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
          :disabled="delete_mute_load"
          :class="{ 'button': true, 'is-danger': true, 'is-loading': delete_mute_load }"
          @click="deleteMutedQuestions()"
        >{{ $t('delete') }}</button>
      </footer>
    </bulma-modal>
  </main>
</template>

<script lang="ts">
import { Vue, Component } from 'nuxt-property-decorator';
import BulmaModal from '~/components/BulmaModal/BulmaModal';
import { makeTitle, handleError, isAxiosError, convertAxiosError, MUTED_WORD_REGEX, switchTheme } from '~/utils/helpers';
import { v4 as uuid } from 'uuid';
// @ts-ignore
import CopyrightFooter from '~/components/CopyrightFooter.vue';
import { ISentUser } from "~/utils/types/sent.entities.types";
import { EAllowedThemes } from "~/utils/types/theme.types";

@Component({
  components: {
    BulmaModal: BulmaModal,
    CopyrightFooter,
  },
  middleware: 'logged',
  layout: 'default_solid',
  async asyncData({ app }) {
    try {
      const blocked_words = app.$axios.$get('users/blocked_words');
      const app_count = app.$axios.$get('apps/count');

      return { blocked_words: await blocked_words, app_count: (await app_count).count };
    } catch (e) {
      if (isAxiosError(e)) {
        e = convertAxiosError(e);
      }
      return { error: e };
    }
  },
})
export default class extends Vue {
  user: ISentUser;
  edit_load = false;
  delete_account = false;
  sure_delete_account = false;
  delete_load = false;
  delete_muted_questions = false;
  delete_mute_load = false;
  error?: any = null;

  blocked_words!: string[];
  app_count!: number;

  new_block_word = '';
  blocked_load = false;
  blocked_words_dirty = false;

  the_selected_theme: keyof typeof EAllowedThemes = 'Auto';

  constructor() {
    super();
    this.user = { ...this.$accessor.loggedUser! };
  }

  head() {
    return {
      title: makeTitle(this.$t('account_settings').toString())
    };
  }

  get post_twitter() {
    return this.user.sendQuestionsToTwitterByDefault as boolean;
  }

  set post_twitter(v: boolean) {
    this.user.sendQuestionsToTwitterByDefault = v;
  }

  get visible() {
    return this.user.visible as boolean;
  }

  set visible(v: boolean) {
    this.user.visible = v;
  }

  get enable_question_of_the_day() {
    return this.user.allowQuestionOfTheDay ?? false;
  }

  set enable_question_of_the_day(v: boolean) {
    this.user.allowQuestionOfTheDay = v;
  }

  get drop_on_block_match() {
    return this.user.dropQuestionsOnBlockedWord ?? false;
  }

  set drop_on_block_match(v: boolean) {
    this.user.dropQuestionsOnBlockedWord = v;
  }

  get safe_mode() {
    return this.user.safeMode ?? false;
  }

  set safe_mode(v: boolean) {
    this.user.safeMode = v;
  }

  get available_themes() {
    return [
      ['Auto', this.$t('auto_theme')],
      ['Light', this.$t('light_theme')],
      ['Dark', this.$t('dark_theme')]
    ];
  }

  get selected_theme() {
    return this.the_selected_theme;
  }

  set selected_theme(value: keyof typeof EAllowedThemes) {
    this.the_selected_theme = value;

    (async () => {
      await switchTheme(value);

      if (value && value in EAllowedThemes) {
        this.$accessor.setTheme(value.toLowerCase());
        this.$cookies.set('theme', value, { path: '/', expires: new Date('2099-01-01') });
      }
    })();
  }

  async update() {
    if (this.edit_load)
      return;

    this.edit_load = true;

    try {
      const resp = (await this.$axios.post('users/profile', {
        allow_question_of_the_day: String(this.user.allowQuestionOfTheDay),
        allow_anonymous: String(this.user.allowAnonymousQuestions),
        default_send_twitter: String(this.user.sendQuestionsToTwitterByDefault),
        visible: String(this.user.visible),
        drop_on_block_match: String(this.user.dropQuestionsOnBlockedWord),
        safe_mode: String(this.user.safeMode),
      })).data;

      this.user = resp;
      this.$accessor.setLoggedUser({ ...resp });
      this.$toast.success(this.$t('update_successful'));
    } catch (e) {
      handleError(e, this);
    }

    this.edit_load = false;
  }

  get is_blocked_word_valid() {
    if (this.new_block_word.length > 2) {
      if (this.new_block_word.length > 32)
        return false;
      return this.new_block_word.trim().match(MUTED_WORD_REGEX);
    }
    return true;
  }

  addBlockedWord() {
    if (!this.new_block_word) {
      return;
    }

    if (!this.is_blocked_word_valid || this.new_block_word.length < 2) {
      this.$toast.error(this.$t('blocked_word_invalid'));
      return;
    }

    const inserted = this.new_block_word.toLowerCase();
    if (this.blocked_words.find(e => e.toLowerCase() === inserted)) {
      this.$toast.error(this.$t('word_already_exists'));
      return;
    }

    this.blocked_words_dirty = true;
    this.blocked_words.push(this.new_block_word);
    this.new_block_word = '';
  }

  deleteBlockedWord(word: string) {
    if (this.blocked_load) {
      return;
    }

    this.blocked_words = this.blocked_words.filter(e => e !== word);
  }

  async updateBlockedWords() {
    if (this.blocked_load) {
      return;
    }

    const words = this.blocked_words;

    if (words.length > 255) {
      this.$toast.error(this.$t('too_many_muted_words'));
      return;
    }

    this.blocked_load = true;
    try {
      await this.$axios.post('users/blocked_words', { words });
      this.$toast.success(this.$t('update_successful'));
      this.blocked_words_dirty = false;
    } catch (e) {
      handleError(e, this);
    }

    this.blocked_load = false;
  }

  willDeleteAccount() {
    if (this.edit_load)
      return;

    this.delete_account = true;
  }

  willSureDeleteAccount() {
    if (this.edit_load)
      return;

    this.delete_account = false;
    this.sure_delete_account = true;
  }

  cancelDeleteAccount() {
    if (this.delete_load)
      return;

    this.delete_account = false;
    this.sure_delete_account = false;
  }

  async deleteAccount() {
    if (this.delete_load)
      return;

    this.delete_load = true;

    try {
      await this.$axios.delete('users/account', { params: {
          sure: 'true',
          token: this.$accessor.token?.slice(0, 10)
        } });
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

    this.delete_load = false;
  }

  willDeleteMutedQuestions() {
    if (this.edit_load)
      return;

    if (this.blocked_words_dirty) {
      this.$toast.error(this.$t('changed_muted_words_please_save').toString());
      return;
    }

    this.delete_muted_questions = true;
  }

  cancelDeleteMuted() {
    if (this.delete_mute_load)
      return;

    this.delete_muted_questions = false;
  }

  async deleteMutedQuestions() {
    if (this.delete_mute_load)
      return;

    this.delete_mute_load = true;

    try {
      const sum: string[] = await this.$axios.$delete('questions/masked');

      this.$toast.success(this.$t('deleted_x_muted_questions', { x: sum.length }));

      const new_count = this.$accessor.waitingAnswerCount - sum.length;
      this.$accessor.setAnswerWait(new_count);

      this.delete_muted_questions = false;
    } catch (e) {
      handleError(e, this);
    }

    this.delete_mute_load = false;
  }

  beforeMount() {
    const t = this.$accessor.theme;
    this.the_selected_theme = t.slice(0, 1).toUpperCase() + t.slice(1) as keyof typeof EAllowedThemes;
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

.validate-btn {
  margin: 2rem 0 1rem 0;
}

.add-word-wrapper {
  display: grid;
  grid-template-columns: auto max-content;
  gap: 10px;
  margin-top: 1rem;
}

.no-muted-words {
  text-align: center;
  margin-top: 1rem;
  margin-bottom: 1rem;
  font-size: 1.2rem;
  font-weight: bold;
}

.field + .field-explaination {
  padding-left: 2rem;
  margin-top: -.5rem;
  color: var(--settings-field-explaination);
  font-size: .9rem;
}

.select + .field-explaination {
  margin-top: .5rem;
  color: var(--settings-field-explaination);
  font-size: .9rem;
}

@media screen and (max-width: 767px) {
  .validate-btn .button {
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
