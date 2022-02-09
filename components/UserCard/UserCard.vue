<template>
  <article class="media">
    <section class="media-left">
      <nuxt-link :to="profile_link">
        <figure class="image is-64x64">
          <img :src="profile_picture" :alt="username" draggable="false">
        </figure>
      </nuxt-link>
    </section>

    <section class="media-content">
      <div class="content">
        <div :class="{ 'is-relationship': !!relationship }"> 
          <nuxt-link :to="profile_link" class="username is-info">
            {{ username }}
          </nuxt-link>

          <div v-if="relationship">
            <div v-if="follow_running" class="follow-tag">
              <span class="tag is-info is-light">
                ...
              </span>
            </div>
            <div v-else-if="relationship.following" class="follow-tag">
              <span class="tag is-info non-hover">
                {{ $t('single_following') }}
              </span>
              <span class="tag is-danger on-hover" @click="unfollow">
                {{ $t('unfollow') }}
              </span>
            </div>
            <div v-else class="follow-tag">
              <span class="tag is-link is-light non-hover" @click="follow">
                {{ $t('follow') }}
              </span>
              <span class="tag is-link on-hover" @click="follow">
                {{ $t('follow') }}
              </span>
            </div>
          </div>
        </div>
        <div class="slug">
          <nuxt-link :to="profile_link">
            @{{ slug }}
            <span class="itsyou">{{ its_you_text }}</span>
          </nuxt-link>
          <span v-if="relationship && relationship.followed_by" class="tag is-light">{{ $t('is_followed_by') }}</span> 
        </div>
        
        <p>
          <strong class="follow-count">{{ followings_number }} {{ followings_text }}</strong>,
          <strong class="follow-count">{{ followers_number }} {{ followers_text }}</strong>
        </p>
      </div>
    </section>


  </article>
</template>

<style lang="scss" scoped>
  @import '~/assets/css/functions.scss';

  article {
    section.media-left {
      img {
        border-radius: 25%;
        box-shadow: 0 0.5em 1em -0.125em rgba(10, 10, 10, .1), 0 0 0 1px rgba(10, 10, 10, .02);
      }
    }
  
    .is-relationship {
      display: grid;
      grid-template-columns: 1fr max-content;
  
      .follow-tag {
        &:hover .non-hover {
          display: none;
        }
        .on-hover {
          display: none;
        }
        &:hover .on-hover {
          display: inline-flex;
        }
      }
    }
  
    .itsyou {
      font-weight: normal;
      font-size: 85%;
    }
  
    .follow-count {
      font-size: 90%;
    }
  
    .username {
      &:hover {
        text-decoration: underline;
      }
    }
  
    .username {
      font-size: 1.2rem;
      font-weight: 500;
    }
  
    .slug > a {
      color: var(--user-slug-color);
      font-weight: bold;
      vertical-align: middle;
      margin-right: .2rem;
  
      &-underline:hover {
        text-decoration: underline;
      }
    }
  
    .follow-tag {
      cursor: pointer;
    }
  }
</style>

<script lang="ts" src="./UserCard.ts"></script>
