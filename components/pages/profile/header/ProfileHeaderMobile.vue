<template>
  <section class="profile-edit-button" style="margin-bottom: 1rem">
    <!-- Edition -->
    <div v-if="edit" style="margin: 0 1rem 1rem 1rem;">
      <!-- Name field -->
      <div class="field">
        <label class="label">{{ $t('full_name') }}</label>
        <div :class="{ control: true, 'is-loading': $accessor.profile.editionLoad }">
          <input :disabled="$accessor.profile.editionLoad" :class="{ input: true, 'is-danger': username.length > 32 }" type="text" placeholder="Name" v-model="username">
        </div>
      </div>

      <!-- Slug field -->
      <div class="field">
        <label class="label">{{ $t('user_name') }}</label>

        <div :class="{
          control: true,
          'is-loading': $accessor.profile.slugLoadTimeout,
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
          <span v-else-if="invalidSlug && !$accessor.profile.slugLoadTimeout" class="icon is-small is-right">
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

      <!-- Ask me field -->
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

      <!-- Allow anon field -->
      <div class="field">
        <input
          type="checkbox"
          class="is-checkradio is-circle is-info"
          id="anon-mobile"
          value="anonymous"
          v-model="allowAnonymousQuestions"
          :disabled="$accessor.profile.editionLoad"
        >
        <label class="checkbox" for="anon-mobile">
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
    <div v-if="!edit && $accessor.isLogged" class="mobile-no-edit-buttons">
      <div v-if="relationship.following || relationship.followedBy" class="tags mobile-followings">
        <span v-if="relationship.following && relationship.followedBy" class="tag is-link">{{ $t('mutual_following') }}</span>
        <span v-else-if="relationship.following" class="tag is-link">{{ $t('single_following') }}</span>
        <span v-else-if="relationship.followedBy" class="tag is-link">{{ $t('is_followed_by') }}</span>
      </div>

      <div v-if="!$accessor.profile.isSelf">
        <button v-if="!relationship.hasBlocked" class="button" @click="$emit('block')">
          <span class="icon is-small">
            <i class="fas fa-user-slash has-text-danger"></i>
          </span>
          <span>
            {{ $t('block') }}
          </span>
        </button>
        <button v-else class="button" @click="$emit('block')">
          <span class="icon is-small">
            <i class="fas fa-user-shield has-text-danger"></i>
          </span>
          <span>
            {{ $t('unblock') }}
          </span>
        </button>

        <div v-if="!relationship.isBlockedBy" class="follow-btns-mobile">
          <button v-if="!relationship.following && !relationship.hasBlocked" class="button" @click="$emit('follow')">
            <span class="icon is-small">
              <i class="fas fa-user-plus has-text-info"></i>
            </span>
            <span>
              {{ $t('follow') }}
            </span>
          </button>
          <button v-else-if="!relationship.hasBlocked" class="button" @click="$emit('unfollow')">
            <span class="icon is-small">
              <i class="fas fa-user-minus has-text-info"></i>
            </span>
            <span>
              {{ $t('unfollow') }}
            </span>
          </button>
        </div>
      </div>
      <!-- Edition button -->
      <div v-else>
        <button class="button" @click="$emit('start-edition')">
          <span class="icon is-small">
            <i class="fas fa-edit"></i>
          </span>
          <span>
            {{ $t('edit_profile') }}
          </span>
        </button>

        <nuxt-link :to="localePath('/settings')">
          <button class="button" style="margin-top: .5rem">
            <span class="icon is-small">
              <i class="fas fa-cog"></i>
            </span>
            <span>
              {{ $t('account_settings') }}
            </span>
          </button>
        </nuxt-link>
      </div>
    </div>

    <div v-if="edit">
      <button
        :class="{ 'button': true, 'is-loading': $accessor.profile.editionLoad }"
        :disabled="invalidSlug || $accessor.profile.editionLoad"
        @click="$emit('end-edition')"
        style="margin-bottom: .5rem"
      >
        <span v-if="!$accessor.profile.editionLoad" class="icon is-small has-text-success">
          <i class="fas fa-check"></i>
        </span>
        <span>
          {{ $t('save') }}
        </span>
      </button>

      <button class="button" :disabled="$accessor.profile.editionLoad" @click="$emit('cancel-edition')">
        <span class="icon is-small has-text-danger">
          <i class="fas fa-ban"></i>
        </span>
        <span>
          {{ $t('cancel') }}
        </span>
      </button>
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
    return this.user.relationship!;
  }

  get invalidSlug() {
    return this.$accessor.profile.slugEditionStatus === 'taken' || this.$accessor.profile.slugEditionStatus === 'invalid';
  }
}
</script>

<style lang="scss" scoped>
.mobile-followings {
  padding-left: 1em;
  padding-right: 1em;
  margin-top: .5rem;

  & > * {
    font-size: .8rem;
    width: 100%;
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

@media screen and (max-width: 768px) {
  .mobile-no-edit-buttons {
    margin-bottom: 2.5rem;
  }
}

.follow-btns-mobile {
  margin-top: .5rem;
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

.profile-edit-button {
  display: none;

  @media screen and (max-width: 1023px) {
    display: block;
  }

  button {
    display: block;
    width: 90%;
    margin: auto;
  }
}
</style>
