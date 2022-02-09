<template>
  <article class="media">
    <section class="media-left">
      <nuxt-link :to="profileLink">
        <figure class="image is-64x64">
          <img :src="profilePicture" :alt="username" draggable="false">
        </figure>
      </nuxt-link>
    </section>

    <section class="media-content">
      <div class="content">
        <div :class="{ 'is-relationship': !!relationship }">
          <nuxt-link :to="profileLink" class="username is-info">
            {{ username }}
          </nuxt-link>

          <div v-if="relationship && !isItYou">
            <div v-if="followRunning" class="follow-tag">
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
          <nuxt-link :to="profileLink">
            @{{ slug }}
            <span class="itsyou">{{ itsYouText }}</span>
          </nuxt-link>
          <span v-if="relationship && relationship.followedBy" class="tag is-light">{{ $t('is_followed_by') }}</span>
        </div>

        <p>
          <strong class="follow-count">{{ followingsNumber }} {{ followingsText }}</strong>,
          <strong class="follow-count">{{ followersNumber }} {{ followersText }}</strong>
        </p>
      </div>
    </section>
  </article>
</template>

<script lang="ts">
import { Vue, Component, Prop } from 'nuxt-property-decorator';
import { fullDateText, numberFormat, handleError } from '~/utils/helpers';
import { ISentUser } from "~/utils/types/sent.entities.types";

@Component({
  components: {}
})
export default class extends Vue {
  @Prop({ required: true })
  user!: ISentUser;

  followRunning = false;

  get profileLink() {
    return this.localePath('/u/' + this.user.slug);
  }

  get username() {
    return this.user.name;
  }

  get slug() {
    return this.user.slug;
  }

  get relationship() {
    return this.user.relationship ?? null;
  }

  get followersText() {
    return this.$t('followers_s', { s: (this.user.counts?.followers ?? 0) > 1 ? 's' : '' });
  }

  get followersNumber() {
    const n = this.user.counts?.followers ?? 0;

    if (n) {
      return numberFormat(n);
    }
    return this.$t('none').toString().toLowerCase();
  }

  get followingsNumber() {
    const n = this.user.counts?.followings ?? 0;

    if (n) {
      return numberFormat(n);
    }
    return this.$t('none');
  }

  get followingsText() {
    return this.$t('followings_s', { s: (this.user.counts?.followings ?? 0) > 1 ? 's' : '' });
  }

  get profilePicture() {
    return this.user.profilePictureUrl;
  }

  get itsYouText() {
    if (this.isItYou) {
      return '(' + this.$t('its_you') + ')';
    }
    return '';
  }

  get isItYou() {
    return this.$accessor.isLogged && this.$accessor.loggedUser!.id === this.user.id;
  }

  get createdAt() {
    return fullDateText(new Date(this.user.createdAt), this);
  }

  async follow() {
    if (this.followRunning)
      return;

    this.followRunning = true;
    try {
      await this.$axios.post('relationship/' + this.user.id);

      this.$toast.success(this.$t('followed_user', { name: this.user.name }));
      this.$emit('follow', this.user);

      if (this.user.relationship)
        this.user.relationship.following = true;
    } catch (e) {
      handleError(e, this);
    }
    this.followRunning = false;
  }

  async unfollow() {
    if (this.followRunning)
      return;

    this.followRunning = true;
    try {
      await this.$axios.delete('relationship/' + this.user.id);

      this.$toast.success(this.$t('unfollowed_user', { name: this.user.name }));
      this.$emit('unfollow', this.user);

      if (this.user.relationship)
        this.user.relationship.following = false;
    } catch (e) {
      handleError(e, this);
    }
    this.followRunning = false;
  }
}
</script>

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
