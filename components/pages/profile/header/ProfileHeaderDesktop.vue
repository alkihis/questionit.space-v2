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
            <a :href="twitter_link" rel="noopener noreferrer" target="_blank" class="icon twitter-icon has-text-info">
              <i class="fab fa-twitter-square"></i>
            </a>
          </p>
        </div>
        <!-- Edition fields -->
        <div v-else style="width: 80%">
          <!-- Name field -->
          <div class="field">
            <label class="label">{{ $t('full_name') }}</label>
            <div :class="{ control: true, 'is-loading': edit_load }">
              <input :disabled="edit_load" :class="{ input: true, 'is-danger': username.length > 32 }" type="text" v-model="username">
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

          <!-- Ask me message field -->
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

          <!-- Allow anonymous field -->
          <div class="field">
            <input
              type="checkbox"
              class="is-checkradio is-circle is-info"
              value="anonymous"
              id="canon"
              v-model="allow_anonymous"
              :disabled="edit_load"
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

            <span class="clickable with-underline" @click="willRefreshProfile">
              {{ $t('resync_pp_twitter') }}
            </span>
          </div>
        </div>

        <!-- Relationships: Block/Unblocks/Follow btn -->
        <div v-if="!is_self && $accessor.isLogged" class="flex-end">
          <div style="text-align: right;">
            <button v-if="!relationship.hasBlocked" class="button has-tooltip has-tooltip-top" :data-tooltip="$t('block')" @click="willblockUnblock()">
              <span class="icon is-small">
                <i class="fas fa-user-slash has-text-danger"></i>
              </span>
            </button>
            <button v-else class="button has-tooltip has-tooltip-top" :data-tooltip="$t('unblock')" @click="willblockUnblock()">
              <span class="icon is-small">
                <i class="fas fa-user-shield has-text-danger"></i>
              </span>
            </button>
            <span v-if="!relationship.isBlockedBy">
              <button v-if="!relationship.following && !relationship.hasBlocked" class="button has-tooltip has-tooltip-top" :data-tooltip="$t('follow')" @click="follow()">
                <span class="icon is-small">
                  <i class="fas fa-user-plus has-text-info"></i>
                </span>
              </button>
              <button v-else-if="!relationship.hasBlocked" class="button has-tooltip has-tooltip-top" :data-tooltip="$t('unfollow')" @click="unfollow()">
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
        <div v-if="is_self && !edit">
          <button class="button" :data-tooltip="$t('edit')" @click="startEdition()">
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
            :class="{ 'button': true, 'is-loading': edit_load }"
            :disabled="slug_invalid || edit_load"
            @click="endEdition()"
          >
            <span v-if="!edit_load" class="icon is-small has-text-success">
              <i class="fas fa-check"></i>
            </span>
          </button>

          <button class="button" :disabled="edit_load" @click="cancelEdition()">
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

}
</script>

<style lang="scss" scoped>

</style>
