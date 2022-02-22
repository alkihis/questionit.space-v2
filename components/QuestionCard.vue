<template>
  <div class="media no-flex">
    <div v-if="pinned" class="pinned-header">
      <span class="pin-icon icon has-text-info is-medium">
        <i class="fas fa-map-pin fa-lg" aria-hidden="true" />
      </span>
      <span class="has-text-info pin-text">
        {{ $t('pinned_question') }}
      </span>
    </div>

    <article class="media">
      <section class="media-left pp-holder">
        <nuxt-link v-if="has_emitter" :to="profile_link">
          <figure class="image is-64x64">
            <img :src="profile_picture" :alt="username" draggable="false">
          </figure>
        </nuxt-link>
        <figure v-else class="image is-64x64">
          <img :src="profile_picture" :alt="username" draggable="false">
        </figure>

        <span v-if="inTimeline" class="receiver-pp">
          <nuxt-link :to="receiver_link">
            <figure class="image is-32x32 has-tooltip has-tooltip-bottom" :data-tooltip="receiver_name">
              <img :src="receiver_pp" :alt="receiver_name" draggable="false">
            </figure>
          </nuxt-link>
        </span>
      </section>

      <section class="media-content">
        <div class="content">
          <div :class="divider_class"></div>

          <p>
            <!-- User -->
            <span class="question-card-user">
              <nuxt-link v-if="has_emitter" :to="profile_link" class="question-card-user-username">{{ username }}</nuxt-link>
              <span v-else :class="username_class">{{ username }}</span>
              <span class="question-card-user-divider">·</span>
              <a
                :href="replies_path"
                @click.prevent="handleReplyLinkClick(replies_path)"
                class="question-card-user-time"
              >{{ question_date }}</a>
            </span>

            <!-- The real question -->
            <span class="question-card-question">
              <question-text
                v-for="(item, $index) in array_content"
                :key="$index"
                :part="item"
              />
            </span>
          </p>
        </div>

        <!-- The question answer -->
        <div class="question-card-response">
          <span v-if="inTimeline" class="in-timeline-receiver-wrapper">
            <nuxt-link :to="receiver_link" class="in-timeline-receiver">{{ receiver_name }}</nuxt-link>
            <span>—</span>
            <!-- Show a poll emoji if on mobile (to avoid weird line break) -->
            <span v-if="has_poll">📊</span>
          </span>

          <span v-if="!has_poll" class="the-response">
            <question-text
              v-for="(item, $index) in array_answer"
              :key="$index"
              :part="item"
            />
          </span>
          <div v-else>
            <poll-choice
              :choices="question.attachements.poll.options"
              :choice="question.answer"
            />
          </div>

          <div v-if="has_answer_image" class="answer-image">
            <video v-if="question.answer.attachment.type === 'gif'" :src="question.answer.attachment.url" autoplay loop muted playsinline @click="openAnswerImage" />
            <img v-else :src="question.answer.attachment.url" :alt="'Image for question ' + question.id" @click="openAnswerImage" />
          </div>
        </div>

        <!-- The footer -->
        <aside class="card-footer" style="flex-direction: column;">
          <div class="level is-mobile">
            <div class="level-left">
              <div class="level-content">
                <!-- Reply button -->
                <a
                  v-if="!replyField"
                  :href="replies_path_with_query"
                  @click.prevent="handleReplyLinkClick(replies_path_with_query)"
                  class="level-item"
                  aria-label="reply"
                >
                  <span class="has-tooltip has-tooltip-top icon is-small" :data-tooltip="$t('reply')">
                    <i class="fas fa-reply" aria-hidden="true">
                    </i>
                    <span>{{ reply_count }}</span>
                  </span>
                </a>

                <!-- Like button -->
                <a v-if="$accessor.isLogged" class="level-item" aria-label="like" @click="like()">
                  <span class="has-tooltip has-tooltip-top icon is-small" :data-tooltip="(question.answer && question.answer.liked) ? $t('unlike') : $t('like')">
                    <i :class="{ far: (!question.answer || !question.answer.liked), fas: (question.answer && question.answer.liked), 'has-text-danger': (question.answer && question.answer.liked), 'fa-heart': true }" aria-hidden="true">
                    </i>
                    <span :class="{ 'has-text-danger': (question.answer && question.answer.liked) }">{{ like_count }}</span>
                  </span>
                </a>

                <!-- Delete button -->
                <a v-if="is_owner" class="level-item" aria-label="delete" @click="$emit('destroy', question)">
                  <span class="has-tooltip has-tooltip-top icon is-small has-text-danger" :data-tooltip="$t('delete')">
                    <i class="fas fa-trash" aria-hidden="true"></i>
                  </span>
                </a>
              </div>

              <div class="level-content">
                <!-- Pin button -->
                <a v-if="allowPin" class="level-item pin-link" :data-pinned="String(pinned)" aria-label="pin" href="#!" @click.prevent="$emit('pin', question)">
                  <span class="has-tooltip has-tooltip-top icon is-small" :data-tooltip="pinned ? $t('unpin') : $t('pin')">
                    <i class="fas fa-map-pin" aria-hidden="true"></i>
                  </span>
                </a>

                <!-- Share button -->
                <Dropdown :right="true">
                  <template v-slot:trigger>
                    <span class="has-tooltip has-tooltip-top icon is-small" style="color: var(--card-level-icon-color);" :data-tooltip="$t('share')">
                      <i class="far fa-share-square" aria-hidden="true"></i>
                    </span>
                  </template>

                  <template v-slot:content>
                    <a class="dropdown-item" aria-label="share" :href="sharable_url" target="_blank" rel="noopener noreferrer">
                      {{ $t('share_on_twitter') }}
                    </a>
                    <a class="dropdown-item pointer" @click="copyLinkToClipboard()">
                      {{ $t('copy_link') }}
                    </a>
                  </template>
                </Dropdown>
              </div>
            </div>
          </div>

          <div v-if="show_reply_field && !want_reply" class="level want-reply">
            <span class="is-clickable has-text-link" @click="wantReply">
              <span class="icon">
                <i class="fas fa-reply"></i>
              </span>
              <span>
                {{ $t('add_a_reply') }}
              </span>
            </span>
          </div>

          <ask-question
            v-if="show_reply_field && want_reply"
            :disabled="!this.can_post"
            :question="question"
            :allowAnonymous="can_post_anon"
            :user="question.receiver"
            mode="reply"
          />
        </aside>

        <span v-if="showRepliesBtn && (question.replyCount || question.inReplyToQuestionId)">
          <a
            :href="replies_path"
            @click.prevent="handleReplyLinkClick(replies_path)"
            class="question-card-see-more-link"
          >
            {{ $t('question_show_replies') }}
          </a>
          <a
            :href="replies_path"
            @click.prevent="handleReplyLinkClick(replies_path)"
            class="question-card-see-more-button button is-info is-light"
          >
            {{ $t('question_show_replies') }}
          </a>
        </span>
      </section>
    </article>

    <modal-image v-if="big_image_showed" @close="closeAnswerImage" :url="question.answer.attachment.url" />
  </div>
</template>

<script lang="ts">
import { Component, Prop } from 'nuxt-property-decorator';
import QuestionBase from './QuestionBase/QuestionBase';
import Dropdown from './Dropdown/Dropdown';
import QuestionText from './QuestionText/QuestionText';
import AccountChooser from './AccountChooser.vue';
import ModalImage from './ModalImage/ModalImage';
import AskQuestion from './AskQuestion.vue';
import PollChoice from './PollChoice/PollChoice';
import { ISentQuestion } from "~/utils/types/sent.entities.types";

@Component({
  components: {
    Dropdown,
    QuestionText,
    AccountChooser,
    ModalImage,
    AskQuestion,
    PollChoice,
  }
})
export default class extends QuestionBase {
  @Prop({ default: true })
  showRepliesBtn!: boolean;

  @Prop({ default: false })
  replyField!: boolean;

  @Prop({ default: false })
  mutedReplies!: boolean;

  @Prop({ default: false })
  inTimeline!: boolean;

  @Prop({ default: false })
  allowPin!: boolean;

  @Prop({ default: false })
  pinned!: boolean;

  @Prop({ default: false })
  immediateReply!: boolean;

  want_reply = false;
  big_image_showed = false;

  async like() {
    if (!this.$accessor.isLogged)
      return;

    let question: ISentQuestion;
    if (!this.question.answer!.liked) {
      question = (await this.$axios.post('likes/' + this.question.answer!.id)).data as ISentQuestion;
    }
    else {
      question = (await this.$axios.delete('likes/' + this.question.answer!.id)).data as ISentQuestion;
    }

    this.question.answer!.liked = question.answer!.liked;
    this.question.answer!.likeCount = question.answer!.likeCount;
    this.$emit('like', question);
  }

  get has_answer_image() {
    return !!this.question.answer?.attachment?.url;
  }

  get replies_path_with_query() {
    return this.replies_path + '?reply=true';
  }

  get can_post_anon() {
    const allow = this.question.receiver.allowAnonymousQuestions;

    return allow;
  }

  get can_post() {
    if (this.$accessor.isLogged) {
      return true;
    }
    return this.can_post_anon;
  }

  get show_reply_field() {
    if (!this.$accessor.isLogged && !this.can_post_anon) {
      return false;
    }
    return this.replyField && !this.is_owner && !this.mutedReplies;
  }

  wantReply() {
    this.want_reply = true;
    this.$nextTick(() => {
      const text = this.$el.querySelector('textarea');

      if (text) {
        text.focus();
      }
    });
  }

  handleReplyLinkClick(url: string) {
    if (this.inTimeline) {
      this.$emit('want-conversation', url.endsWith('reply=true'));
    }
    else {
      this.$router.push(url);
    }
  }

  openAnswerImage() {
    this.big_image_showed = true;
  }

  closeAnswerImage() {
    this.big_image_showed = false;
  }

  mounted() {
    if (this.$route.query.reply === 'true' || this.immediateReply) {
      this.wantReply();
    }
  }
}
</script>

<style lang="scss" scoped>
@import '../node_modules/bulma/sass/utilities/initial-variables';
@import '~/assets/css/functions.scss';

article {
  .sender {
    justify-content: space-between;
    @media screen and (max-width: 1023px) {
      flex-direction: column;
    }

    &.is-flex-right {
      justify-content: flex-end;
    }

    @media screen and (max-width: 1023px) {
      .button {
        margin-top: 1.5rem;
        width: 100%;
      }
    }
  }

  section.media-left {
    @media screen and (max-width: 1023px) {
      display: none;
    }

    img {
      border-radius: 25%;
      box-shadow: 0 0.5em 1em -0.125em rgba(10, 10, 10, .1), 0 0 0 1px rgba(10, 10, 10, .02);
    }

    .receiver-pp {
      position: relative;

      .image {
        position: absolute;
        bottom: -4px;
        right: -66px;

        & > img {
          border: 2px #fbfbfbcc solid;
          box-sizing: content-box;

          // Theme
          @include dark-theme {
            border-color: #272727cc;
          }
        }
      }
    }
  }

  section.media-content {
    @media screen and (max-width: 1023px) {
      overflow: visible;
    }

    .in-timeline-receiver {
      font-weight: 300;
      font-size: 1.1rem;
    }

    @media screen and (min-width: 1024px) {
      .in-timeline-receiver-wrapper {
        display: none;
      }
    }

    div.content {
      display: flex;

      .content-divider {
        width: .35rem;
        flex-shrink: 0;
        background: $orange;
        opacity: var(--question-divider-opacity);
        margin-right: 1rem;
        border-radius: 12px;

        &.blue {
          background: $cyan;
        }

        @media screen and (max-width: 1023px) {
          display: none;
        }
      }
    }

    .question-card {
      &-user {
        display: flex;
        align-items: baseline;

        &-username {
          font-weight: bold;
          color: $orange;
          font-size: large;

          &.blue {
            color: $cyan;
          }
        }

        &-divider, &-time {
          color: $grey-light;
          font-size: small;
        }

        &-time:hover {
          text-decoration: underline;
        }

        &-divider {
          margin: auto .3rem;
        }
      }

      &-question {
        font-weight: 600;
        white-space: pre-line;
        overflow-wrap: anywhere;
        word-break: break-word;

        // Theme
        @include dark-theme {
          color: rgb(247, 247, 247);
        }
      }

      &-response {
        color: var(--card-level-icon-color);

        // Theme
        @include dark-theme {
          color: rgb(224, 224, 224);
        }

        .the-response {
          white-space: pre-line;
          overflow-wrap: anywhere;
          word-break: break-word;
        }

        .answer-image > img, .answer-image > video {
          display: block;
          max-width: 100%;
          max-height: 200px;
          margin-top: .8rem;
          margin-bottom: 5px;
          border-radius: 5px;
          cursor: pointer;
        }
      }

      &-see-more {
        &-link {
          display: block;
          margin-top: .5rem;

          @media screen and (max-width: 1023px) {
            display: none;
          }
        }

        &-button {
          display: none;
          margin-top: 1rem;

          @media screen and (max-width: 1023px) {
            display: block;
          }
        }
      }
    }

    .is-clickable {
      cursor: pointer;

      &:hover {
        text-decoration: underline;
      }
    }

    .pointer {
      cursor: pointer;
    }

    aside.card-footer {
      margin-top: 1rem;
      padding-top: 1rem;

      div.level {
        width: 100%;

        div.level-left {
          width: 100%;
          justify-content: space-between;
        }
      }

      div.level-content {
        display: flex;
      }

      .want-reply {
        display: block;
        text-align: right;
      }

      a {
        color: var(--card-level-icon-color);

        .icon.is-small {
          width: auto;

          span {
            font-weight: bold;
            margin-left: .2rem;
          }
        }

        .fa {
          &-heart:hover {
            color: $red;
          }

          &-reply:hover {
            color: $blue;
          }

          &-share-square:hover {
            color: $purple;
          }
        }
      }
    }
  }

  .pin-link {
    margin-right: 1rem !important;

    &:hover, &[data-pinned="true"] {
      color: #008111 !important;
    }
  }
}

.pinned-header {
  margin-bottom: 1rem;


  .pin-text {
    font-size: 1.2rem;
    vertical-align: top;
    font-weight: 300;
  }
}

div.media.no-flex {
  display: block;

  .media {
    border-top: none;
    padding-top: 0;
  }
}
</style>
