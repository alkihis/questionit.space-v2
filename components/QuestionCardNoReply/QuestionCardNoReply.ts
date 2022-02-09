import { Component, Prop } from 'nuxt-property-decorator';
import { handleError } from '~/utils/helpers';
import QuestionBase from '../QuestionBase/QuestionBase';
import QuestionText from '../QuestionText/QuestionText';
import QuestionTextArea from '../QuestionTextArea/QuestionTextArea';
import PollChoice from '../PollChoice/PollChoice';
import { ISentQuestion } from "~/utils/types/sent.entities.types";

const MAX_FILE_SIZE = 2.5 * 1024 * 1024;
const MAX_GIF_FILE_SIZE = 8 * 1024 * 1024;

@Component({
  components: {
    QuestionText: QuestionText,
    QuestionTextArea: QuestionTextArea,
    PollChoice: PollChoice,
  }
})
export default class extends QuestionBase {
  @Prop({ default: false })
  ofDay!: boolean;

  answer = '';
  post_on_twitter = true;
  posting = false;
  image: File | null = null;
  image_url: string | null = null;

  get is_poll() {
    return !!this.question.attachements?.poll;
  }

  onPollChoice(item: string) {
    this.answer = item;
  }

  clickImage() {
    const input = this.$el.querySelector('input[type="file"].hidden-file') as HTMLInputElement;
    input.click();
  }

  addImage() {
    const input = this.$el.querySelector('input[type="file"].hidden-file') as HTMLInputElement;
    const file = input.files?.[0];

    if (!file)
      return;

    input.value = '';
    this.assignImage(file);
  }

  onDrop(event: DragEvent) {
    const file = event.dataTransfer?.files?.item(0);

    if (!file)
      return;

    this.assignImage(file);
  }

  onPaste(event: ClipboardEvent) {
    const items = event.clipboardData?.items;

    if (!items)
      return;

    for (let i = 0; i < items.length; i++) {
      const item = items[i];

      if (item.kind === 'file') {
        const blob = item.getAsFile();

        if (blob) {
          this.assignImage(blob);
          return;
        }
      }
    }
  }

  async assignImage(file: File) {
    if (!['image/jpeg', 'image/png', 'image/gif'].includes(file.type)) {
      this.$toast.error(this.$t('answer_file_type_incorrect'));
      return;
    }

    // Checking size by MIME type
    if (file.type === 'image/gif') {
      if (file.size > MAX_GIF_FILE_SIZE) {
        this.$toast.error(this.$t('answer_file_is_too_big'));
        return;
      }
    }
    else if (file.size > MAX_FILE_SIZE) {
      this.$toast.error(this.$t('answer_file_is_too_big'));
      return;
    }

    // TODO: Better check image validity

    // If an image is already set, remove it to replace by currently selected
    if (this.image)
      this.removeImage();

    this.image = file;
    this.image_url = URL.createObjectURL(this.image);

    // console.log('Assigned image', this.image, this.image_url);
  }

  removeImage() {
    const input = this.$el.querySelector('input[type="file"].hidden-file') as HTMLInputElement;
    input.value = '';

    this.image = null;

    if (this.image_url)
      URL.revokeObjectURL(this.image_url);

    this.image_url = null;
  }

  async deleteQuestion() {
    if (this.ofDay) {
      this.$emit('deleted');
      return;
    }

    this.$emit('deleted', this.question);
  }

  async submitAnswer() {
    if (this.posting)
      return;

    this.posting = true;
    try {
      const payload = new FormData();
      payload.append('answer', this.answer);
      payload.append('question', this.question.id.toString());
      payload.append('post_on_twitter', String(this.post_on_twitter));

      if (this.ofDay) {
        payload.append('is_of_the_day', 'true');
        payload.append('day_language', this.$i18n.locale);
      }

      if (this.image) {
        payload.append('picture', this.image);
      }

      const question = (await this.$axios.post(
        'questions/answer',
        payload,
        { headers: { 'Content-Type': 'multipart/form-data' }
      })).data as ISentQuestion;

      this.$emit('submitted', question, this.question);

      this.$toast.success(this.$t('answer_submitted'));
    } catch (e) {
      handleError(e, this);
    }
    this.posting = false;
  }

  mounted() {
    if (typeof this.$accessor.loggedUser?.sendQuestionsToTwitterByDefault === 'boolean') {
      this.post_on_twitter = this.$accessor.loggedUser?.sendQuestionsToTwitterByDefault ?? false;
    }
  }
}
