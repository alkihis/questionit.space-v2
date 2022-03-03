<template>
  <div :class="{
    'card': true,
    'notification-card': true,
    'is-seen': notification.seen,
    'clickable': is_valid,
    'deleted': deleted
  }" @click="navigateToLink($event)">
    <div class="card-content">
      <div class="media notification-header">
        <div class="media-left">
          <nuxt-link v-if="profile_link" :to="profile_link" data-stopper>
            <figure class="image is-48x48">
              <img :src="profile_img" :alt="name">
            </figure>
          </nuxt-link>
           <figure v-else class="image is-48x48">
            <img :src="profile_img" :alt="name">
          </figure>
        </div>
        <div class="media-content">
          <p class="title nanum is-4">
            <nuxt-link v-if="profile_link" :to="profile_link" data-stopper>
              {{ name }}
            </nuxt-link>
            <span v-else>
              {{ name }}
            </span>
          </p>
          <p class="subtitle nanum is-6">
            <nuxt-link v-if="profile_link" :to="profile_link" data-stopper>
              @{{ slug }}
            </nuxt-link>
            <span v-else>
              @{{ slug }}
            </span>
          </p>

          <div
            class="icon has-text-danger is-medium has-tooltip-top"
            :data-tooltip="$t('delete')"
            @click="$emit('delete', notification)"
            data-stopper
          >
            <i class="fas fa-trash fa-lg"></i>
          </div>
        </div>
      </div>

      <div class="content">
        <p class="text-content">
          <span v-if="is_valid" class="content-wrapper">
            <span>
              {{ content }}.
            </span>

            <span v-if="can_follow_back" class="follow-back-container">
              <span href="#!" data-stopper @click.prevent.stop="followBack()" class="follow-back tag is-link">
                {{ $t('follow_back') }}
              </span>
            </span>
          </span>
          <span v-else>
            {{ $t('this_notification_refers_to_a_deleted_item') }}.
          </span>
        </p>
        <nuxt-link v-if="is_valid" :to="link" data-stopper="true">
          <time class="nanum" :datetime="notification.created_at" :title="full_date">{{ date }}</time>
        </nuxt-link>
        <time v-else class="nanum" :datetime="notification.created_at" :title="full_date">{{ date }}</time>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
  @import '~/assets/css/functions.scss';

  .notification-card {
    opacity: 1;
    transition: opacity .4s;

    &.deleted {
      opacity: 0;
    }
  }

  .card {
    background-color: var(--notification-card-color);

    &.is-seen {
      background-color: var(--notification-card-color-seen);
    }
  }

  .content-wrapper {
    display: flex;
    flex-direction: row;
    align-items: center;

    .follow-back {
      &-container {
        display: block;
        margin-left: 1rem;
      }

      cursor: pointer;
      transition: background-color .2s;

      &:hover {
        background-color: #48c774;
      }
    }

    @media screen and (max-width: 767px) {
      flex-direction: column;
      align-items: baseline;

      .follow-back-container {
        display: block;
        margin-top: .3rem;
        margin-bottom: 1rem;
        margin-left: 0;
      }
    }
  }

  .media-content {
    position: relative;
    overflow: hidden;

    .title {
      max-width: 85%;
    }

    .title > a, .subtitle > a {
      color: var(--notification-profile-link);

      &:hover {
        text-decoration: underline;
      }
    }

    .subtitle {
      margin-bottom: 0;
    }

    .icon {
      position: absolute;
      right: 0;
      top: 0;
    }
  }

  .clickable {
    cursor: pointer;
  }

  .card .card-content .content .time {
    font-size: 90%;
  }

  .notification-header.media {
    margin-bottom: .5rem;
  }

  .content .text-content {
    margin-top: 1rem;
    margin-bottom: .5rem;
    font-size: 1.05rem;
  }

  .media-left figure img {
    border-radius: 5px;
  }
</style>

<script lang="ts">
import { Component, Vue, Prop } from 'nuxt-property-decorator';
import { dateText, fullDateText, randomAnonymousImage, handleError } from '~/utils/helpers';
import { ISentNotification } from "~/utils/types/sent.entities.types";

@Component({
  components: {},
})
export default class extends Vue {
  @Prop({ required: true })
  notification!: ISentNotification;

  @Prop({ default: false })
  deleted!: boolean;

  get date() {
    return dateText(new Date(this.notification.createdAt), this);
  }

  get full_date() {
    return fullDateText(new Date(this.notification.createdAt), this, false, true);
  }

  get name() {
    if (this.notification.question) {
      switch (this.notification.type) {
        // Question répondue: On affiche le nom du receveur
        case 'answered':
          return this.notification.question!.receiver.name;
        // Nouvelle question: On affiche le nom de l'émetteur
        case 'question':
          return this.notification.question!.owner?.name ?? this.$t('anonymous').toString();
      }
    }
    if (this.notification.user) {
      return this.notification.user.name;
    }
    return this.$t('unknown');
  }

  get slug() {
    if (this.notification.question) {
      switch (this.notification.type) {
        // Question répondue: On affiche le nom du receveur
        case 'answered':
          return this.notification.question.receiver.slug;
        // Nouvelle question: On affiche le nom de l'émetteur
        case 'question':
          return this.notification.question.owner?.slug ?? this.$t('anonymous').toString();
      }
    }
    if (this.notification.user) {
      return this.notification.user.slug;
    }
    return this.$t('unknown');
  }

  get link() {
    if (this.notification.question) {
      switch (this.notification.type) {
        // Question répondue: Lien vers la question
        case 'answered':
          return this.localePath('/u/' + this.notification.question.receiver.slug + '/' + this.notification.question.id);
        // Nouvelle question: Lien vers waiting
        case 'question':
          return this.localePath('/waiting');
      }
    }
    if (this.notification.user) {
      return this.localePath('/u/' + this.notification.user.slug);
    }
    return '#!';
  }

  get can_follow_back() {
    return this.notification.type === 'follow' && this.notification.user?.relationship?.following === false;
  }

  get has_followed_back() {
    return this.notification.user?.relationship?.following;
  }

  get profile_link() {
    if (this.notification.question) {
      switch (this.notification.type) {
        // Question répondue: Lien vers le profil du receveur
        case 'answered':
          return this.localePath('/u/' + this.notification.question.receiver.slug);
        // Nouvelle question: Lien vers le profil du
        case 'question': {
          if (!this.notification.question.owner) {
            return '';
          }
          return this.localePath('/u/' + this.notification.question.owner.slug);
        }
      }
    }
    if (this.notification.user) {
      return this.localePath('/u/' + this.notification.user.slug);
    }
    return '';
  }

  get is_valid() {
    return !!this.notification.question || !!this.notification.user;
  }

  get safe_profile_img() {
    if (this.notification.question) {
      switch (this.notification.type) {
        // Question répondue: Image du receveur
        case 'answered':
          return this.notification.question.receiver.profilePictureUrl;
        // Nouvelle question: Image du sender
        case 'question':
          return this.notification.question.owner?.profilePictureUrl;
      }
    }
    if (this.notification.user) {
      return this.notification.user.profilePictureUrl;
    }
  }

  get profile_img() {
    return this.safe_profile_img ?? randomAnonymousImage(this.notification.question?.id ?? 1);
  }

  get content() {
    switch (this.notification.type) {
      // Question répondue: On affiche le contenu de la quest
      case 'answered':
        return this.$t('someone_has_replied_to_your_question', { name: this.name });
      case 'question':
        return this.$t('someone_ask_you_a_question', { name: this.name });
      case 'follow':
        return this.$t('someone_followed_you', { name: this.name });
      case 'follow-back':
        return this.$t('someone_followed_you_back', { name: this.name });
    }
  }

  navigateToLink(e: MouseEvent) {
    if (this.is_valid) {
      // Check if tree does not contains data-stopper="true"
      let can_go = true;
      let current: HTMLElement | null = e.target as HTMLElement;

      while (current) {
        if ('hasAttribute' in current && current.hasAttribute('data-stopper')) {
          can_go = false;
          break;
        }

        current = current.parentElement;
      }

      if (can_go)
        this.$router.push(this.link);
    }
  }

  async followBack() {
    if (this.has_followed_back || this.notification.type !== 'follow' || !this.notification.user)
      return;

    this.notification.user.relationship!.following = true;

    try {
      await this.$axios.post('relationship/' + this.notification.user.id);
      this.$toast.success(this.$t('followed_user', { name: this.notification.user.name }));
    } catch (e) {
      handleError(e, this);
      this.notification.user.relationship!.following = false;
    }
  }
}
</script>
