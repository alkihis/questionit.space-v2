<template>
  <div>
    <!-- The text reply field -->
    <div class="level">
      <question-text-area
        v-model="new_reply"
        :placeholder="placeholder_text"
        :maxLength="500"
        :hasPollIcon="true"
        @ctrl-enter="reply()"
        @poll-change="pollUpdate($event)"
        :type="mode === 'new' ? 'normal' : 'info'"
        class="question-field"
        ref="questiontext"
      />
    </div>

    <!-- The reply buttons -->
    <div class="level">
      <div :class="{ sender: true, 'question-submit-button': mode === 'new', 'is-flex-right': !$accessor.isLogged }">
        <account-chooser
          v-if="$accessor.isLogged"
          :allowAnonymous="allowAnonymous"
          ref="chooser"
        ></account-chooser>

        <button
          v-if="mode === 'reply'"
          :class="{ 'button': true, 'is-success': true, 'is-loading': posting }"
          :disabled="isReplyBtnDisabled()"
          @click="reply()"
        >
          {{ $t('add_reply') }}
        </button>
        <button
          v-else
          type="button"
          :class="{ 'button': true, 'is-info': true, 'is-outlined': true, 'is-loading': posting }"
          @click="reply()"
          :disabled="isReplyBtnDisabled()"
        >
          {{ $t('send') }}
        </button>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
  .question-submit-button {
    display: flex;
    justify-content: space-between;
    align-items: center;

    @media screen and (max-width: 1023px) {
      flex-direction: column;
      button {
        margin: 1rem 0;
        width: 100%;
      }
    }
  }

  .sender {
    width: 100%;
    display: flex;
    align-items: center;

    &:not(.question-submit-button):not(.is-flex-right) {
      justify-content: space-between;
    }
  }
</style>

<script lang="ts" src="./AskQuestion.ts"></script>
