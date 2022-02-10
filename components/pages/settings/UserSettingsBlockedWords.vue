<template>
  <Loader v-if="isLoading" />
  <div v-else class="user-settings-blocked-words">
    <p class="muted-words-description">
      {{ $t('muted_words_description') }}
    </p>

    <div class="add-word-wrapper">
      <div class="field">
        <div class="control has-icons-left">
          <input
            :class="{ input: true, 'is-danger': !isBlockedWordValid }"
            type="text"
            placeholder="Curious Cat, Ask.fm..."
            v-model="newBlockedWord"
            @keydown.enter="addBlockedWord()"
            :disabled="blockedWordsUpdate"
          >
          <span class="icon is-small is-left">
              <i class="fas fa-ban"></i>
            </span>
        </div>
        <p :class="{ help: true, 'is-danger': !isBlockedWordValid }">{{ $t('muted_word_help') }}</p>
      </div>
      <div class="add-word-btn">
        <button class="button" :disabled="blockedWordsUpdate" @click="addBlockedWord()">
            <span class="icon">
              <i class="fas fa-plus"></i>
            </span>
        </button>
      </div>
    </div>

    <div class="field is-grouped is-grouped-multiline">
      <div v-for="word in blockedWords" :key="word" class="control">
        <div class="tags has-addons">
          <a class="tag is-link">{{ word }}</a>
          <a class="tag is-delete" @click="deleteBlockedWord(word)"></a>
        </div>
      </div>
    </div>
    <div v-if="blockedWords.length === 0" class="no-muted-words nanum">
      {{ $t('no_muted_words') }}
    </div>

    <div class="buttons validate-btn">
      <button
        :class="{ 'button': true, 'is-link': true, 'is-light': true, 'is-loading': blockedWordsUpdate }"
        @click="updateBlockedWords()"
      >
        {{ $t('save') }}
      </button>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Vue } from "nuxt-property-decorator";
import { handleError, MUTED_WORD_REGEX } from "~/utils/helpers";
import Loader from "~/components/Loader.vue";

@Component({
  components: { Loader }
})
export default class extends Vue {
  isLoading = true;
  blockedWords: string[] = [];
  newBlockedWord = '';
  blockedWordsUpdate = false;
  blockedWordsDirty = false;

  async mounted() {
    this.isLoading = true;

    try {
      this.blockedWords = await this.$axios.$get('user/settings/blocked-words');
    } catch (e) {
      handleError(e, this);
    } finally {
      this.isLoading = false;
    }
  }

  get isBlockedWordValid() {
    if (this.newBlockedWord.length > 2) {
      if (this.newBlockedWord.length > 32)
        return false;
      return this.newBlockedWord.trim().match(MUTED_WORD_REGEX);
    }
    return true;
  }

  addBlockedWord() {
    if (!this.newBlockedWord) {
      return;
    }

    if (!this.isBlockedWordValid || this.newBlockedWord.length < 2) {
      this.$toast.error(this.$t('blocked_word_invalid'));
      return;
    }

    const inserted = this.newBlockedWord.toLowerCase();
    if (this.blockedWords.find(e => e.toLowerCase() === inserted)) {
      this.$toast.error(this.$t('word_already_exists'));
      return;
    }

    this.blockedWordsDirty = true;
    this.blockedWords.push(this.newBlockedWord);
    this.newBlockedWord = '';
  }

  deleteBlockedWord(word: string) {
    if (this.blockedWordsUpdate) {
      return;
    }

    this.blockedWords = this.blockedWords.filter(e => e !== word);
  }

  async updateBlockedWords() {
    if (this.blockedWordsUpdate) {
      return;
    }

    const words = this.blockedWords;

    if (words.length > 255) {
      this.$toast.error(this.$t('too_many_muted_words'));
      return;
    }

    this.blockedWordsUpdate = true;
    try {
      await this.$axios.post('user/settings/blocked-words', { words });
      this.$toast.success(this.$t('update_successful'));
      this.blockedWordsDirty = false;
    } catch (e) {
      handleError(e, this);
    }

    this.blockedWordsUpdate = false;
  }
}
</script>

<style lang="scss" scoped>
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
</style>
