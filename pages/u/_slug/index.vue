<template>
  <div>
    <main v-if="user" class="user-root">
      <nuxt-child
        v-if="$route.params.question && user && !relationship.isBlockedBy"
        :key="$route.params.question"
        :allowReplies="!relationship.hasBlocked"
        :allowPin="is_self"
        @destroy="destroyQuestion"
        @like="questionHasBeenLiked"
        @pin="willPin($event)"
      ></nuxt-child>

      <!-- Pull to refresh on mobile -->
      <pull-loader :method="pullRefresh">
        <header class="profile-header" :style="'background-image: url(\'' + user.bannerPictureUrl + '\');'">
          <!-- Pen edit banner -->
          <div v-if="edit" class="edit-overlay clickable" @click="clickOnModifyBanner">
            <div class="pen-icon-edit-banner">
              <span class="icon has-text-white">
                <i class="fas fa-pen"></i>
              </span>
            </div>
          </div>

          <div class="profile">
            <div class="profile-user-picture" :style="'background-image: url(\'' + user.profilePictureUrl + '\');'">
              <!-- Pen edit profile picture -->
              <div v-if="edit" class="edit-overlay clickable" @click="clickOnModifyPp" style="border-radius: 25%;">
                <div class="pen-icon-edit-banner">
                  <span class="icon has-text-white">
                    <i class="fas fa-pen"></i>
                  </span>
                </div>
              </div>

              <section class="hero">
                <p class="title nanum">
                  {{ user.name }}
                </p>
                <p class="subtitle nanum">
                  @{{ user.slug }}
                  <a :href="twitter_link" rel="noopener noreferrer" target="_blank" class="icon twitter-icon has-text-info">
                    <i class="fab fa-twitter-square"></i>
                  </a>
                </p>
              </section>
            </div>
          </div>
        </header>

        <!-- Mobile profile body: Btn placement, no tooltip -->
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

        <!-- Desktop profile body: Btn placement, tooltips -->
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

        <!-- Infos & Questions -->
        <fluid-container v-if="can_show_questions" :class="{ unlogged: !$accessor.isLogged, infos: true }">
          <!-- Divider when edit -->
          <div v-if="edit" class="divider-edition">
            <div class="divider">{{ $t('just_here_your_profile') }}</div>
          </div>

          <!-- Messages -->
          <div :class="{ messages: true, edit: edit }">
            <!-- Share link msg -->
            <div v-if="is_self" class="message is-dark">
              <div class="message-body">
                <span>
                  {{ $t('want_questions') }}
                </span>

                <a target="_blank" :href="sharable_profile_link">
                  {{ $t('share_profile_here') }}
                </a>
              </div>
            </div>

            <div v-if="!user.allowAnonymousQuestions && !edit" class="message is-warning">
              <div v-if="is_self" class="message-body">
                {{ $t('you_dont_accept_anonymous') }}.
              </div>
              <div v-else class="message-body">
                {{ $t('user_doesnt_accept_anonymous') }}.
              </div>
            </div>
          </div>

          <!-- Numeric infos for user -->
          <nav class="level user-numbers">
            <!-- Questions -->
            <div class="level-item has-text-centered">
              <div v-if="is_self" :class="{ clickable: true, activated: display_mode === 'answers' }" @click="enableQuestions()">
                <p class="heading">{{ $t('questions') }}</p>
                <p class="title">{{ numberFormat(user.counts.answers) }}</p>
              </div>
              <div v-else>
                <p class="heading">{{ $t('questions') }}</p>
                <p class="title">{{ numberFormat(user.counts.answers) }}</p>
              </div>
            </div>
            <!-- Followings -->
            <div class="level-item has-text-centered">
              <div v-if="is_self" :class="{ clickable: true, activated: display_mode === 'followings' }" @click="enableFollowings()">
                <p class="heading">{{ $t('followings') }}</p>
                <p class="title">{{ numberFormat(user.counts.followings) }}</p>
              </div>
              <div v-else>
                <p class="heading">{{ $t('followings') }}</p>
                <p class="title">{{ numberFormat(user.counts.followings) }}</p>
              </div>
            </div>
            <!-- Followers -->
            <div class="level-item has-text-centered">
              <div v-if="is_self" :class="{ clickable: true, activated: display_mode === 'followers' }" @click="enableFollowers()">
                <p class="heading">{{ $t('followers') }}</p>
                <p class="title">{{ numberFormat(user.counts.followers) }}</p>
              </div>
              <div v-else>
                <p class="heading">{{ $t('followers') }}</p>
                <p class="title">{{ numberFormat(user.counts.followers) }}</p>
              </div>
            </div>
            <!-- Register date -->
            <div class="level-item has-text-centered">
              <div>
                <p class="heading">{{ $t('register_date') }}</p>
                <p
                  class="title has-tooltip has-tooltip-bottom"
                  :data-tooltip="full_formatted_created_at_date"
                >{{ formatted_created_at_date }}</p>
              </div>
            </div>
          </nav>

          <!-- Submit new question field -->
          <div v-if="can_send_question && !relationship.hasBlocked" class="field">
            <ask-question
              :allowAnonymous="user.allowAnonymousQuestions"
              :user="user"
              :placeholder="question_ph"
              mode="new"
            />
          </div>

          <!-- Pinned question -->
          <div v-if="display_mode === 'answers' && user.pinnedQuestion">
            <div class="box pinned-question-box">
              <question-card
                :question="user.pinnedQuestion"
                :allowPin="is_self"
                :pinned="true"
                @pin="willUnpin($event)"
                @destroy="destroyQuestion(user.pinnedQuestion)"
              />
            </div>

            <div class="pinned-divider">
              <div class="divider">{{ $t('answers_of') }} {{ user.name }}</div>
            </div>
          </div>

          <!-- Questions -->
          <div v-if="display_mode === 'answers'">
            <div class="box" v-if="answers && answers.length">
              <question-card
                v-for="item in (answers || [])"
                :key="item.id"
                :question="item"
                :allowPin="is_self"
                @pin="willPin($event)"
                @destroy="destroyQuestion(item)"
              />
            </div>
            <div v-if="answers && answers.length === 0" class="no-results">
              <p class="nanum">
                {{ $t('no_answer') }}.
              </p>
            </div>

            <client-only>
              <infinite-loading :key="display_mode" @infinite="loadAnswers" />
            </client-only>
          </div>

          <!-- Followings -->
          <div v-if="display_mode === 'followings'">
            <div class="box" v-if="followings.length">
              <user-card
                v-for="item in followings"
                :key="item.id"
                :user="item"
                @follow="onUserCardFollowingsFollow"
                @unfollow="onUserCardFollowingsUnfollow"
              />
            </div>
            <div v-if="followings.length === 0 && followings_complete" class="no-results">
              <p class="nanum">
                {{ $t('no_following') }}.
              </p>
            </div>

            <infinite-loading :key="display_mode" @infinite="loadFollowings" />
          </div>

          <!-- Followers -->
          <div v-if="display_mode === 'followers'">
            <div class="box" v-if="followers.length">
              <user-card
                v-for="item in followers"
                :key="item.id"
                :user="item"
                @follow="onUserCardFollowersFollow"
                @unfollow="onUserCardFollowersUnfollow"
              />
            </div>
            <div v-if="followers.length === 0 && followers_complete" class="no-results">
              <p class="nanum">
                {{ $t('no_follower') }}.
              </p>
            </div>

            <infinite-loading :key="display_mode" @infinite="loadFollowers" />
          </div>
        </fluid-container>

        <!-- Blocked by this user -->
        <fluid-container v-else-if="relationship.isBlockedBy">
          <p class="is-align-center blocked-message">
            {{ $t('you_have_been_block_by_this_user') }}.
          </p>
        </fluid-container>

        <!-- Has blocked this user; hasn't accepted to show profile -->
        <fluid-container v-else-if="relationship.hasBlocked && !has_accepted_to_show">
          <p class="is-align-center blocked-message">
            {{ $t('you_have_blocked_this_user') }}.
          </p>
          <p class="is-align-center allow-show-message">
            <a href="#!" @click.prevent="seeAnyway()">
              {{ $t('show_this_user_after_all') }}
            </a>
          </p>
        </fluid-container>
      </pull-loader>

      <!-- Modal for question delete -->
      <bulma-modal :open="!!will_destroy" :card="true" @close="cancelDestroy()">
        <header class="modal-card-head">
          <p class="modal-card-title">{{ $t('delete_this_question') }}</p>
          <button class="delete" aria-label="close" @click="cancelDestroy()"></button>
        </header>
        <section class="modal-card-body">
          <!-- Content -->
          <p>
            {{ $t('this_question_will_be_deleted_forever') }}.
          </p>
        </section>
        <footer class="modal-card-foot is-flex-right">
          <button
            :disabled="destroy_loading"
            :class="{ 'button': true, 'is-danger': true, 'is-loading': destroy_loading }"
            @click="sendDestroyQuestion()"
          >{{ $t('delete') }}</button>
          <button class="button" @click="cancelDestroy()">{{ $t('cancel') }}</button>
        </footer>
      </bulma-modal>

      <!-- Modal for user block -->
      <bulma-modal :open="will_block" :card="true" @close="cancelBlock()">
        <header class="modal-card-head">
          <p v-if="relationship.hasBlocked" class="modal-card-title">{{ $t('unblock_this_user') }}</p>
          <p v-else class="modal-card-title">{{ $t('block_this_user') }}</p>
          <button class="delete" aria-label="close" @click="cancelBlock()"></button>
        </header>
        <section class="modal-card-body">
          <!-- Content -->
          <p v-if="relationship.hasBlocked">
            {{ $t('unblock_user_message') }}
          </p>
          <p v-else>
            {{ $t('block_user_message') }}
          </p>
        </section>
        <footer class="modal-card-foot is-flex-right">
          <button
            :disabled="will_block === 1"
            :class="{ button: true, 'is-danger': true, 'is-loading': will_block === 1 }" @click="blockUnblock()"
          >
            <span v-if="relationship.hasBlocked">
              {{ $t('unblock') }}
            </span>
            <span v-else>
              {{ $t('block') }}
            </span>
          </button>
          <button class="button" @click="cancelBlock()">{{ $t('cancel') }}</button>
        </footer>
      </bulma-modal>

      <!-- Modal for pin question -->
      <bulma-modal :open="will_pin" :card="true" @close="cancelPin()">
        <header class="modal-card-head">
          <p v-if="will_pin.type === 'pin'" class="modal-card-title">{{ $t('pin_question') }}</p>
          <p v-else class="modal-card-title">{{ $t('unpin_question') }}</p>
          <button class="delete" aria-label="close" @click="cancelPin()"></button>
        </header>
        <section class="modal-card-body">
          <!-- Content -->
          <p v-if="will_pin.type === 'pin'">
            {{ $t('pin_message') }}.
          </p>
          <p v-else>
            {{ $t('unpin_message') }}.
          </p>
        </section>
        <footer class="modal-card-foot is-flex-right">
          <button class="button" @click="cancelPin()">{{ $t('cancel') }}</button>
          <button
            :disabled="pin_loading"
            :class="{ button: true, 'is-success': true, 'is-loading': pin_loading }"
            @click="pin()"
          >{{ $t('validate') }}</button>
        </footer>
      </bulma-modal>

      <!-- Modal for resync data with twitter profile -->
      <bulma-modal :open="will_refresh_profile" :card="true" @close="cancelRefreshProfile()">
        <header class="modal-card-head">
          <p class="modal-card-title">{{ $t('resync_pp_twitter') }}</p>
          <button class="delete" aria-label="close" @click="cancelRefreshProfile()"></button>
        </header>
        <section class="modal-card-body">
          <!-- Content -->
          <p>
            {{ $t('refresh_profile_twitter_message') }}.
          </p>
        </section>
        <footer class="modal-card-foot is-flex-right">
          <button class="button" @click="cancelRefreshProfile()">{{ $t('cancel') }}</button>
          <button
            :disabled="edit_load"
            :class="{ button: true, 'is-success': true, 'is-loading': edit_load }"
            @click="refreshPpWithTwitter()"
          >{{ $t('validate') }}</button>
        </footer>
      </bulma-modal>

      <!-- Fake inputs for modify pp and banner -->
      <input type="file" class="is-hidden pp-modifier" @change="handleFilePpModify" />
      <input type="file" class="is-hidden banner-modifier" @change="handleFileBannerModify" />

      <crop-modal
        v-if="crop_modal === 'pp'"
        :image="new_pp"
        mode="pp"
        @close="handleFilePpCropped"
        @cropped="handleFilePpCropped"
      />
      <crop-modal
        v-if="crop_modal === 'banner'"
        :image="new_banner"
        mode="banner"
        @close="handleFileBannerCropped"
        @cropped="handleFileBannerCropped"
      />
    </main>
    <div v-else-if="error">
      <full-error :error="error" />
    </div>
    <div v-else>
      <full-error :title="$t('unknown_error')" />
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Vue } from 'nuxt-property-decorator';
import { makeTitle, handleError, numberFormat, fullDateText, QUESTION_IT_FULL_URL, FULL_BLACK_LOGO, isAxiosError, convertAxiosError } from '~/utils/helpers';
import QuestionCard from '~/components/QuestionCard/QuestionCard.vue';
import QuestionCardNoReply from '~/components/QuestionCardNoReply/QuestionCardNoReply';
import BulmaModal from '~/components/BulmaModal/BulmaModal';
import { StateChanger } from 'vue-infinite-loading';
import UserCard from '~/components/UserCard/UserCard';
import CropModal from '~/components/CropModal/CropModal';
import { AxiosResponse } from 'axios';
import AccountChooser from '~/components/AccountChooser/AccountChooser';
import QuestionTextArea from '~/components/QuestionTextArea/QuestionTextArea';
// @ts-ignore
import PullLoader from '~/components/PullLoader.vue';
import AskQuestion from '~/components/AskQuestion/AskQuestion';
import { ISentQuestion, ISentRelationship, ISentUser } from "~/utils/types/sent.entities.types";

export const SLUG_REGEX = /^[a-z_-][a-z0-9_-]{1,19}$/i;
export const NAME_REGEX = /^.{2,32}$/i;

@Component({
  components: {
    QuestionCard,
    QuestionCardNoReply,
    BulmaModal,
    UserCard: UserCard,
    CropModal: CropModal,
    AccountChooser: AccountChooser,
    QuestionTextArea: QuestionTextArea,
    PullLoader: PullLoader,
    AskQuestion: AskQuestion,
  },
  scrollToTop: false,
  async asyncData({ app, params, redirect }) {
    const slug = params.slug as string;

    if (!slug) {
      return redirect(app.localePath('/'));
    }

    try {
      let user: ISentUser;
      if (slug.match(/^[0-9]+$/)) {
        user = (await app.$axios.get('users/id/' + slug)).data as ISentUser;
      }
      else {
        user = (await app.$axios.get('users/slug/' + slug)).data as ISentUser;
      }

      // Get answers
      const answers_res: Promise<AxiosResponse<ISentQuestion[]>> = app.$axios.get('questions', { params: { user_id: user.id } });

      // Get relationship
      let relationship_res: Promise<AxiosResponse<ISentRelationship>> | null = null;
      let relationship: ISentRelationship;

      if (app.$accessor.isLogged && user.id !== app.$accessor.loggedUser!.id) {
        relationship_res = app.$axios.get('relationships/with/' + user.id);
      }

      // Await the requests
      await Promise.all<any>([answers_res, relationship_res || Promise.resolve()]);

      const answers = (await answers_res).data;

      if (relationship_res) {
        relationship = (await relationship_res).data;
      }
      else {
        // Create a stub
        relationship = {
          hasBlocked: false,
          isBlockedBy: false,
          followedBy: false,
          following: false,
        };
      }

      return { user, answers, relationship };
    } catch (error) {
      if (isAxiosError(error) && error.response) {
        error = convertAxiosError(error);
      }
      return { error };
    }
  },
  layout: 'default',
})
export default class extends Vue {
  user: ISentUser | null = null;
  answers: ISentQuestion[] | null = null;
  relationship: ISentRelationship | null = null;
  error: any = null;

  answers_complete = false;

  edit = false;
  before_edit?: ISentUser;
  edit_load = false;
  check_slug_load: any = 0;
  slug_available: null | false | 'available' | 'invalid' = null;
  new_banner: File | null = null;
  new_pp: File | null = null;
  crop_modal: false | 'pp' | 'banner' = false;
  will_refresh_profile = false;

  /** Needed to open the delete modal */
  will_destroy: false | number = false;
  destroy_loading = false;
  will_block: boolean | 1 = false;
  will_pin: false | { type: 'pin' | 'unpin', question: number } = false;
  pin_loading = false;

  // Block information
  has_accepted_to_show = false;

  // Follow
  is_following = false;

  // Followers/Followings display
  display_mode: 'answers' | 'followers' | 'followings' = 'answers';

  followers: ISentUser[] = [];
  follower_next_cursor = "0";
  followers_complete = false;

  followings: ISentUser[] = [];
  following_next_cursor = "0";
  followings_complete = false;

  is_pull_refreshing = false;


  head() {
    // todo meta tags info
    const user = this.user;

    if (user) {
      const dscr = `${this.$t('profile_of')} ${user.name} — @${user.slug}, ${user.counts?.answers} questions.`;
      const url = QUESTION_IT_FULL_URL + '/u/' + user.slug;
      const title = makeTitle(user.name);
      const pp = user.profilePictureUrl ?? FULL_BLACK_LOGO;

      return {
        title,
        meta: [
          {
            hid: 'description',
            name: 'description',
            content: dscr,
          },
          {
            hid: 'og:description',
            property: 'og:description',
            content: dscr,
          },
          {
            hid: 'og:url',
            property: 'og:url',
            content: url,
          },
          {
            hid: 'og:title',
            property: 'og:title',
            content: title,
          },
          {
            hid: 'og:image',
            property: 'og:image',
            content: pp,
          },
        ],
      };
    }
    else {
      return {
        title: makeTitle()
      };
    }
  }

  /* GETTERS FOR PROFILE MODIFICATIONS */

  get is_self() {
    return this.$accessor.loggedUser && this.$accessor.loggedUser.id === this.user?.id;
  }

  get username() {
    return this.user?.name ?? "";
  }

  set username(name: string) {
    if (this.user)
      this.user.name = name;
  }

  get slug() {
    return this.user?.slug ?? "";
  }

  set slug(slug: string) {
    if (this.user)
      this.user.slug = slug;

    this.slug_available = null;
    clearTimeout(this.check_slug_load);
    this.check_slug_load = 0;

    if (!slug.match(SLUG_REGEX)) {
      this.slug_available = 'invalid';
      return;
    }

    if (this.$accessor.isLogged && slug) {
      this.check_slug_load = setTimeout(async () => {
        this.check_slug_load = 0;
        try {
          const available = (await this.$axios.get('users/available', { params: { slug } })).data as { available: boolean };

          this.slug_available = available.available ? 'available' : false;
        } catch (e) {
          handleError(e, this);
        }
      }, 350);
    }
  }

  get slug_invalid() {
    return this.slug_available === false || this.slug_available === 'invalid';
  }

  get ask_me_message() {
    return this.user?.profileAskMeMessage ?? "";
  }

  set ask_me_message(v: string) {
    if (this.user)
      this.user.profileAskMeMessage = v;
  }

  get can_send_question() {
    if (!this.user)
      return false;

    if (!this.$accessor.isLogged && !this.user.allowAnonymousQuestions)
      return false;

    if (this.relationship && this.relationship.hasBlocked)
      return false;

    return !this.is_self;
  }

  get allow_anonymous() {
    return this.user?.allowAnonymousQuestions ?? false;
  }

  set allow_anonymous(v: boolean) {
    if (this.user)
      this.user.allowAnonymousQuestions = v;
  }

  /* INSTANCE PROPERTIES */

  get question_ph() {
    return this.user?.profileAskMeMessage ?? this.$t('write_question');
  }

  get is_slug_loading() {
    return this.edit_load || this.check_slug_load;
  }

  get formatted_created_at_date() {
    return fullDateText(new Date(this.user!.createdAt), this);
  }

  get full_formatted_created_at_date() {
    return fullDateText(new Date(this.user!.createdAt), this, true);
  }

  get can_show_questions() {
    if (!this.user)
      return false;

    if (this.relationship && this.relationship.isBlockedBy)
      return false;

    if (this.relationship && this.relationship.hasBlocked && !this.has_accepted_to_show)
      return false;

    return true;
  }

  get twitter_link() {
    return "https://twitter.com/i/user/" + this.user!.twitterId;
  }

  get sharable_profile_link() {
    let u = this.localePath('/u/');
    if (!u.endsWith('/'))
      u += '/';

    return "https://twitter.com/intent/tweet?text=" +
      encodeURIComponent(this.user!.profileAskMeMessage) +
      "&url=" + encodeURIComponent(QUESTION_IT_FULL_URL + u + this.user!.slug) +
      "&via=QuestionItSpace";
  }


  /* METHODS */

  /**
   * Refresh questions and profile data
   */
  async refreshProfile() {
    if (this.is_pull_refreshing || this.edit_load || this.edit)
      return;

    try {
      this.is_pull_refreshing = true;

      const user_res: Promise<ISentUser> = this.$axios.$get('users/id/' + this.user!.id);

      // Get answers
      const answers_res: Promise<ISentQuestion[]> = this.$axios.$get(
        'questions', {
          params: {
            user_id: this.user!.id,
            since: this.answers?.length ? this.answers[0].id : '0',
          }
        });

      // Get relationship
      let relationship_res: Promise<ISentRelationship> | null = null;

      if (this.$accessor.isLogged && this.user!.id !== this.$accessor.loggedUser!.id) {
        relationship_res = this.$axios.$get('relationships/with/' + this.user!.id);
      }

      // Save requests data
      this.user = await user_res;
      this.answers = [...(await answers_res), ...this.answers!];
      let relationship = await relationship_res;

      if (!relationship) {
        // Create a stub
        relationship = {
          hasBlocked: false,
          isBlockedBy: false,
          followedBy: false,
          following: false,
        };
      }

      this.relationship = relationship;
    } catch (e) {
      // failed to refresh :'(
      return -1;
    } finally {
      this.is_pull_refreshing = false;
    }
  }

  pullRefresh() {
    return this.refreshProfile();
  }

  numberFormat(number: number) {
    return numberFormat(number);
  }

  questionHasBeenLiked(question: ISentQuestion) {
    if (this.answers) {
      const found = this.answers.findIndex(q => q.id === question.id);

      if (found !== -1) {
        this.answers[found].answer!.liked = question.answer!.liked;
        this.answers[found].answer!.likeCount = question.answer!.likeCount;
      }
    }
  }

  seeAnyway() {
    this.has_accepted_to_show = true;
  }


  /* QUESTION DELETION */

  destroyQuestion(question: ISentQuestion) {
    this.will_destroy = question.id;
  }

  cancelDestroy() {
    this.will_destroy = false;
  }

  async sendDestroyQuestion() {
    const id = this.will_destroy;
    if (!id || this.destroy_loading) {
      return;
    }

    this.destroy_loading = true;

    try {
      await this.$axios.delete('questions', { params: { question: id } });
      this.answers = this.answers?.filter(e => e.id !== id) ?? null;

      // If deleted question is pinned question
      if (this.user?.pinnedQuestion && this.user.pinnedQuestion.id === id) {
        this.user.pinnedQuestion = undefined;
        this.$accessor.setLoggedUser({ ...this.user });
      }

      this.$toast.success(
        this.$t('question_has_been_deleted'),
      );

      if (this.user?.counts?.answers) {
        this.user.counts.answers--;
      }

      if (this.$route.params.question) {
        // on est sur la page de question, retour sur page slug
        this.$router.push(this.localePath('/u/' + this.user!.slug));
      }
    } catch (e) {
      handleError(e, this);
    }

    this.will_destroy = false;
    this.destroy_loading = false;
  }


  /* BLOCK USER */

  willblockUnblock() {
    if (this.is_self || !this.user || !this.$accessor.isLogged)
      return;

    this.will_block = true;
  }

  cancelBlock() {
    this.will_block = false;
  }

  async blockUnblock() {
    if (
      this.is_self ||
      !this.user ||
      !this.relationship ||
      !this.$accessor.isLogged ||
      this.will_block === 1
    )
      return;

    const action = this.relationship.hasBlocked ? 'unblock' : 'block';
    this.will_block = 1;

    if (action === 'block') {
      this.has_accepted_to_show = false;

      try {
        await this.$axios.post('blocks/' + this.user.id);
        this.$toast.success(this.$t('user_has_been_block'));
        this.relationship.hasBlocked = true;

        // Refresh relationship
        if (this.relationship) {
          // On le suit
          if (this.relationship.following) {
            this.user.counts!.followers!--;
          }
          // Il nous suit
          if (this.relationship.followedBy) {
            this.user.counts!.followings!--;
          }

          this.relationship.following = false;
          this.relationship.followedBy = false;
        }
      } catch (e) {
        handleError(e, this);
      }
    }
    else {
      try {
        await this.$axios.delete('blocks/' + this.user.id);
        this.$toast.success(this.$t('user_has_been_unblock'));
        this.relationship.hasBlocked = false;
      } catch (e) {
        handleError(e, this);
      }
    }

    this.will_block = false;
  }


  /* FOLLOW USER */

  async follow() {
    if (!this.user || !this.$accessor.isLogged || !this.relationship || this.is_following) {
      return;
    }

    this.is_following = true;
    const before = this.relationship.following;

    try {
      await this.$axios.post('relationships/' + this.user.id);
      this.relationship.following = true;
      this.$toast.success(this.$t('followed_user', { name: this.user.name }));

      if (before !== this.relationship.following) {
        // Follow status change
        this.user.counts!.followers!++;
      }
    } catch (e) {
      handleError(e, this);
    } finally {
      this.is_following = false;
    }
  }

  async unfollow() {
    if (!this.user || !this.$accessor.isLogged || !this.relationship || this.is_following) {
      return;
    }

    this.is_following = true;
    const before = this.relationship.following;

    try {
      await this.$axios.delete('relationships/' + this.user.id);
      this.relationship.following = false;
      this.$toast.success(this.$t('unfollowed_user', { name: this.user.name }));

      if (before !== this.relationship.following && this.user.counts?.followers) {
        // Follow status change
        this.user.counts.followers--;
      }
    } catch (e) {
      handleError(e, this);
    } finally {
      this.is_following = false;
    }
  }

  onUserCardFollowersUnfollow(target: ISentUser) {
    // Decrement
    this.user!.counts!.followings--;

    // If user is in the followings array, remove him
    this.followings = this.followings.filter(e => e.id !== target.id);
  }

  onUserCardFollowingsUnfollow() {
    // Decrement
    this.user!.counts!.followings--;

    // Do not touch the user: we don't want to remove it
  }

  onUserCardFollowersFollow(target: ISentUser) {
    // Increment
    this.user!.counts!.followings++;

    // If user is not in the followings array, add him
    if (!this.followings.some(e => e.id === target.id)) {
      this.followings = [target, ...this.followings];
    }
  }

  onUserCardFollowingsFollow() {
    // Increment
    this.user!.counts!.followings++;

    // Do not touch the users: if user has successfully followed him,
    // he is in the followings array
  }


  /* PIN QUESTION */

  willPin(item: ISentQuestion) {
    this.will_pin = { type: 'pin', question: item.id };
  }

  willUnpin() {
    if (!this.user || !this.user.pinnedQuestion)
      return;

    this.will_pin = { type: 'unpin', question: this.user.pinnedQuestion.id };
  }

  cancelPin() {
    this.will_pin = false;
  }

  async pin() {
    if (!this.will_pin || !this.user || !this.is_self || this.pin_loading)
      return;

    const action = this.will_pin;
    this.pin_loading = true;

    try {
      let user: ISentUser;
      if (action.type === 'pin') {
        user = (await this.$axios.patch('questions/pin', { id: action.question })).data as ISentUser;
        this.$toast.success(this.$t('pin_success'));
      }
      else {
        user = (await this.$axios.delete('questions/pin')).data as ISentUser;
        this.$toast.success(this.$t('unpin_success'));
      }

      this.$accessor.setLoggedUser({ ...user });
      this.user = user;
      this.will_pin = false;
    } catch (e) {
      handleError(e, this);
    }

    this.pin_loading = false;
  }


  /* LOADERS */

  async loadAnswers($state: StateChanger) {
    if (!this.user || !this.answers || !this.answers.length || this.answers_complete) {
      this.answers_complete = true;
      $state.complete();
      return;
    }

    try {
      const last_id = this.answers[this.answers.length - 1].id;
      // Get answers
      const new_answers = (await this.$axios.get('questions', { params: { user_id: this.user!.id, until: last_id } })).data as ISentQuestion[];

      if (new_answers.length) {
        this.answers = [...this.answers, ...new_answers];
        $state.loaded();
      }
      else {
        this.answers_complete = true;
        $state.complete();
        return;
        // no answers left.
      }
    } catch (e) {
      handleError(e, this);
      $state.error();
    }
  }

  async loadFollowings($state: StateChanger) {
    if (!this.user || !this.is_self || this.followings_complete) {
      this.followings_complete = true;
      $state.complete();
      return;
    }

    try {
      const until = this.following_next_cursor === "0" ? undefined : this.following_next_cursor;

      // Get answers
      const new_followings = (
        await this.$axios.get('relationships/followings', { params: { until } })
      ).data as { followings: ISentUser[], next_cursor: string };

      this.following_next_cursor = new_followings.next_cursor;

      if (new_followings.followings.length) {
        this.followings = [...this.followings, ...new_followings.followings];
        $state.loaded();
      }
      else {
        this.followings_complete = true;
        $state.complete();
        return;
        // no answers left.
      }
    } catch (e) {
      handleError(e, this);
      $state.error();
    }
  }

  async loadFollowers($state: StateChanger) {
    if (!this.user || !this.is_self || this.followers_complete) {
      this.followers_complete = true;
      $state.complete();
      return;
    }

    try {
      const until = this.follower_next_cursor === "0" ? undefined : this.follower_next_cursor;
      // Get answers
      const new_follow = (
        await this.$axios.get('relationships/followers', { params: { until } })
      ).data as { followers: ISentUser[], next_cursor: string };

      this.follower_next_cursor = new_follow.next_cursor;

      if (new_follow.followers.length) {
        this.followers = [...this.followers, ...new_follow.followers];
        $state.loaded();
      }
      else {
        this.followers_complete = true;
        $state.complete();
        return;
        // no answers left.
      }
    } catch (e) {
      handleError(e, this);
      $state.error();
    }
  }


  /* PROFILE EDITION */

  startEdition() {
    this.edit = true;
    this.edit_load = false;
    this.before_edit = this.user ? { ...this.user } : undefined;
  }

  clickOnModifyPp() {
    (this.$el.querySelector('input[type="file"].pp-modifier') as HTMLElement).click();
  }

  handleFilePpModify(e: Event) {
    const el = e.target as HTMLInputElement;
    if (el.files?.[0]) {
      if (el.files![0].size > 5 * 1024 * 1024) {
        this.$toast.error(this.$t('file_is_too_big'));
        return;
      }

      // Nouvelle pp
      this.new_pp = el.files![0];
      this.crop_modal = 'pp';

      el.value = "";
    }
  }

  handleFilePpCropped(file?: File) {
    this.crop_modal = false;
    this.new_pp = file ?? null;

    if (file) {
      this.user!.profilePictureUrl = URL.createObjectURL(file);
    }
  }

  clickOnModifyBanner() {
    (this.$el.querySelector('input[type="file"].banner-modifier') as HTMLElement).click();
  }

  handleFileBannerModify(e: Event) {
    const el = e.target as HTMLInputElement;
    if (el.files?.[0]) {
      if (el.files![0].size > 5 * 1024 * 1024) {
        this.$toast.error(this.$t('file_is_too_big'));
        return;
      }

      // Nouvelle pp
      this.new_banner = el.files![0];
      this.crop_modal = 'banner';

      el.value = "";
    }
  }

  handleFileBannerCropped(file?: File) {
    this.crop_modal = false;
    this.new_banner = file ?? null;

    if (file) {
      this.user!.bannerPictureUrl = URL.createObjectURL(file);
    }
  }

  async endEdition() {
    if (!this.before_edit || !this.user || this.edit_load)
      return;

    this.user.name = this.user.name.trim();
    this.user.slug = this.user.slug.trim();

    // Try to upload modifications
    const new_name = this.user.name !== this.before_edit.name ? this.user.name : undefined;
    const new_slug = this.user.slug !== this.before_edit.slug ? this.user.slug : undefined;
    const new_ask_me = this.user.profileAskMeMessage !== this.before_edit.profileAskMeMessage ? this.user.profileAskMeMessage : undefined;
    const new_anon = this.user.allowAnonymousQuestions;

    this.edit_load = true;
    clearTimeout(this.check_slug_load);
    this.check_slug_load = 0;

    try {
      const fd = new FormData;

      if (new_name)
        fd.set('name', new_name);
      if (new_slug)
        fd.set('slug', new_slug)
      if (new_ask_me)
        fd.set('ask_me_message', new_ask_me)
      if (new_anon !== undefined)
        fd.set('allow_anonymous', String(new_anon));

      if (this.new_banner) {
        fd.set('background', this.new_banner);
      }
      if (this.new_pp) {
        fd.set('avatar', this.new_pp);
      }

      const resp = await this.$axios.post('users/profile', fd);

      const modified = resp.data as ISentUser;

      // Revoke urls if needed
      this.cleanUpObjectUrls();

      this.user = modified;

      this.$accessor.setLoggedUser({ ...modified });

      if (modified.slug !== this.before_edit?.slug)
        this.$router.replace(this.localePath('/u/' + modified.slug));

      this.before_edit = undefined;
      this.edit = false;
      this.slug_available = null;
      this.new_banner = null;
      this.new_pp = null;

      this.$toast.success(this.$t('profile_updated'));
    } catch (e) {
      handleError(e, this);
    } finally {
      this.edit_load = false;
    }
  }

  cancelEdition() {
    if (this.edit_load)
      return;

    this.cleanUpObjectUrls();

    this.edit = false;
    this.user = this.before_edit ?? this.user;
    this.before_edit = undefined;
    this.slug_available = null;
    this.new_banner = null;
    this.new_pp = null;
  }

  willRefreshProfile() {
    if (this.edit_load)
      return;

    this.will_refresh_profile = true;
  }

  cancelRefreshProfile() {
    this.will_refresh_profile = false;
  }

  async refreshPpWithTwitter() {
    if (!this.user || this.edit_load)
      return;

    this.edit_load = true;

    try {
      const modified = (await this.$axios.patch('users/sync_twitter')).data as ISentUser;

      this.cleanUpObjectUrls();

      this.user.profilePictureUrl = modified.profilePictureUrl;
      this.user.bannerPictureUrl = modified.bannerPictureUrl;
      this.new_pp = null;
      this.new_banner = null;

      if (this.before_edit) {
        this.before_edit.profilePictureUrl = modified.profilePictureUrl;
        this.before_edit.bannerPictureUrl = modified.bannerPictureUrl;
      }
    } catch (e) {
      handleError(e, this);
    }

    this.edit_load = false;
    this.will_refresh_profile = false;
  }

  cleanUpObjectUrls(user = this.user) {
    // Revoke urls
    if (user!.profilePictureUrl?.startsWith('blob:')) {
      URL.revokeObjectURL(user!.profilePictureUrl);
    }
    if (user!.bannerPictureUrl?.startsWith('blob:')) {
      URL.revokeObjectURL(user!.bannerPictureUrl);
    }
  }

  /* LIFECYCLE */

  copyLinkToClipboard() {
    let u = this.localePath('/u/');
    if (!u.endsWith('/'))
      u += '/';

    navigator.clipboard.writeText(u + this.user!.slug)
      .then(() => {
        this.$toast.success(this.$t('link_copied_clipboard'));
      })
      .catch(() => {
        handleError(new Error(this.$t('unsupported_navigator').toString()), this);
      });
  }

  enableFollowings() {
    this.display_mode = 'followings';
  }

  enableFollowers() {
    this.display_mode = 'followers';
  }

  enableQuestions() {
    this.display_mode = 'answers';
  }

  mounted() {
    // @ts-ignore
    window.UserProfile = this;

    // Scroll to top on first mount, not at each change
    window.scrollTo(0, 0);

    // If slug is only id
    if (this.user && this.$route.params.slug === this.user.id.toString()) {
      if (this.$route.params.question)
        this.$router.replace(this.localePath('/u/' + this.user.slug + '/' + this.$route.params.question))
      else
        this.$router.replace(this.localePath('/u/' + this.user.slug));
    }
  }
}
</script>

<style lang="scss" scoped>
@import '~/assets/css/functions.scss';

main.user-root {
  padding-bottom: 3rem;
}

.no-results {
  margin-top: 3rem;
  text-align: center;
  font-size: 1.2rem;
}

.title, .subtitle {
  word-break: normal;
}

.modal-card-title {
  flex-shrink: unset;
}

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

.divider-edition {
  margin-bottom: 2rem;
}

.user-numbers:first-child, .divider-edition {
  @media screen and (min-width: 1024px) {
    margin-top: -1rem;
  }
}

@media screen and (min-width: 1024px) {
  .user-numbers {
    margin-bottom: 2.5rem;
  }
}

@media screen and (max-width: 768px) {
  .user-numbers {
    // Two by two numbers on mobile
    display: grid;
    width: 100%;
    grid-template-columns: 1fr 1fr;

    .level-item {
      margin-bottom: 1rem;
    }
  }

  .mobile-no-edit-buttons {
    margin-bottom: 2.5rem;
  }

  .infos.unlogged {
    padding-top: .5rem;
  }
}

.desktop-body.edit {
  padding-bottom: 1rem;
}

.messages {
  &:not(.edit) > .message:first-child {
    margin-top: 1rem;

    @media screen and (min-width: 1024px) {
      margin-top: -1rem;
    }
  }

  & > .message:last-child {
    margin-bottom: 2.5rem;
  }
}

header.profile-header {
  display: flex;
  position: relative;
  justify-content: center;
  align-items: flex-end;
  height: 33vh;

  .edit-overlay {
    position: absolute;
    width: 100%;
    height: 100%;
    background-color: transparent;
    transition: background-color .3s;

    &:hover {
      background-color: rgba(0, 0, 0, 0.274);
    }
  }

  .pen-icon-edit-banner {
    position: absolute;
    top: 50%;  /* position the top  edge of the element at the middle of the parent */
    left: 50%; /* position the left edge of the element at the middle of the parent */

    transform: translate(-50%, -50%);
    background-color: #3e3e3e63;
    padding: 6px;
    border-radius: 25px;
  }


  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  background-color: #4384a2;

  @media screen and (max-width: 1023px) {
    height: 20vh;
    justify-content: left;
    margin-bottom: 6rem;
  }
}

.pinned-divider {
  margin: 1rem 0;
}

.twitter-icon {
  vertical-align: bottom;
  @media screen and (min-width: 1024px) {
    vertical-align: middle;
  }
}

.pinned-question-box {
  margin-top: 1rem;
  margin-bottom: 1rem;
}

.blocked-message {
  font-size: 1.2rem;
  font-weight: bold;
  color: #d80606;
}

.allow-show-message {
  margin-top: 1rem;
  font-size: 1.1rem;
}

.follow-btns-mobile {
  margin-top: .5rem;
}

.profile {
  width: 10rem;
  height: 10rem;
  bottom: -5rem;
  position: absolute;

  @media screen and (max-width: 1023px) {
    width: 7rem;
    height: 7rem;
  }

  &-user-picture {
    width: 100%;
    height: 100%;
    position: relative;

    border-radius: 25%;
    box-shadow: 0 0.5em 1em -0.125em rgba(10, 10, 10, .1), 0 0 0 1px rgba(10, 10, 10, .02);
    border: .2rem solid white;

    background-size: cover;
    background-repeat: no-repeat;
    background-position: center center;

    section.hero {
      display: none;
      width: max-content;

      p {
        width: inherit;
      }
    }

    @media screen and (max-width: 1023px) {
      width: 7rem;
      height: 7rem;
      margin-bottom: 0;
      margin-left: 1.5rem;
      display: flex;
      align-items: flex-end;

      section.hero {
        display: flex;
        margin-left: 8rem;
        margin-bottom: .5rem;
        max-width: 50vw;

        p.title {
          font-size: 1.8rem;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          width: 100%;
        }

        p.subtitle {
          font-size: 1.2rem;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          width: 100%;
        }
      }
    }
  }

  &-edit-button {
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

.question-field {
  margin-bottom: 1rem;

  @media screen and (max-width: 1023px) {
    margin-top: 1rem;
  }
}
</style>
