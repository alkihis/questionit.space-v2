<template>
  <main v-if="!error">
    <section class="hero is-light">
      <div class="hero-body">
        <div class="container">
          <h1 class="title">
            {{ $t('waiting_questions') }}
          </h1>
          <h2 class="subtitle">
            {{ $t('find_here_questions_by_other_users') }}.

            <span v-if="hasMutedQuestions" class="has-muted-questions nanum">
              <br>
              <span>
                {{ $t('you_have_awaiting_muted_questions') }}
              </span>
              <nuxt-link :to="localePath('/waiting/muted')">{{ $t('consult_here') }}</nuxt-link>.
            </span>
          </h2>
        </div>
      </div>
    </section>

    <fluid-container>
      <article v-if="askActivateNotifications" class="message is-link ask-notifications">
        <div class="message-body">
          <span>{{ $t('receive_notifications_message') }}.</span>
          <a href="#!" @click.prevent="enablePushNotification()">
            <strong>{{ $t('click_here_to_activate') }}.</strong>
          </a>
        </div>
      </article>
      <article v-else-if="receiveNotifications" class="message is-link ask-notifications">
        <div class="message-body">
          <span>{{ $t('accepted_notifications_message') }}.</span>
          <a href="#!" @click.prevent="disablePushNotification()">
            <strong>{{ $t('unregister') }}.</strong>
          </a>
        </div>
      </article>

      <div v-if="ofTheDay">
        <div v-if="!hasAlreadyRepliedToDayQuestion" class="box" style="margin-top: 2rem;">
          <question-card-no-reply
            :question="ofTheDay"
            :ofDay="true"
            @submitted="handleDaySubmitted"
            @deleted="handleDayDelete"
          />
        </div>

        <div v-else class="no-notifications already-replied">
          <p class="nanum">
            <span>
              {{ $t('you_already_replied_to_question_of_the_day') }}.
            </span>
            <span>
              {{ $t('you_can_consult_it') }}
            </span>
            <nuxt-link :to="ofTheDayLink">{{ $t('here') }}</nuxt-link>.
          </p>
        </div>

        <div>
          <div class="divider">{{ $t('waiting_questions') }}</div>
        </div>
      </div>

      <div v-if="questions && questions.items.length" class="box" style="margin-top: 2rem">
        <question-card-no-reply
          v-for="item in questions.items"
          :key="item.id"
          :question="item"
          @submitted="handleSubmitted"
          @deleted="willDelete"
        />
      </div>
      <div v-else class="no-notifications">
        <p class="nanum">
          {{ $t('no_waiting_question') }}.
        </p>
      </div>

      <client-only>
        <infinite-loading @infinite="loadQuestions" />
      </client-only>
    </fluid-container>

    <!-- Modal for question delete -->
    <bulma-modal :open="!!deleteQuestionId" :card="true" @close="cancelDelete()">
      <header class="modal-card-head">
        <p class="modal-card-title">{{ $t('delete_this_question') }}</p>
        <button class="delete" aria-label="close" @click="cancelDelete()"></button>
      </header>
      <section class="modal-card-body">
        <!-- Content -->
        <p>
          {{ $t('this_question_will_be_deleted_forever') }}.
        </p>
      </section>
      <footer class="modal-card-foot is-flex-right">
        <button
          :disabled="deleteLoading"
          :class="{ 'button': true, 'is-danger': true, 'is-loading': deleteLoading }"
          @click="deleteQuestion()"
        >{{ $t('delete') }}</button>
        <button class="button" @click="cancelDelete()">{{ $t('cancel') }}</button>
      </footer>
    </bulma-modal>
  </main>
  <full-error v-else :error="error" />
</template>

<script lang="ts">
import { Component, Vue } from 'nuxt-property-decorator';
import QuestionCardNoReply from '~/components/QuestionCardNoReply/QuestionCardNoReply.vue';
import { makeTitle, handleError, isAxiosError, convertAxiosError, cancelPushSubscription } from '~/utils/helpers';
import { StateChanger } from 'vue-infinite-loading';
import BulmaModal from '~/components/BulmaModal/BulmaModal';
import { IPaginatedWithIdsResult, ISentQuestion } from '~/utils/types/sent.entities.types';

interface AlreadyReplied {
  type: 'already_replied'
  id: number;
}

@Component({
  middleware: 'logged',
  components: {
    QuestionCardNoReply,
    BulmaModal,
  },
  async asyncData({ app }) {
    try {
      const questionRes = app.$axios.get('question/waiting');
      let ofTheDayRes: Promise<any> | undefined = undefined;

      const lang = app.i18n.locale;
      if (app.$accessor.loggedUser!.allowQuestionOfTheDay && (lang === 'fr' || lang === 'en')) {
        ofTheDayRes = app.$axios.get('question/day/of/' + lang, { params: { date: new Date().toISOString() } });
      }

      const totalWaitingCountRes = app.$axios.$get('question/waiting/count') as Promise<{ count: number, muted: number }>;

      // Agrégation des requêtes
      await Promise.allSettled([questionRes, ofTheDayRes || Promise.resolve(), totalWaitingCountRes]);

      const questions = (await questionRes).data as IPaginatedWithIdsResult<ISentQuestion>;

      const count = await totalWaitingCountRes;

      let ofTheDay: ISentQuestion | AlreadyReplied | null = null;
      if (ofTheDayRes) {
        try {
          ofTheDay = (await ofTheDayRes).data;
        } catch (e: any) {
          if (e?.response?.data.questionId) {
            ofTheDay = { type: 'already_replied', id: e.response.data.questionId };
          }
        }
      }

      return { questions, ofTheDay, hasMutedQuestions: count.muted > 0 };
    } catch (error) {
      if (isAxiosError(error)) {
        error = convertAxiosError(error);
      }
      return { error };
    }
  },
  layout: 'default_solid',
  scrollToTop: true,
})
export default class extends Vue {
  questions: IPaginatedWithIdsResult<ISentQuestion> | null = null;
  error: any = null;
  ofTheDay: ISentQuestion | AlreadyReplied | null = null;
  hasMutedQuestions!: boolean;

  questionsComplete = false;
  askActivateNotifications: false | ServiceWorkerRegistration = false;
  receiveNotifications: PushSubscription | null = null;

  deleteQuestionId: boolean | number = false;
  deleteLoading = false;

  head() {
    return {
      title: makeTitle(this.$t('waiting_questions').toString()),
    };
  }

  async loadQuestions($state: StateChanger) {
    if (!this.questions?.items.length) {
      this.questionsComplete = true;
      $state.complete();
      return;
    }

    try {
      const untilId = this.questions.items[this.questions.items.length - 1].id;
      // Get answers
      const newQuestions = (await this.$axios.get('question/waiting', { params: { untilId } })).data as IPaginatedWithIdsResult<ISentQuestion>;

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

  async enablePushNotification() {
    const registration = this.askActivateNotifications;

    if (!registration) {
      return;
    }

    this.askActivateNotifications = false;

    try {
      var resp = await this.$axios.get('push/key');
    } catch (e) {
      this.$toast.error(this.$t('unable_to_load_notification'));
      return;
    }

    // data: number[]
    const key = new Uint8Array(resp.data as number[]);

    try {
      const subscription = await registration.pushManager
        .subscribe({
          userVisibleOnly: true,
          applicationServerKey: key
        });

      await this.registerSubscription(subscription.toJSON());
      this.receiveNotifications = subscription;

      this.$toast.success(this.$t('notifications_push_enabled'));
    } catch (e) {
      // Permission denied
    }
  }

  async disablePushNotification() {
    if (!this.receiveNotifications)
      return;

    await this.unregisterSubscription(this.receiveNotifications.toJSON());
    await cancelPushSubscription(this.receiveNotifications);

    this.$toast.success(this.$t('notifications_push_disabled'));
    this.receiveNotifications = null;

    try {
      const registration = await navigator.serviceWorker.ready;
      if (Notification.permission !== 'denied') {
        this.askActivateNotifications = registration;
      }
    } catch (e) {
      return;
    }
  }

  get hasAlreadyRepliedToDayQuestion() {
    return this.ofTheDay && 'type' in this.ofTheDay;
  }

  get ofTheDayLink() {
    if (this.ofTheDay && 'type' in this.ofTheDay) {
      return this.localePath('/u/' + this.$accessor.loggedUser!.slug + '/' + this.ofTheDay.id);
    }
    return '/';
  }

  handleSubmitted(_: ISentQuestion, original: ISentQuestion) {
    this.questions!.items = this.questions!.items.filter(e => e.id !== original.id) ?? null;
    this.$accessor.decrementAnswerWait();
  }

  willDelete(data?: ISentQuestion) {
    if (!data) {
      // question of the day
      this.deleteQuestionId = true;
    }
    else {
      this.deleteQuestionId = data.id;
    }
  }

  async deleteQuestion() {
    if (!this.deleteQuestionId || this.deleteLoading) {
      return;
    }

    if (this.deleteQuestionId === true) {
      this.handleDayDelete();
      this.deleteQuestionId = false;
      return;
    }

    this.deleteLoading = true;

    try {
      await this.$axios.delete('question/' + this.deleteQuestionId);

      this.$toast.show(this.$t('question_has_been_deleted'), { type: 'success' });
      this.handleDelete(this.deleteQuestionId);
      this.deleteQuestionId = false;
    } catch (e) {
      handleError(e, this);
    }

    this.deleteLoading = false;
  }

  cancelDelete() {
    this.deleteQuestionId = false;
  }

  handleDelete(id: number) {
    this.questions!.items = this.questions!.items.filter(e => e.id !== id) ?? null;
    this.$accessor.decrementAnswerWait();
  }

  handleDaySubmitted(data: ISentQuestion) {
    this.ofTheDay = {
      id: data.id,
      type: 'already_replied'
    };
  }

  handleDayDelete() {
    this.ofTheDay = null;
  }

  async registerSubscription(sub: PushSubscriptionJSON) {
    await this.$axios.post('push', sub);
  }

  async unregisterSubscription(sub: PushSubscriptionJSON) {
    await this.$axios.delete('push', { params: { endpoint: sub.endpoint } });
  }

  onWorkerMessage(evt: { data: { question: ISentQuestion, type: string } }) {
    if (evt.data.type === 'question-worker' && this.questions) {
      this.questions.items = [evt.data.question, ...(this.questions?.items || [])];
    }
  }

  async mounted() {
    this.onWorkerMessage = this.onWorkerMessage.bind(this);

    try {
      var registration = await navigator.serviceWorker.ready;
    } catch (e) {
      return;
    }

    // Safari
    if (!registration.pushManager) {
      return;
    }

    // Subscribe to sw broadcast channel to refresh questions when they arrive.
    navigator.serviceWorker.addEventListener('message', this.onWorkerMessage);

    // If registration already exists
    const subscription = await registration.pushManager.getSubscription();

    // User doesn't activate push now, and doesn't have denied notifications
    if (subscription === null && Notification.permission !== 'denied') {
      this.askActivateNotifications = registration;
    }
    else if (subscription) {
      this.receiveNotifications = subscription;
    }
  }

  beforeDestroy() {
    navigator.serviceWorker?.removeEventListener('message', this.onWorkerMessage);
  }
}
</script>

<style lang="scss" scoped>
.ask-notifications {
  margin-top: 1rem;
  margin-bottom: 2rem;
}
.no-notifications {
  margin-top: 3rem;
  text-align: center;
  font-size: 1.2rem;
}
.already-replied {
  margin-bottom: 3rem;
}
.has-muted-questions {
  margin-bottom: 1rem;
  font-size: 1rem;

  a {
    color: #3273dc !important;
  }
}
</style>
