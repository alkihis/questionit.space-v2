<template>
  <section class="profile-edit-button" style="margin-bottom: 1rem">
    <!-- Edition -->
    <div v-if="edit" style="margin: 0 1rem 1rem 1rem;">
      <!-- Name field -->
      <div class="field">
        <label class="label">{{ $t('full_name') }}</label>
        <div :class="{ control: true, 'is-loading': edit_load }">
          <input :disabled="edit_load" :class="{ input: true, 'is-danger': username.length > 32 }" type="text" placeholder="Name" v-model="username">
        </div>
      </div>

      <!-- Slug field -->
      <div class="field">
        <label class="label">{{ $t('user_name') }}</label>

        <div :class="{
          control: true,
          'is-loading': is_slug_loading,
          'has-icons-right': slug_available !== null && !is_slug_loading
        }">
          <input
            :disabled="edit_load"
            :class="{
              input: true,
              'is-danger': slug.length > 20 || slug_invalid,
              'is-success': slug_available === 'available' && slug.length <= 20
            }"
            type="text"
            v-model="slug"
          >
          <span v-if="slug_available === 'available' && !is_slug_loading" class="icon is-small is-right">
            <i class="fas fa-check"></i>
          </span>
          <span v-else-if="slug_invalid && !is_slug_loading" class="icon is-small is-right">
            <i class="fas fa-ban"></i>
          </span>
        </div>

        <p v-if="slug_available === 'available'" class="help is-success">
          {{ $t('username_available') }}.
        </p>
        <p v-else-if="slug_available === false" class="help is-danger">
          {{ $t('username_not_available') }}.
        </p>
        <p v-else-if="slug_available === 'invalid'" class="help is-danger">
          {{ $t('invalid_username') }}.
        </p>
      </div>

      <!-- Ask me field -->
      <div class="field">
        <label class="label">{{ $t('ask_me_message') }}</label>
        <div :class="{ control: true, 'is-loading': edit_load }">
          <input
            :disabled="edit_load"
            :class="{ input: true, 'is-danger': ask_me_message.length > 60 }"
            type="text"
            v-model="ask_me_message"
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
          v-model="allow_anonymous"
          :disabled="edit_load"
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

        <span class="clickable with-underline" @click="willRefreshProfile">
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

      <div v-if="!is_self">
        <button v-if="!relationship.hasBlocked" class="button" @click="willblockUnblock()">
          <span class="icon is-small">
            <i class="fas fa-user-slash has-text-danger"></i>
          </span>
          <span>
            {{ $t('block') }}
          </span>
        </button>
        <button v-else class="button" @click="willblockUnblock()">
          <span class="icon is-small">
            <i class="fas fa-user-shield has-text-danger"></i>
          </span>
          <span>
            {{ $t('unblock') }}
          </span>
        </button>

        <div v-if="!relationship.isBlockedBy" class="follow-btns-mobile">
          <button v-if="!relationship.following && !relationship.hasBlocked" class="button" @click="follow()">
            <span class="icon is-small">
              <i class="fas fa-user-plus has-text-info"></i>
            </span>
            <span>
              {{ $t('follow') }}
            </span>
          </button>
          <button v-else-if="!relationship.hasBlocked" class="button" @click="unfollow()">
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
        <button class="button" @click="startEdition()">
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
        :class="{ 'button': true, 'is-loading': edit_load }"
        :disabled="slug_invalid || edit_load"
        @click="endEdition()"
        style="margin-bottom: .5rem"
      >
        <span v-if="!edit_load" class="icon is-small has-text-success">
          <i class="fas fa-check"></i>
        </span>
        <span>
          {{ $t('save') }}
        </span>
      </button>

      <button class="button" :disabled="edit_load" @click="cancelEdition()">
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

}
</script>

<style lang="scss" scoped>

</style>
