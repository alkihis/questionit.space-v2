<template>
  <div class="user-settings-toggles">
    <!-- Post twitter default field -->
    <div class="field">
      <input
        type="checkbox"
        class="is-checkradio is-circle is-info"
        id="pdt-desktop"
        value="post"
        v-model="postToTwitter"
        :disabled="editLoad"
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
        v-model="allowQuestionOfTheDay"
        :disabled="editLoad"
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
        :disabled="editLoad"
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
        v-model="dropQuestionsOnBlockedWord"
        :disabled="editLoad"
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
        v-model="safeMode"
        :disabled="editLoad"
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
        :class="{ 'button': true, 'is-link': true, 'is-light': true, 'is-loading': editLoad }"
        @click="update()"
      >
        {{ $t('validate') }}
      </button>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Vue } from "nuxt-property-decorator";
import { ISentUser } from "~/utils/types/sent.entities.types";
import { handleError } from "~/utils/helpers";

@Component({
  components: {}
})
export default class extends Vue {
  user: ISentUser;
  editLoad = false;

  constructor() {
    super();
    this.user = { ...this.$accessor.loggedUser! };
  }

  get postToTwitter() {
    return this.user.sendQuestionsToTwitterByDefault as boolean;
  }

  set postToTwitter(v: boolean) {
    this.user.sendQuestionsToTwitterByDefault = v;
  }

  get visible() {
    return this.user.visible as boolean;
  }

  set visible(v: boolean) {
    this.user.visible = v;
  }

  get allowQuestionOfTheDay() {
    return this.user.allowQuestionOfTheDay ?? false;
  }

  set allowQuestionOfTheDay(v: boolean) {
    this.user.allowQuestionOfTheDay = v;
  }

  get dropQuestionsOnBlockedWord() {
    return this.user.dropQuestionsOnBlockedWord ?? false;
  }

  set dropQuestionsOnBlockedWord(v: boolean) {
    this.user.dropQuestionsOnBlockedWord = v;
  }

  get safeMode() {
    return this.user.safeMode ?? false;
  }

  set safeMode(v: boolean) {
    this.user.safeMode = v;
  }

  async update() {
    if (this.editLoad)
      return;

    this.editLoad = true;

    try {
      const resp = await this.$axios.$post('user/settings', {
        allowQuestionOfTheDay: this.user.allowQuestionOfTheDay,
        allowAnonymousQuestions: this.user.allowAnonymousQuestions,
        sendQuestionsToTwitterByDefault: this.user.sendQuestionsToTwitterByDefault,
        visible: this.user.visible,
        dropQuestionsOnBlockedWord: this.user.dropQuestionsOnBlockedWord,
        safeMode: this.user.safeMode,
      }) as ISentUser;

      this.user = resp;
      this.$accessor.setLoggedUser({ ...resp });
      this.$toast.success(this.$t('update_successful'));
    } catch (e) {
      handleError(e, this);
    }

    this.editLoad = false;
  }
}
</script>

<style lang="scss" scoped>
.field + .field-explaination {
  padding-left: 2rem;
  margin-top: -.5rem;
  color: var(--settings-field-explaination);
  font-size: .9rem;
}
</style>
