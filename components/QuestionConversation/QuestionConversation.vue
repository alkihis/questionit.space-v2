<template>
  <bulma-modal @close="close()" :open="true">
    <div class="conversation-box box">
      <!-- render question card, replies...; center at question card element when rendered -->
      <div class="ancestors-heading">
        <span v-if="ancestors.length || replies.length">{{ $t('conversation_with') }}</span>
        <span v-else>{{ $t('answer_of') }}</span>
        <nuxt-link :to="localePath('/u/' + question.receiver.slug)">
          <strong>{{ question.receiver.name }}</strong>
        </nuxt-link>
      </div>

      <!-- First, render ancestors -->
      <div v-if="ancestors.length" class="timeline">
        <header class="timeline-header">
          <!-- If first question fetched (no more) -->
          <span v-if="!hasMoreReplies" class="tag is-medium is-info">{{ $t('first_question') }}</span>

          <!-- If more available -->
          <a v-if="hasMoreReplies && !loading_ancestors" href="#!" @click="loadPrevious()" class="tag is-medium is-warning">{{ $t('load_more') }}</a>

          <!-- If more being fetched -->
          <span v-if="loading_ancestors" class="tag is-medium is-info">...</span>
        </header>
        <div v-for="item in ancestors" class="timeline-item is-info" :data-question="item.id" :key="item.id" @click="changeView(item)">
          <div class="timeline-marker is-info"></div>
          <question-ancestor :question="item" />
        </div>
      </div>

      <!-- Real question -->
      <question-card
        :question="question"
        :showRepliesBtn="false"
        :replyField="true"
        :mutedReplies="!allowReplies"
        :allowPin="allowPin"
        :pinned="pinned"
        :immediateReply="immediateReply"
        @destroy="$emit('destroy', $event)"
        @like="$emit('like', $event)"
        @pin="$emit('pin', $event)"
      />

      <!-- Replies -->
      <div v-if="replies.length" class="timeline timeline-replies">
        <header>
          <p class="heading">
            {{ $t('replies') }}
          </p>
        </header>

        <div v-for="item in replies" class="timeline-item timeline-reply-item" :data-question="item.id" :key="item.id" @click="changeView(item)">
          <div class="timeline-marker is-success"></div>
          <question-ancestor :question="item" />
        </div>
        <header v-if="(hasMoreReplies && !loading_replies) || loading_replies" class="timeline-header">
          <!-- If more available -->
          <a v-if="hasMoreReplies && !loading_replies" href="#!" @click="loadPrevious()" class="tag is-medium is-warning">{{ $t('load_more') }}</a>

          <!-- If more being fetched -->
          <span v-if="loading_replies" class="tag is-medium is-warning">...</span>
        </header>
      </div>
    </div>
  </bulma-modal>
</template>

<script lang="ts">
import { Component, Vue, Prop } from 'nuxt-property-decorator';
import BulmaModal from '~/components/BulmaModal.vue';
import QuestionAncestor from '~/components/QuestionAncestor.vue';
import { handleError } from '~/utils/helpers';
import { IPaginatedWithIdsResult, ISentQuestion } from '~/utils/types/sent.entities.types';
import QuestionCard from "~/components/QuestionCard.vue";

const LOAD_SIZE = 10;

@Component({
  components: {
    QuestionCard,
    BulmaModal,
    QuestionAncestor,
  },
})
export default class extends Vue {
  @Prop({ required: true })
  question!: ISentQuestion;

  @Prop({ required: true })
  ancestors!: ISentQuestion[];

  @Prop({ required: true })
  replies!: ISentQuestion[];

  @Prop({ default: true })
  allowReplies?: boolean;

  @Prop({ default: true })
  hasMore!: boolean;

  @Prop({ default: true })
  hasMoreReplies!: boolean;

  @Prop({ default: false })
  allowPin!: boolean;

  @Prop({ default: false })
  pinned!: boolean;

  @Prop({ default: false })
  initialImmediateReply!: boolean;

  immediateReply = this.initialImmediateReply;
  loading_ancestors = false;
  loading_replies = false;

  close() {
    this.$emit('close');
  }

  changeView(item: ISentQuestion) {
    this.$emit('question-change', item);
  }

  async loadPrevious() {
    const first = this.ancestors[0];

    if (!first || this.loading_ancestors) {
      return;
    }

    this.loading_ancestors = true;

    try {
      const data = (await this.$axios.get('question/ancestors/' + first.id, { params: { pageSize: LOAD_SIZE } })).data as { ancestors: ISentQuestion[] };

      if (data.ancestors.length) {
        this.ancestors = [...data.ancestors, ...this.ancestors];
        this.hasMore = data.ancestors.length >= LOAD_SIZE;
      }
      else {
        this.hasMore = false;
      }
    } catch (e) {
      handleError(e, this);
    }

    this.loading_ancestors = false;
  }

  async loadReplies() {
    const last = this.replies[this.replies.length - 1];

    if (!last || this.loading_replies) {
      return;
    }

    this.loading_replies = true;

    try {
      const data = (await this.$axios.get('question/replies/' + last.id, { params: { pageSize: LOAD_SIZE } })).data as IPaginatedWithIdsResult<ISentQuestion>;

      if (data.items.length) {
        this.replies = [...this.replies, ...data.items];
        this.hasMoreReplies = data.items.length >= LOAD_SIZE;
      }
      else {
        this.hasMoreReplies = false;
      }
    } catch (e) {
      handleError(e, this);
    }

    this.loading_replies = false;
  }

  mounted() {
  }
}
</script>

<style lang="scss" scoped>
@import '~/assets/css/functions.scss';

.box {
  padding: 24px;
  overflow-x: hidden;
}

.timeline .timeline-header .tag.is-medium.is-info {
  background-color: var(--tag-timeline-bg-color);
}

.timeline .timeline-item.is-info::before {
  background-color: var(--tag-timeline-line-bg-color);
}

.timeline .timeline-item .timeline-marker.is-info {
  background-color: var(--tag-timeline-line-bg-color) !important;
  border-color: var(--tag-timeline-line-bg-color) !important;
}

.conversation-box {
  .timeline-item[data-question] {
    cursor: pointer;
  }

  div.ancestors-heading {
    text-align: center;
    font-size: 1.3rem;
    letter-spacing: 2px;
    padding-bottom: 24px;
    border-bottom: 1px solid var(--divider-border-color);
    margin-bottom: 20px;
  }

  .timeline-replies {
    margin-top: 1.5rem;

    & > header {
      text-align: center;

      & > p.heading {
        color: var(--answers-text-color);
        font-size: 95%;
      }
    }
  }

  .timeline.timeline-replies .timeline-reply-item.timeline-item::before {
    background-color: rgba(255, 255, 255, 0);
  }
}
</style>
