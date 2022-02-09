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

<script lang="ts" src="./NotificationCard.ts"></script>
