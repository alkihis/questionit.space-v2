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

<script lang="ts">
import { Vue, Component, Prop } from 'nuxt-property-decorator';
import QuestionTextArea, { PollInputEvent, PollInputData } from './QuestionTextArea.vue';
import AccountChooser from './AccountChooser.vue';
import { handleError } from '~/utils/helpers';
import { ISentQuestion, ISentUser } from "~/utils/types/sent.entities.types";

@Component({
  components: {
    QuestionTextArea: QuestionTextArea,
    AccountChooser: AccountChooser,
  }
})
export default class extends Vue {
  @Prop({ required: false, default: false, type: Boolean }) disabled!: boolean;
  @Prop({ required: false, default: false, type: Boolean }) allowAnonymous!: boolean;
  @Prop({ required: false, default: 'new', type: String }) mode!: 'reply' | 'new';
  @Prop({ required: false, default: '', type: String }) placeholder!: String;
  @Prop({ required: false, default: undefined, type: Object }) question!: ISentQuestion;
  @Prop({ required: false, default: undefined, type: Object }) user!: ISentUser;

  new_reply = "";
  reply_poll: PollInputData | undefined = undefined;
  posting = false;
  as_anonymous_ = true;

  get as_anonymous() {
    return this.as_anonymous_;
  }

  set as_anonymous(v: boolean) {
    this.as_anonymous_ = v;

    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('as_anonymous', String(v));
    }
  }

  get placeholder_text() {
    if (this.mode === 'reply')
      return this.$t('new_reply') + '...';

    return this.placeholder;
  }

  pollUpdate(update: PollInputEvent) {
    if (update.type === 'clear') {
      this.reply_poll = undefined;
      this.$forceUpdate();
      return;
    }

    this.reply_poll = update;
    this.$forceUpdate();
  }

  isReplyBtnDisabled() {
    return this.posting ||
      !this.new_reply.trim() ||
      (this.reply_poll && !this.reply_poll.valid);
  }

  async reply() {
    if (this.isReplyBtnDisabled())
      return;

    this.posting = true;
    const question = this.new_reply.trim();
    let as_anonymous = this.user.allowAnonymousQuestions;

    let target_user: string | null = null;

    if (this.$refs.chooser) {
      // User is logged if chooser is available
      const c = this.$refs.chooser as AccountChooser;
      const selected = c.getSelected();
      const couples = this.$accessor.userTokenCouples;

      if (selected === null && !this.user.allowAnonymousQuestions) {
        return;
      }

      if (selected === null) {
        as_anonymous = true;
        target_user = this.$accessor.token;
      }
      else {
        as_anonymous = false;
        const target = couples.find(e => e[0].id === selected.id);

        if (!target) {
          return;
        }

        target_user = target[1];
      }
    }

    const headers: any = {};

    if (target_user) {
      headers['Authorization'] = 'Bearer ' + target_user;
    }

    let pollId: number | undefined = undefined;
    if (this.reply_poll) {
      // Create a poll
      const poll_res = await this.$axios.$post(
        'poll',
        { options: this.reply_poll.fields },
        { headers }
      ) as { id: number, expiration: number };

      pollId = poll_res.id;
    }

    try {
      await this.$axios.post(
        'question' + (as_anonymous ? '/anonymous' : ''),
        { to: this.user.id, content: question, inReplyToQuestionId: this.question?.id, pollId },
        { headers }
      );

      this.$toast.success(this.$t('question_sent'));
      this.new_reply = "";
      (this.$refs.questiontext as any).removePoll();
      this.$emit('reply');
    } catch (e) {
      handleError(e, this);
    }

    this.posting = false;
  }

  mounted() {
    if (this.user && !this.user.allowAnonymousQuestions) {
      this.as_anonymous = false;
    }
    if (this.$accessor.isLogged)
      this.as_anonymous_ = !(localStorage.getItem('as_anonymous') === 'false');
  }
}
</script>

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
