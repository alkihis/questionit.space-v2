<template>
  <main>
    <section class="hero is-light">
      <div class="hero-body">
        <div class="container">
          <h1 class="title">
            {{ $t('waiting_questions') }}
          </h1>
          <h2 class="subtitle">
            {{ $t('find_here_questions_by_other_users') }}.

            <span v-if="has_muted_questions" class="has-muted-questions nanum">
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
      <article v-if="ask_activate_notifications" class="message is-link ask-notifications">
        <div class="message-body">
          <span>{{ $t('receive_notifications_message') }}.</span>
          <a href="#!" @click.prevent="enablePushNotification()">
            <strong>{{ $t('click_here_to_activate') }}.</strong>
          </a>
        </div>
      </article>
      <article v-else-if="receive_notifications" class="message is-link ask-notifications">
        <div class="message-body">
          <span>{{ $t('accepted_notifications_message') }}.</span>
          <a href="#!" @click.prevent="disablePushNotification()">
            <strong>{{ $t('unregister') }}.</strong>
          </a>
        </div>
      </article>

      <div v-if="of_the_day">
        <div v-if="!has_already_replied_to_day_question" class="box" style="margin-top: 2rem;">
          <question-card-no-reply
            :question="of_the_day"
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
            <nuxt-link :to="of_the_day_link">{{ $t('here') }}</nuxt-link>.
          </p>
        </div>

        <div>
          <div class="divider">{{ $t('waiting_questions') }}</div>
        </div>
      </div>

      <div v-if="questions && questions.length" class="box" style="margin-top: 2rem">
        <question-card-no-reply
          v-for="item in (questions || [])"
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
    <bulma-modal :open="!!will_delete" :card="true" @close="cancelDelete()">
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
          :disabled="delete_loading"
          :class="{ 'button': true, 'is-danger': true, 'is-loading': delete_loading }"
          @click="deleteQuestion()"
        >{{ $t('delete') }}</button>
        <button class="button" @click="cancelDelete()">{{ $t('cancel') }}</button>
      </footer>
    </bulma-modal>
  </main>
</template>

<script lang="ts">
import { Component, Vue } from 'nuxt-property-decorator';
import QuestionCardNoReply from '~/components/QuestionCardNoReply/QuestionCardNoReply';
import { makeTitle, handleError, isAxiosError, convertAxiosError, cancelPushSubscription } from '~/utils/helpers';
import { StateChanger } from 'vue-infinite-loading';
import BulmaModal from '~/components/BulmaModal/BulmaModal';
import { ISentQuestion } from "~/utils/types/sent.entities.types";

interface AlreadyReplied {
  type: 'already_replied'
  id: number;
}

@Component({
  middleware: 'logged',
  components: {
    QuestionCardNoReply,
    BulmaModal: BulmaModal,
  },
  async asyncData({ app, store }) {
    try {
      const question_res = app.$axios.get('questions/waiting');
      let of_the_day_res: Promise<any> | undefined = undefined;

      const lang = app.i18n.locale;
      if (app.$accessor.loggedUser!.allowQuestionOfTheDay && (lang === 'fr' || lang === 'en')) {
        try {
          of_the_day_res = app.$axios.get('questions/of_day/' + lang, { params: { date: new Date().toISOString() } });
        } catch (e) {
          // tant pis: pas dispo pour la langue en cours, ou question du jour invalide
        }
      }

      const count_res = app.$axios.$get('questions/waiting/count') as Promise<{ count: number, muted: number }>;

      // Agrégation des requêtes
      await Promise.all([question_res, of_the_day_res || Promise.resolve(), count_res]);

      const questions = (await question_res).data as ISentQuestion[];

      const count = await count_res;

      let of_the_day: ISentQuestion | AlreadyReplied | null = null;
      if (of_the_day_res) {
        of_the_day = (await of_the_day_res).data;
      }

      return { questions, of_the_day, has_muted_questions: count.muted > 0 };
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
  questions: ISentQuestion[] | null = null;
  error?: any;
  of_the_day: ISentQuestion | AlreadyReplied | null = null;
  has_muted_questions!: boolean;

  questions_complete = false;
  ask_activate_notifications: false | ServiceWorkerRegistration = false;
  receive_notifications: PushSubscription | null = null;

  will_delete: boolean | number = false;
  delete_loading = false;

  head() {
    return {
      title: makeTitle(this.$t('waiting_questions').toString()),
    };
  }

  async loadQuestions($state: StateChanger) {
    if (!this.questions || !this.questions.length) {
      this.questions_complete = true;
      $state.complete();
      return;
    }

    try {
      const last_id = this.questions[this.questions.length - 1].id;
      // Get answers
      const new_questions = (await this.$axios.get('questions/waiting', { params: { until: last_id } })).data as ISentQuestion[];

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

  async enablePushNotification() {
    const registration = this.ask_activate_notifications;

    if (!registration) {
      return;
    }

    this.ask_activate_notifications = false;

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
      this.receive_notifications = subscription;

      this.$toast.success(this.$t('notifications_push_enabled'));
    } catch (e) {
      // Permission denied
    }
  }

  async disablePushNotification() {
    if (!this.receive_notifications)
      return;

    await this.unregisterSubscription(this.receive_notifications.toJSON());
    await cancelPushSubscription(this.receive_notifications);

    this.$toast.success(this.$t('notifications_push_disabled'));
    this.receive_notifications = null;

    try {
      const registration = await navigator.serviceWorker.ready;
      if (Notification.permission !== 'denied') {
        this.ask_activate_notifications = registration;
      }
    } catch (e) {
      return;
    }
  }

  get has_already_replied_to_day_question() {
    return this.of_the_day && 'type' in this.of_the_day;
  }

  get of_the_day_link() {
    if (this.of_the_day && 'type' in this.of_the_day) {
      return this.localePath('/u/' + this.$accessor.loggedUser!.slug + '/' + this.of_the_day.id);
    }
    return '/';
  }

  handleSubmitted(_: ISentQuestion, original: ISentQuestion) {
    this.questions = this.questions?.filter(e => e.id !== original.id) ?? null;
    this.$accessor.decrementAnswerWait();
  }

  willDelete(data?: ISentQuestion) {
    if (!data) {
      // question of the day
      this.will_delete = true;
    }
    else {
      this.will_delete = data.id;
    }
  }

  async deleteQuestion() {
    if (!this.will_delete || this.delete_loading) {
      return;
    }

    if (this.will_delete === true) {
      this.handleDayDelete();
      this.will_delete = false;
      return;
    }

    this.delete_loading = true;

    try {
      await this.$axios.delete('questions', {
        params: { question: this.will_delete },
      });

      this.$toast.show(this.$t('question_has_been_deleted'), { type: 'success' });
      this.handleDelete(this.will_delete);
      this.will_delete = false;
    } catch (e) {
      handleError(e, this);
    }

    this.delete_loading = false;
  }

  cancelDelete() {
    this.will_delete = false;
  }

  handleDelete(id: number) {
    this.questions = this.questions?.filter(e => e.id !== id) ?? null;
    this.$accessor.decrementAnswerWait();
  }

  handleDaySubmitted(data: ISentQuestion) {
    this.of_the_day = {
      id: data.id,
      type: 'already_replied'
    };
  }

  handleDayDelete() {
    this.of_the_day = null;
  }

  async registerSubscription(sub: PushSubscriptionJSON) {
    await this.$axios.post('push', sub);
  }

  async unregisterSubscription(sub: PushSubscriptionJSON) {
    await this.$axios.delete('push', { params: { endpoint: sub.endpoint } });
  }

  onWorkerMessage(evt: { data: { question: ISentQuestion, type: string } }) {
    if (evt.data.type === 'question-worker') {
      this.questions = [evt.data.question, ...(this.questions || [])];
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
      this.ask_activate_notifications = registration;
    }
    else if (subscription) {
      this.receive_notifications = subscription;
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
