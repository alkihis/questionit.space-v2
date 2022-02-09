<template>
  <main>
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
      <div v-if="questions && questions.length" class="box" style="margin-top: 2rem">
        <question-card-no-reply
          v-for="item in (questions || [])"
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
</template>

<script lang="ts">
import { Vue, Component } from 'nuxt-property-decorator';
import { isAxiosError, convertAxiosError, makeTitle, handleError } from '~/utils/helpers';
import { StateChanger } from 'vue-infinite-loading';
import QuestionCardNoReply from '~/components/QuestionCardNoReply/QuestionCardNoReply';
import { ISentQuestion } from "~/utils/types/sent.entities.types";

@Component({
  components: {
    QuestionCardNoReply: QuestionCardNoReply
  },
  middleware: 'logged',
  layout: 'default_solid',
  async asyncData({ app }) {
    try {
      const questions = await app.$axios.$get('questions/waiting', { params: { muted: 'true' } });

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
  questions: ISentQuestion[] | null = null;
  error?: any;
  questions_complete = false;
  delete_loading = false;

  head() {
    return {
      title: makeTitle(this.$t('muted_questions').toString()),
    };
  }

  async loadQuestions($state: StateChanger) {
    if (!this.questions || !this.questions.length || this.questions_complete) {
      this.questions_complete = true;
      $state.complete();
      return;
    }

    try {
      const last_id = this.questions[this.questions.length - 1].id;
      // Get answers
      const new_questions = (await this.$axios.get('questions/waiting', { params: { until: last_id, muted: 'true' } })).data as ISentQuestion[];

      if (new_questions.length) {
        this.questions = [...this.questions, ...new_questions];
        $state.loaded();
      }
      else {
        this.questions_complete = true;
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
    if (this.delete_loading) {
      return;
    }

    this.delete_loading = true;

    try {
      await this.$axios.delete('questions', {
        params: { question: item.id },
      });

      this.$toast.show(this.$t('question_has_been_deleted'), { type: 'success' });
      this.handleDelete(item.id);
    } catch (e) {
      handleError(e, this);
    }

    this.delete_loading = false;
  }

  handleDelete(id: number) {
    this.questions = this.questions?.filter(e => e.id !== id) ?? null;
  }

  handleSubmitted(_: ISentQuestion, original: ISentQuestion) {
    this.questions = this.questions?.filter(e => e.id !== original.id) ?? null;
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
