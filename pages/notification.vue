<template>
  <main>
    <section class="hero is-light">
      <div class="hero-body">
        <div class="container">
          <h1 class="title">
            {{ $t('notifications') }}
          </h1>
          <h2 class="subtitle">
            {{ $t('notifications_description') }}.
          </h2>
        </div>
      </div>
    </section>

    <fluid-container class="root">
      <div class="text-intro" v-if="firstLoadComplete && timeline.items.length">
        <span class="remove-all tag is-dark" @click="deleteAll()">
          {{ $t('remove_all') }}
        </span>
      </div>

      <div class="notifications" v-if="timeline.items.length || (timeline.items.length === 0 && completed)">
        <notification-card
          v-for="item in timeline.items"
          :notification="item"
          :key="item.id"
          :deleted="deleted.includes(item.id)"
          @delete="deleteNotification($event)"
        />

        <div v-if="timeline.items.length === 0 && completed" class="no-notifications">
          <p class="nanum">
            {{ $t('no_notifications_to_show') }}.
          </p>
        </div>
      </div>

      <client-only>
        <infinite-loading @infinite="loadItems" />
      </client-only>
    </fluid-container>
  </main>
</template>

<script lang="ts">
import { Component, Vue } from "nuxt-property-decorator";
import { handleError, makeTitle } from "~/utils/helpers";
import NotificationCard from "~/components/NotificationCard.vue";
import { StateChanger } from "vue-infinite-loading";
import { ENotificationType, IPaginatedWithIdsResult, ISentNotification, ISentQuestion, ISentUser } from '~/utils/types/sent.entities.types';

interface SwPayload {
  user?: ISentUser;
  question?: ISentQuestion;
  type: 'follow-worker' | 'answered-worker' | 'question-worker';
  id?: string;
  follow_back?: boolean;
}

const FETCH_SIZE = 10;

/* Notifications page */
@Component({
  components: {
    NotificationCard: NotificationCard,
  },
  middleware: 'logged',
  layout: 'default_solid',
  scrollToTop: true,
})
export default class extends Vue {
  timeline: IPaginatedWithIdsResult<ISentNotification> = { items: [] };
  deleted: number[] = [];
  completed = false;
  firstLoadComplete = false;

  get unreadCount() {
    return this.$accessor.waitingNotificationsCount + this.timeline.items.filter(e => !e.seen).length;
  }

  async loadItems($state: StateChanger) {
    if (this.completed) {
      $state.complete();
      return;
    }

    try {
      const notifs = (await this.$axios.get('notification', {
        params: { pageSize: FETCH_SIZE, untilId: this.timeline.items[this.timeline.items.length - 1]?.id }
      })).data as IPaginatedWithIdsResult<ISentNotification>;

      if (this.timeline.items.length === 0 && notifs.items.length === 0) {
        this.$accessor.setNotificationWait(0);
      }

      this.timeline.items = [...this.timeline.items, ...notifs.items];

      const numberOfUnseen = notifs.items.filter(e => !e.seen).length;
      const notificationCount = this.$accessor.waitingNotificationsCount;

      if (notificationCount - numberOfUnseen >= 0) {
        this.$accessor.setNotificationWait(notificationCount - numberOfUnseen);
      }
      else {
        this.$accessor.setNotificationWait(0);
      }

      this.firstLoadComplete = true;
      if (notifs.items.length < FETCH_SIZE) {
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

  head() {
    return {
      title: makeTitle(this.$t('notifications').toString()),
    };
  }

  async deleteAll() {
    this.deleted.push(...this.timeline.items.map(e => e.id));
    let previous = this.$accessor.waitingNotificationsCount;

    setTimeout(() => {
      if (previous !== -1) {
        this.$accessor.setNotificationWait(0);
        this.completed = true;
        this.timeline.items = [];
      }
    }, 350);

    try {
      await this.$axios.delete('notification/all');
      this.$toast.success(this.$t('notifications_deleted'));
    } catch (e) {
      this.$accessor.setNotificationWait(previous);
      previous = -1;
      handleError(e, this);
    }
  }

  async deleteNotification(item: ISentNotification) {
    this.deleted.push(item.id);

    setTimeout(() => {
      const tl_index = this.timeline.items.findIndex(e => e.id === item.id);

      if (tl_index !== -1) {
        if (!this.timeline.items[tl_index].seen) {
          this.$accessor.decrementNotificationWait();
        }
        this.timeline.items = this.timeline.items.filter(e => e.id !== item.id);
      }

      const to_dl = this.deleted.indexOf(item.id);

      this.deleted.splice(to_dl, 1);
    }, 350);

    try {
      await this.$axios.delete('notification/' + item.id);
    } catch (e) {
      handleError(e, this);
    }
  }

  onWorkerMessage(evt: { data: SwPayload }) {
    // question-worker
    // answered-worker
    // follow-worker
    if (!evt.data?.id)
      return;

    if (evt.data.type === 'question-worker') {
      this.timeline.items = [{
        id: Number(evt.data.id),
        createdAt: new Date().toISOString(),
        seen: false,
        type: ENotificationType.Question,
        question: evt.data.question
      }, ...this.timeline.items];
    }
    else if (evt.data.type === 'answered-worker') {
      this.timeline.items = [{
        id: Number(evt.data.id),
        createdAt: new Date().toISOString(),
        seen: false,
        type: ENotificationType.Answered,
        question: evt.data.question
      }, ...this.timeline.items];
    }
    else if (evt.data.type === 'follow-worker') {
      this.timeline.items = [{
        id: Number(evt.data.id),
        createdAt: new Date().toISOString(),
        seen: false,
        type: evt.data.follow_back ? ENotificationType.FollowBack : ENotificationType.Follow,
        user: evt.data.user,
      }, ...this.timeline.items];
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
  }

  beforeDestroy() {
    navigator.serviceWorker?.removeEventListener('message', this.onWorkerMessage);
  }
}
</script>

<style lang="scss" scoped>
.root {
  margin-bottom: 3rem;
}
.no-notifications {
  margin-top: 3rem;
  text-align: center;
  font-size: 1.2rem;
}
.loader-wrapper {
  margin-top: 3rem;
}
.root .notifications {
  margin-top: 1rem;
}

.remove-all {
  cursor: pointer;
  transition: background-color .2s;

  &:hover {
    background-color: #f14668;
  }
}

.text-intro {
  margin-top: 1.5rem;
  margin-bottom: 2rem;
  font-size: 1.2rem;
  display: flex;
  justify-content: flex-end;
  font-weight: bold;
}
</style>
