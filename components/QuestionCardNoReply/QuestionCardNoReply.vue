<template>
  <article class="media">
    <section class="media-left">
      <nuxt-link v-if="has_emitter" :to="profile_link">
        <figure class="image is-64x64">
          <img :src="profile_picture" :alt="username" draggable="false">
        </figure>
      </nuxt-link>
      <figure v-else class="image is-64x64">
        <img :src="profile_picture" :alt="username" draggable="false">
      </figure>
    </section>

    <section class="media-content">
      <div class="content">
        <div :class="divider_class"></div>

        <p>
          <span class="question-card-user">
            <nuxt-link v-if="has_emitter" :to="profile_link" class="question-card-user-username">{{ username }}</nuxt-link>
            <span v-else :class="username_class">{{ username }}</span>
            <span v-if="!ofDay">
              <span class="question-card-user-divider">·</span>
              <span class="question-card-user-time" :title="full_date">{{ question_date }}</span>
            </span>
          </span>
          <a
            v-if="is_reply"
            class="question-card-reply"
            target="_blank"
            :href="localePath('/u/' + question.receiver.slug + '/' + question.inReplyToQuestionId)"
          >
            <span class="icon has-text-info">
              <i class="fas fa-reply"></i>
            </span>
            <span>
              {{ $t('in_reply_to_a_question') }}
            </span>
          </a>

          <span class="question-card-question">
            <question-text
              v-for="(item, $index) in array_content"
              :key="$index"
              :part="item"
            />
          </span>
        </p>
      </div>

      <div class="question-card-response">
        <question-text-area
          v-if="!is_poll"
          v-model="answer"
          :placeholder="$t('write_response')"
          :maxLength="650"
          :hasImageIcon="image ? null : true"
          @ctrl-enter="submitAnswer"
          @addimage="clickImage"
          @drop.native.prevent.stop="onDrop"
          @paste="onPaste"
        />
        <poll-choice
          v-else
          :choices="question.attachments.poll.options"
          :choice="answer"
          :allowChoice="true"
          @item-select="onPollChoice"
        />

        <div :class="{ 'reply-buttons': true, 'no-reply-footer': true, 'with-image': !!image_url }">
          <div v-if="image_url" class="will-reply-image">
            <div :style="{ backgroundImage: 'url(' + image_url + ')' }" class="img" />

            <span class="icon" @click="removeImage">
              <i class="fas fa-times"></i>
            </span>
          </div>

          <input type="checkbox" class="is-checkradio is-circle is-info" :id="'post_on_twitter' + (ofDay ? '-day-' : '') + question.id" v-model="post_on_twitter">
          <label class="checkbox" :for="'post_on_twitter' + (ofDay ? '-day-' : '') + question.id">
            {{ $t('post_on_twitter') }}
          </label>
        </div>

        <div class="reply-buttons">
          <button class="button is-danger" @click="deleteQuestion">
            <span v-if="ofDay">
              {{ $t('hide') }}
            </span>
            <span v-else>
              {{ $t('delete') }}
            </span>
          </button>

          <button :class="{ 'button': true, 'is-link': true, 'is-loading': posting }" :disabled="posting || (!answer && !image)" @click="submitAnswer">
            {{ $t('answer') }}
          </button>
        </div>
      </div>
    </section>

    <input type="file" class="hidden-file" @change="addImage" />
  </article>
</template>

<style lang="scss" src="./QuestionCardNoReply.scss" scoped></style>

<script lang="ts">
import { Component, Prop } from 'nuxt-property-decorator';
import { handleError } from '~/utils/helpers';
import QuestionBase from '../QuestionBase/QuestionBase';
import QuestionText from '../QuestionText/QuestionText';
import QuestionTextArea from '../QuestionTextArea.vue';
import PollChoice from '../PollChoice.vue';
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
    return !!this.question.attachments?.poll;
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
      payload.append('postQuestionOnTwitter', String(this.post_on_twitter));

      if (this.ofDay) {
        payload.append('isQuestionOfTheDay', 'true');
        payload.append('dayQuestionLanguage', this.$i18n.locale);
      }

      if (this.image) {
        payload.append('picture', this.image);
      }

      const question = (await this.$axios.post(
        `question/${this.question.id}/answer`,
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
</script>
