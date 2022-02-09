import { Vue, Component, Prop } from 'nuxt-property-decorator';
import QuestionTextArea, { PollInputEvent, PollInputData } from '../QuestionTextArea/QuestionTextArea';
import AccountChooser from '../AccountChooser/AccountChooser';
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

    let poll_id: string | undefined = undefined;
    if (this.reply_poll) {
      // Create a poll
      const poll_res = await this.$axios.$post(
        'polls',
        { options: this.reply_poll.fields },
        { headers }
      ) as { poll_id: string, until: number };

      poll_id = poll_res.poll_id;
    }

    try {
      await this.$axios.post(
        'questions' + (as_anonymous ? '/anonymous' : ''),
        { to: this.user.id, content: question, in_reply_to: this.question?.id, poll_id },
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
