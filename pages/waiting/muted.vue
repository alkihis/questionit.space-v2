<template>
  <main v-if="!error">
    <section class="hero is-light">
      <div class="hero-body">
        <div class="container">
          <h1 class="title">
            {{ $t('muted_questions') }}
          </h1>
          <h2 class="subtitle">
            <span>
              {{ $t('muted_questions_masked') }}
            </span>
            <nuxt-link class="settings-link" :to="localePath('/settings')">{{ $t('here') }}</nuxt-link>.
          </h2>
        </div>
      </div>
    </section>

    <fluid-container>
      <div v-if="questions && questions.items.length" class="box" style="margin-top: 2rem">
        <question-card-no-reply
          v-for="item in questions.items"
          :key="item.id"
          :question="item"
          @submitted="handleSubmitted"
          @deleted="deleteQuestion"
        />
      </div>
      <div v-else class="no-notifications">
        <p class="nanum">
          {{ $t('no_muted_waiting_question') }}.
        </p>
      </div>

      <client-only>
        <infinite-loading @infinite="loadQuestions" />
      </client-only>
    </fluid-container>
  </main>

  <full-error v-else :error="error" />
</template>

<script lang="ts">
import { Vue, Component } from 'nuxt-property-decorator';
import { isAxiosError, convertAxiosError, makeTitle, handleError } from '~/utils/helpers';
import { StateChanger } from 'vue-infinite-loading';
import QuestionCardNoReply from '~/components/QuestionCardNoReply/QuestionCardNoReply.vue';
import type { IPaginatedWithIdsResult, ISentQuestion } from '~/utils/types/sent.entities.types';

@Component({
  components: {
    QuestionCardNoReply,
  },
  middleware: 'logged',
  layout: 'default_solid',
  async asyncData({ app }) {
    try {
      const questions = await app.$axios.$get('question/waiting', { params: { muted: 'true' } });

      return { questions };
    } catch (error) {
      if (isAxiosError(error)) {
        error = convertAxiosError(error);
      }
      return { error };
    }
  },
})
export default class extends Vue {
  questions: IPaginatedWithIdsResult<ISentQuestion> | null = null;
  error: any = null;
  questionsComplete = false;
  deleteLoading = false;

  head() {
    return {
      title: makeTitle(this.$t('muted_questions').toString()),
    };
  }

  async loadQuestions($state: StateChanger) {
    if (!this.questions || !this.questions.items.length || this.questionsComplete) {
      this.questionsComplete = true;
      $state.complete();
      return;
    }

    try {
      const untilId = this.questions.items[this.questions.items.length - 1].id;
      // Get answers
      const newQuestions = (await this.$axios.get('question/waiting', { params: { untilId, muted: 'true' } })).data as IPaginatedWithIdsResult<ISentQuestion>;

      if (newQuestions.items.length) {
        this.questions.items = [...this.questions.items, ...newQuestions.items];
        $state.loaded();
      }
      else {
        this.questionsComplete = true;
        $state.complete();
        return;
        // no answers left.
      }
    } catch (e) {
      handleError(e, this);
      $state.error();
    }
  }

  async deleteQuestion(item: ISentQuestion) {
    if (this.deleteLoading) {
      return;
    }

    this.deleteLoading = true;

    try {
      await this.$axios.delete(`question/${item.id}`);

      this.$toast.show(this.$t('question_has_been_deleted'), { type: 'success' });
      this.handleDelete(item.id);
    } catch (e) {
      handleError(e, this);
    }

    this.deleteLoading = false;
  }

  handleDelete(id: number) {
    if (this.questions) {
      this.questions.items = this.questions.items.filter(e => e.id !== id);
    }
  }

  handleSubmitted(_: ISentQuestion, original: ISentQuestion) {
    if (this.questions) {
      this.questions.items = this.questions.items.filter(e => e.id !== original.id);
    }
  }
}
</script>

<style lang="scss" scoped>
.settings-link {
  color: #3273dc !important;
}
.no-notifications {
  margin-top: 3rem;
  text-align: center;
  font-size: 1.2rem;
}
</style>
