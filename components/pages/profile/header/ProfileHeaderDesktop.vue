<template>
  <section class="hero">
    <div :class="{ 'hero-body': true, 'desktop-body': true, edit: edit }">
      <fluid-container>
        <!-- Name -->
        <div v-if="!edit">
          <p class="title nanum">
            {{ user.name }}
          </p>
          <p class="subtitle nanum">
            @{{ user.slug }}
            <a :href="$accessor.profile.twitterLink" rel="noopener noreferrer" target="_blank" class="icon twitter-icon has-text-info">
              <i class="fab fa-twitter-square"></i>
            </a>
          </p>
        </div>
        <!-- Edition fields -->
        <div v-else style="width: 80%">
          <!-- Name field -->
          <div class="field">
            <label class="label">{{ $t('full_name') }}</label>
            <div :class="{ control: true, 'is-loading': $accessor.profile.editionLoad }">
              <input :disabled="$accessor.profile.editionLoad" :class="{ input: true, 'is-danger': username.length > 32 }" type="text" v-model="username">
            </div>
          </div>

          <!-- Slug field -->
          <div class="field">
            <label class="label">{{ $t('user_name') }}</label>

            <div :class="{
              control: true,
              'is-loading': !!$accessor.profile.slugLoadTimeout,
              'has-icons-right': $accessor.profile.slugEditionStatus !== null && !$accessor.profile.slugLoadTimeout
            }">
              <input
                :disabled="$accessor.profile.editionLoad"
                :class="{
                  input: true,
                  'is-danger': slug.length > 20 || invalidSlug,
                  'is-success': $accessor.profile.slugEditionStatus === 'available' && slug.length <= 20
                }"
                type="text"
                v-model="slug"
              >
              <span v-if="$accessor.profile.slugEditionStatus === 'available' && !$accessor.profile.slugLoadTimeout" class="icon is-small is-right">
                <i class="fas fa-check"></i>
              </span>
              <span v-else-if="this.$accessor.profile.slugEditionStatus === 'invalid' && !$accessor.profile.slugLoadTimeout" class="icon is-small is-right">
                <i class="fas fa-ban"></i>
              </span>
            </div>

            <p v-if="$accessor.profile.slugEditionStatus === 'available'" class="help is-success">
              {{ $t('username_available') }}.
            </p>
            <p v-else-if="$accessor.profile.slugEditionStatus === 'taken' && !$accessor.profile.slugLoadTimeout" class="help is-danger">
              {{ $t('username_not_available') }}.
            </p>
            <p v-else-if="$accessor.profile.slugEditionStatus === 'invalid'" class="help is-danger">
              {{ $t('invalid_username') }}.
            </p>
          </div>

          <!-- Ask me message field -->
          <div class="field">
            <label class="label">{{ $t('ask_me_message') }}</label>
            <div :class="{ control: true, 'is-loading': $accessor.profile.editionLoad }">
              <input
                :disabled="$accessor.profile.editionLoad"
                :class="{ input: true, 'is-danger': profileAskMeMessage.length > 60 }"
                type="text"
                v-model="profileAskMeMessage"
              />
            </div>
          </div>

          <!-- Allow anonymous field -->
          <div class="field">
            <input
              type="checkbox"
              class="is-checkradio is-circle is-info"
              value="anonymous"
              id="canon"
              v-model="allowAnonymousQuestions"
              :disabled="$accessor.profile.editionLoad"
            >
            <label class="checkbox" for="canon">
              {{ $t('allow_anonymous') }}
            </label>
          </div>

          <!-- Resync with Twitter -->
          <div class="field sync-with-twitter has-text-link">
            <span class="icon twitter-icon">
              <i class="fas fa-sync-alt"></i>
            </span>

            <span class="clickable with-underline" @click="$emit('refresh-profile')">
              {{ $t('resync_pp_twitter') }}
            </span>
          </div>
        </div>

        <!-- Relationships: Block/Unblocks/Follow btn -->
        <div v-if="!$accessor.profile.isSelf && $accessor.isLogged" class="flex-end">
          <div style="text-align: right;">
            <button v-if="!relationship.hasBlocked" class="button has-tooltip has-tooltip-top" :data-tooltip="$t('block')" @click="$emit('block')">
              <span class="icon is-small">
                <i class="fas fa-user-slash has-text-danger"></i>
              </span>
            </button>
            <button v-else class="button has-tooltip has-tooltip-top" :data-tooltip="$t('unblock')" @click="$emit('block')">
              <span class="icon is-small">
                <i class="fas fa-user-shield has-text-danger"></i>
              </span>
            </button>
            <span v-if="!relationship.isBlockedBy">
              <button v-if="!relationship.following && !relationship.hasBlocked" class="button has-tooltip has-tooltip-top" :data-tooltip="$t('follow')" @click="$emit('follow')">
                <span class="icon is-small">
                  <i class="fas fa-user-plus has-text-info"></i>
                </span>
              </button>
              <button v-else-if="!relationship.hasBlocked" class="button has-tooltip has-tooltip-top" :data-tooltip="$t('unfollow')" @click="$emit('unfollow')">
                <span class="icon is-small">
                  <i class="fas fa-user-minus has-text-info"></i>
                </span>
              </button>
            </span>
          </div>

          <div class="tags followings">
            <span v-if="relationship.following && relationship.followedBy" class="tag is-link">{{ $t('mutual_following') }}</span>
            <span v-else-if="relationship.following" class="tag is-link">{{ $t('single_following') }}</span>
            <span v-else-if="relationship.followedBy" class="tag is-link">{{ $t('is_followed_by') }}</span>
            <div v-else></div>
          </div>
        </div>

        <!-- Edit btn -->
        <div v-if="$accessor.profile.isSelf && !edit">
          <button class="button" :data-tooltip="$t('edit')" @click="$emit('start-edition')">
            <span class="icon is-small">
              <i class="fas fa-edit"></i>
            </span>
          </button>

          <nuxt-link :to="localePath('/settings')" :data-tooltip="$t('account_settings')">
            <button class="button">
              <span class="icon is-small">
                <i class="fas fa-cog"></i>
              </span>
            </button>
          </nuxt-link>
        </div>

        <!-- End edit btns -->
        <div v-if="edit">
          <button
            :class="{ 'button': true, 'is-loading': $accessor.profile.editionLoad }"
            :disabled="invalidSlug || $accessor.profile.editionLoad"
            @click="$emit('end-edition')"
          >
            <span v-if="!$accessor.profile.editionLoad" class="icon is-small has-text-success">
              <i class="fas fa-check"></i>
            </span>
          </button>

          <button class="button" :disabled="$accessor.profile.editionLoad" @click="$emit('cancel-edition')">
            <span class="icon is-small has-text-danger">
              <i class="fas fa-ban"></i>
            </span>
          </button>
        </div>
      </fluid-container>
    </div>
  </section>
</template>

<script lang="ts">
import { Component, Vue } from 'nuxt-property-decorator';

@Component({
  components: {},
})
export default class extends Vue {
  get user() {
    return this.$accessor.profile.user!;
  }

  get edit() {
    return this.$accessor.profile.editUser !== null;
  }

  get username() {
    return this.$accessor.profile.editUser!.name;
  }

  set username(name: string) {
    this.$accessor.profile.changeEditUserProperty({ name });
  }

  get allowAnonymousQuestions() {
    return this.$accessor.profile.editUser!.allowAnonymousQuestions;
  }

  set allowAnonymousQuestions(allowAnonymousQuestions: boolean) {
    this.$accessor.profile.changeEditUserProperty({ allowAnonymousQuestions });
  }

  get slug() {
    return this.$accessor.profile.editUser!.slug;
  }

  set slug(slug: string) {
    this.$accessor.profile.setEditionSlug(slug);
  }

  get profileAskMeMessage() {
    return this.$accessor.profile.editUser!.profileAskMeMessage;
  }

  set profileAskMeMessage(profileAskMeMessage: string) {
    this.$accessor.profile.changeEditUserProperty({ profileAskMeMessage });
  }

  get relationship() {
    return this.$accessor.profile.relationship!;
  }

  get invalidSlug() {
    return this.$accessor.profile.slugEditionStatus === 'taken' || this.$accessor.profile.slugEditionStatus === 'invalid';
  }
}
</script>

<style lang="scss" scoped>
.flex-end {
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
}

.followings {
  justify-content: flex-end;
  margin-top: .5rem;

  & > * {
    font-size: .8rem;
  }

  & > div {
    height: calc(2em + 0.5rem);
  }
}

.clickable {
  cursor: pointer;

  &.with-underline:hover {
    text-decoration: underline;
  }

  &:hover > p, &.activated > p {
    color: var(--user-clickable-hover);
  }
}

.desktop-body.edit {
  padding-bottom: 1rem;
}

section.hero {
  padding-top: 3rem;

  .container {
    display: grid;
    grid-template-columns: auto max-content;
  }

  @media screen and (max-width: 1023px) {
    display: none;
  }
}
</style>
