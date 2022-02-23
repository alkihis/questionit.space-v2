<template>
  <main>
    <section class="hero is-light with-z-index">
      <div class="hero-body">
        <div class="container">
          <h1 class="title">
            {{ $t('timeline') }}
          </h1>
          <h2 class="subtitle">
            {{ $t('home_timeline_description') }}.
          </h2>
        </div>
      </div>
    </section>

    <pull-loader :method="pullRefresh">
      <fluid-container class="root">
        <item-loader
          :text="$t('new_questions', { s: waiting_questions.length > 1 ? 's' : '' }).toString()"
          :count="waiting_questions.length"
          @load="syncWaitingAndTimeline"
        />

        <div class="box" v-if="timeline.items.length">
          <question-card
            v-for="item in timeline.items"
            :key="item.id"
            :question="item"
            :inTimeline="true"
            @like="questionLiked"
            @want-conversation="wantConversation(item, $event)"
          />
        </div>
        <div v-if="timeline.items.length === 0 && completed" class="no-results">
          <p class="nanum">
            {{ $t('no_question_to_show') }}.
          </p>
          <p class="nanum">
            {{ $t('follow_more_persons_to_access_more_questions') }}.
          </p>
        </div>

        <client-only>
          <infinite-loading @infinite="loadItems" />
        </client-only>
      </fluid-container>
    </pull-loader>

    <!-- When a question is clicked -->
    <timeline-conversation
      v-if="selected_question"
      :question-id="selected_question"
      :initial-immediate-reply="reply_conversation"
      @like="questionLiked"
      @close="closeConversation()"
    />
  </main>
</template>

<script lang="ts">
import { Component, Vue } from 'nuxt-property-decorator';
import QuestionCard from '~/components/QuestionCard.vue';
import { handleError, makeTitle, isTouchDevice } from '~/utils/helpers';
import TimelineConversation from '~/components/TimelineConversation.vue';
import { StateChanger } from 'vue-infinite-loading';
import ItemLoader from '~/components/ItemLoader.vue';
import PullLoader from '~/components/PullLoader.vue';
import { IPaginatedWithIdsResult, ISentQuestion } from "~/utils/types/sent.entities.types";

const FETCH_SIZE = 15;

/* Home timeline page */
@Component({
  components: {
    QuestionCard,
    TimelineConversation,
    ItemLoader,
    PullLoader,
  },
  middleware: 'logged',
  layout: 'default_solid',
  scrollToTop: true,
})
export default class extends Vue {
  timeline: IPaginatedWithIdsResult<ISentQuestion> = {
    items: [],
  };
  completed = false;
  selected_question = 0;
  reply_conversation = false;

  interval: number = 0;
  waiting_questions: ISentQuestion[] = [];
  is_loading_waiting = false;

  constructor() {
    super();
    this.refreshQuestions = this.refreshQuestions.bind(this);
  }

  async loadItems($state: StateChanger) {
    try {
      const questions = await this.$axios.$get('question/answer/timeline', {
        params: {
          pageSize: FETCH_SIZE,
          untilId: this.timeline.items[this.timeline.items.length - 1]?.answer?.id,
        },
      }) as IPaginatedWithIdsResult<ISentQuestion>;

      this.timeline = {
        nextSinceId: this.timeline.nextSinceId ?? questions.nextSinceId,
        nextUntilId: questions.nextUntilId,
        items: [...this.timeline.items, ...questions.items],
      };

      if (questions.items.length < FETCH_SIZE) {
        $state.complete();
        this.completed = true;
      }
      else {
        $state.loaded();
      }
    } catch (e) {
      handleError(e, this);
      $state.error();
    }
  }

  wantConversation(item: ISentQuestion, ar1: boolean) {
    this.selected_question = item.id;
    this.reply_conversation = ar1;
  }

  closeConversation() {
    this.selected_question = 0;
  }

  questionLiked(item: ISentQuestion) {
    this.timeline.items.filter(e => e.id === item.id).forEach(e => {
      e.answer!.liked = item.answer!.liked;
      e.answer!.likeCount = item.answer!.likeCount;
    });
  }

  /**
   * Refresh waiting questions number or refresh timeline with newly posted answers
   */
  async refreshQuestions(stash = false) {
    if (this.is_loading_waiting)
      return;

    try {
      this.is_loading_waiting = true;

      const questions: IPaginatedWithIdsResult<ISentQuestion> = await this.$axios.$get(
        'question/answer/timeline',
        {
          params: {
            pageSize: FETCH_SIZE,
            sinceId: this.getMostRecentAnswerId(),
          }
        }
      );

      if (!stash) {
        this.timeline = {
          nextSinceId: questions.nextSinceId,
          nextUntilId: this.timeline.nextUntilId ?? questions.nextUntilId,
          items: [...questions.items, ...this.timeline.items],
        };
      }
      else {
        this.waiting_questions = [...questions.items, ...this.waiting_questions];
      }
    } catch (e) {
      // failed to refresh :'(
      return -1;
    } finally {
      this.is_loading_waiting = false;
    }
  }

  async pullRefresh() {
    await this.refreshQuestions(false);
  }

  syncWaitingAndTimeline() {
    const questions = this.waiting_questions;
    this.waiting_questions = [];
    this.timeline = {
      nextSinceId: questions[0]?.answer?.id ?? this.timeline.nextSinceId,
      nextUntilId: this.timeline.nextUntilId,
      items: [...questions, ...this.timeline.items],
    };
  }

  protected getMostRecentAnswerId() {
    if (this.waiting_questions.length)
      return this.waiting_questions[0].answer!.id;

    if (this.timeline.items.length)
      return this.timeline.items[0].answer!.id;

    return 0;
  }

  head() {
    return {
      title: makeTitle(this.$t('timeline').toString()),
    };
  }

  mounted() {
    if (!isTouchDevice()) {
      this.interval = setInterval(this.refreshQuestions, 1000 * 60, true) as any as number;
    }
  }

  beforeDestroy() {
    clearInterval(this.interval);
    this.interval = 0;
  }
}
</script>

<style lang="scss" scoped>
.no-results {
  margin-top: 3rem;
  text-align: center;
  font-size: 1.2rem;
}
.root {
  margin-bottom: 3rem;
}
.center {
  display: block;
  top: 0; left: 0;
  bottom: 0; right: 0;
  margin: auto;
}
.wrapper {
  width: 100%;
  max-width: 1000px;
  height: 100%;
  margin: 0 auto;
  margin-top: 3rem;
  margin-bottom: 2rem;
  animation: fade-in .3s;
}
.loader-wrapper {
  margin-top: 3rem;
}
.box {
  margin-top: 1rem;
}
</style>
