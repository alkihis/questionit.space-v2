import { Vue, Prop, Watch } from 'nuxt-property-decorator';
import { QUESTION_IT_FULL_URL, dateText, randomAnonymousImage, randomQuestionOfTheDayImage, handleError, TextPart } from '~/utils/helpers';
import { ISentQuestion } from "~/utils/types/sent.entities.types";
import { questionText } from '~/utils/question.utils';

export default class extends Vue {
  @Prop({ required: true })
  question!: ISentQuestion;

  cache?: TextPart[];
  answer_cache?: TextPart[];

  @Watch('question')
  removeCaches() {
    this.cache = undefined;
    this.answer_cache = undefined;
  }

  get has_empty_text_and_image() {
    return !this.question.answer?.content && !!this.question.answer?.attachment?.url;
  }

  get username(): string {
    if (this.question.questionOfTheDay) {
      return this.$t('question_of_the_day').toString();
    }
    return this.question.owner?.name ?? this.$t('anonymous').toString();
  }

  get profile_picture(): string {
    if (this.question.questionOfTheDay) {
      return randomQuestionOfTheDayImage(this.question.id);
    }

    return this.question.owner?.profilePictureUrl ?? randomAnonymousImage(this.question.id);
  }

  get receiver_pp() {
    return this.question.receiver.profilePictureUrl ?? randomAnonymousImage(this.question.id);
  }

  get receiver_link() {
    return this.localePath('/u/' + this.question.receiver.slug);
  }

  get receiver_name() {
    return this.question.receiver.name;
  }

  get profile_link() {
    return this.localePath('/u/' + this.question.owner!.slug);
  }

  get has_emitter() {
    return !!this.question.owner;
  }

  get question_date() : string {
    const date = new Date(this.question.createdAt);
    return dateText(date, this);
  }

  get full_date() {
    return new Intl.DateTimeFormat(
      this.$i18n.locale === 'fr' ? 'fr-FR' : 'en-US',
      { year: "numeric", month: "numeric", day: "numeric", hour: "numeric", minute: "numeric" }
    ).format(new Date(this.question.createdAt));
  }

  /**
   * This is PARSED question content, not the original
   */
  get question_content(): string {
    return this.question.content;
  }

  get array_content() {
    if (this.cache)
      return this.cache;
    return this.cache = questionText(this.question.content);
  }

  /**
   * This is PARSED question answer, not the original
   */
  get question_answer(): string {
    return this.question.answer?.content ?? "";
  }

  get array_answer() {
    if (this.answer_cache)
      return this.answer_cache;
    return this.answer_cache = questionText(this.question.answer?.content ?? "");
  }

  get reply_count(): number {
    return this.question.replyCount;
  }

  get like_count(): number {
    return this.question.answer?.likeCount || 0;
  }

  get is_owner() {
    return this.$accessor.isLogged && this.$accessor.loggedUser!.id === this.question.receiver.id;
  }

  get sharable_text() {
    return this.getShareableText(this.question);
  }

  get question_url() {
    return QUESTION_IT_FULL_URL + '/u/' + this.question.receiver.slug + '/' + this.question.id;
  }

  get sharable_url() {
    return 'https://twitter.com/intent/tweet?text=' +
      this.safeUrlComponentEncode(this.sharable_text) +
      '&url=' +
      this.safeUrlComponentEncode(this.question_url) +
      '&via=QuestionItSpace';
  }

  get is_reply() {
    return !!this.question.inReplyToQuestionId;
  }

  get liked() {
    return this.question.answer?.liked ?? false;
  }

  get replies_path() {
    return this.localePath('/u/' + this.question.receiver.slug + '/' + this.question.id);
  }

  get divider_class() {
    return 'content-divider' + (this.question.questionOfTheDay ? ' blue' : '');
  }

  get username_class() {
    return 'question-card-user-username' + (this.question.questionOfTheDay ? ' blue' : '');
  }

  get has_poll() {
    return !!this.question.attachments?.poll;
  }

  copyLinkToClipboard() {
    navigator.clipboard.writeText(this.question_url)
      .then(() => {
        this.$toast.success(this.$t('link_copied_clipboard'));
      })
      .catch(() => {
        handleError(new Error(this.$t('unsupported_navigator').toString()), this);
      });
  }

  protected findBestMaximums(content_length: number, answer_length: number) {
    const MAX = 210;

    // Si on ne dépasse pas le maximum
    if (content_length + answer_length <= MAX) {
      return [content_length, answer_length];
    }

    // Si les deux dépassent 110 caractères
    if (content_length > (MAX / 2) && answer_length > (MAX / 2)) {
      return [MAX / 2, MAX / 2];
    }

    // Un des deux fait moins de 110
    // C'est content_length
    if (content_length < MAX / 2) {
      const max_answer = MAX - content_length;
      return [content_length, max_answer];
    }
    // C'est answer_length
    else {
      const max_content = MAX - answer_length;
      return [max_content, answer_length];
    }
  }

  protected appendBoundary(content: string) {
    const BOUNDARY = '[…]';
    // Maximum search for blank character
    const MAX_SEARCH_LIMIT = 10;

    let match: number = -1;
    for (let i = content.length - 1; i > content.length - MAX_SEARCH_LIMIT && i >= 0; i--) {
      const current_c = content[i];

      if (current_c.match(/\s/)) {
        // empty character, we could end here
        match = i;
        break;
      }
    }

    if (match !== -1) {
      return content.slice(0, match).trimRight() + ' ' + BOUNDARY;
    }

    return content + BOUNDARY;
  }

  protected getShareableText(question: ISentQuestion) {
    let real_answer_text = question.answer!.content;
    if (real_answer_text.length === 0 && question.answer!.attachment?.url) {
      real_answer_text = '🖼️';
    }
    if (question.attachments?.poll) {
      real_answer_text = ('📊 ' + real_answer_text).trimRight();
    }

    const [content_boundary, answer_boundary] = this.findBestMaximums(question.content.length, real_answer_text.length);
    let content = this.safeStringSlice(question.content, [0, content_boundary]);
    let answer = this.safeStringSlice(real_answer_text, [0, answer_boundary]);

    if (content.length !== question.content.length) {
      // Content is truncated
      content = this.appendBoundary(content);
    }
    if (answer.length !== real_answer_text.length) {
      // Answer is truncated
      answer = this.appendBoundary(answer);
    }

    const text = content + ' – ' + answer;

    return text.trim();
  }

  protected isSurrogatePair(char: string) {
    const charCode = char.charCodeAt(0);
    return charCode >= 0xD800 && charCode <= 0xDBFF;
  }

  protected safeStringSlice(str: string, boundaries: [number, number]) {
    let slicedString = str.slice(...boundaries);

    // Trim last character until last caracter isn't a Unicode surrogate pair
    while (slicedString.length && this.isSurrogatePair(slicedString[slicedString.length - 1])) {
      slicedString = slicedString.slice(0, slicedString.length - 1);
    }

    return slicedString;
  }

  protected safeUrlComponentEncode(str: string): string {
    try {
      return encodeURIComponent(str);
    } catch (e) {
      return this.safeUrlComponentEncode(str.slice(0, str.length - 1));
    }
  }
}
