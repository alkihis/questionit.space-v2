<template>
  <div>
    <question-conversation
      v-if="question && !loading"
      :question="question"
      :ancestors="ancestors"
      :replies="replies"
      :has_more="has_more"
      :has_more_replies="has_more_replies"
      :initialImmediateReply="initialImmediateReply"
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
import { ISentQuestion } from "~/utils/types/sent.entities.types";

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
  question_id!: number;

  @Prop({ default: false })
  initialImmediateReply!: boolean;

  question: ISentQuestion | null = null;
  ancestors: ISentQuestion[] | null = null;
  replies: ISentQuestion[] | null = null;
  error?: any = null;

  has_more!: boolean;
  has_more_replies!: boolean;

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
          const q_and_a = this.$axios.get('questions/tree/' + questionid, { params: { size: LOAD_SIZE } });
          const res_replies = this.$axios.get('questions/replies/' + questionid, { params: { size: LOAD_SIZE } });

          const {
            question,
            ancestors
          } = (await q_and_a).data as { question: ISentQuestion, ancestors: ISentQuestion[] };

          const replies = (await res_replies).data as ISentQuestion[];

          this.question = question;
          this.ancestors = ancestors;
          this.replies = replies;
          this.has_more = ancestors.length >= LOAD_SIZE;
          this.has_more_replies = replies.length >= LOAD_SIZE;
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
    this.loadForQuestion(this.question_id);
  }
}
</script>

<style lang="scss" scoped>
.box.loading-box {
  padding: 24px;
}
</style>
