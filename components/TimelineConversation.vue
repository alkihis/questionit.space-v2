<template>
  <div>
    <question-conversation
      v-if="question && !loading"
      :question="question"
      :ancestors="ancestors"
      :replies="replies"
      :has-more="hasMore"
      :has-more-replies="hasMoreReplies"
      :initial-immediate-reply="initialImmediateReply"
      @close="close()"
      @question-change="changeView($event)"
      @like="$emit('like', $event)"
    />
    <bulma-modal v-else-if="loading" :open="true" @close="close()">
      <div class="box loading-box">
        <bulma-loader />
      </div>
    </bulma-modal>
    <!-- Todo better error handling -->
    <bulma-modal v-else-if="error" :open="true" @close="close()">
      <div class="box is-align-center">
        {{ formatError() }}
      </div>
    </bulma-modal>
  </div>
</template>

<script lang="ts">
import { Component, Vue, Prop } from 'nuxt-property-decorator';
import BulmaModal from '~/components/BulmaModal/BulmaModal';
import QuestionCard from '~/components/QuestionCard.vue';
import QuestionAncestor from '~/components/QuestionAncestor/QuestionAncestor';
import QuestionConversation from '~/components/QuestionConversation/QuestionConversation.vue';
import { isAxiosError, convertAxiosError, sleep } from '~/utils/helpers';
import { IPaginatedWithIdsResult, ISentQuestion } from '~/utils/types/sent.entities.types';

const LOAD_SIZE = 10;

@Component({
  components: {
    BulmaModal,
    QuestionCard,
    QuestionAncestor,
    QuestionConversation,
  },
})
export default class extends Vue {
  @Prop({ required: true })
  questionId!: number;

  @Prop({ default: false })
  initialImmediateReply!: boolean;

  question: ISentQuestion | null = null;
  ancestors: ISentQuestion[] | null = null;
  replies: ISentQuestion[] | null = null;
  error?: any = null;

  hasMore: boolean = true;
  hasMoreReplies: boolean = true;

  loading = false;

  close() {
    this.$emit('close');
  }

  changeView(item: ISentQuestion) {
    this.initialImmediateReply = false;
    this.loadForQuestion(item.id);
  }

  async loadForQuestion(id: number) {
    try {
      const questionid = Number(id);
      this.loading = true;

      await Promise.all([
        sleep(500),
        (async () => {
          const questionTreeRequest = this.$axios.get('question/ancestors/' + questionid, { params: { pageSize: LOAD_SIZE } });
          const repliesRequest = this.$axios.get('question/replies/' + questionid, { params: { pageSize: LOAD_SIZE } });

          const {
            question,
            ancestors
          } = (await questionTreeRequest).data as { question: ISentQuestion, ancestors: ISentQuestion[] };

          const replies = (await repliesRequest).data as IPaginatedWithIdsResult<ISentQuestion>;

          this.question = question;
          this.ancestors = ancestors;
          this.replies = replies.items;
          this.hasMore = ancestors.length >= LOAD_SIZE;
          this.hasMoreReplies = replies.items.length >= LOAD_SIZE;
        })(),
      ]);
    } catch (error) {
      if (isAxiosError(error)) {
        error = convertAxiosError(error);
      }
      this.error = error;
    } finally {
      this.loading = false;
    }
  }

  formatError() {
    // todo independant component!
    if (this.error?.response?.status === 404) {
      return this.$t('question_not_found');
    }
    return this.$t('unknown_error');
  }

  mounted() {
    this.loadForQuestion(this.questionId);
  }
}
</script>

<style lang="scss" scoped>
.box.loading-box {
  padding: 24px;
}
</style>
