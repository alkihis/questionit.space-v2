<template>
  <div>
    <main v-if="$accessor.profile.user" class="user-root">
      <nuxt-child
        v-if="$route.params.question && !$accessor.profile.relationship.isBlockedBy"
        :key="$route.params.question"
        :allowReplies="!$accessor.profile.relationship.hasBlocked"
        :allowPin="$accessor.profile.isSelf"
        @destroy="destroyQuestion"
        @like="questionHasBeenLiked"
        @pin="willPin($event)"
      ></nuxt-child>

      <!-- Pull to refresh on mobile -->
      <pull-loader :method="pullRefresh">


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
            <div class="box" v-if="answers && answers.items.length">
              <question-card
                v-for="item in answers.items"
                :key="item.id"
                :question="item"
                :allowPin="is_self"
                @pin="willPin($event)"
                @destroy="destroyQuestion(item)"
              />
            </div>
            <div v-if="answers && answers.items.length === 0" class="no-results">
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
        <fluid-container v-else-if="relationship.hasBlocked && !hasAcceptedToShow">
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
      <profile-question-delete-modal :question.sync="deleteQuestionModal" @deleted="onQuestionDeleted" />

      <!-- Modal for user block -->
      <profile-user-block-modal :user.sync="blockUserModal" />

      <!-- Modal for pin question -->
      <profile-pin-question-modal :question.sync="pinQuestionModal" @pinned="onPinnedQuestion" />

      <!-- Modal for resync data with twitter profile -->
      <bulma-modal :open="showRefreshProfile" :card="true" @close="cancelRefreshProfile()">
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
            :disabled="refreshProfileLoad"
            :class="{ button: true, 'is-success': true, 'is-loading': refreshProfileLoad }"
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
import QuestionCard from '~/components/QuestionCard.vue';
import QuestionCardNoReply from '~/components/QuestionCardNoReply/QuestionCardNoReply';
import BulmaModal from '~/components/BulmaModal/BulmaModal';
import { StateChanger } from 'vue-infinite-loading';
import UserCard from '~/components/UserCard.vue';
import CropModal from '~/components/CropModal/CropModal';
import AccountChooser from '~/components/AccountChooser/AccountChooser';
import QuestionTextArea from '~/components/QuestionTextArea/QuestionTextArea';
// @ts-ignore
import PullLoader from '~/components/PullLoader.vue';
import AskQuestion from '~/components/AskQuestion/AskQuestion';
import { IPaginatedWithIdsResult, ISentQuestion, ISentUser } from "~/utils/types/sent.entities.types";
import ProfilePinQuestionModal, { TQuestionPin } from "~/components/pages/profile/modals/ProfilePinQuestionModal.vue";
import ProfileQuestionDeleteModal from "~/components/pages/profile/modals/ProfileQuestionDeleteModal.vue";
import ProfileUserBlockModal from "~/components/pages/profile/modals/ProfileUserBlockModal.vue";

export const SLUG_REGEX = /^[a-z_-][a-z0-9_-]{1,19}$/i;

@Component({
  components: {
    ProfileUserBlockModal,
    ProfileQuestionDeleteModal,
    ProfilePinQuestionModal,
    QuestionCard,
    QuestionCardNoReply,
    BulmaModal,
    UserCard,
    CropModal,
    AccountChooser,
    QuestionTextArea,
    PullLoader,
    AskQuestion,
  },
  scrollToTop: false,
  async asyncData({ app, params, redirect }) {
    const slug = params.slug as string;

    app.$accessor.profile.reset();

    if (!slug) {
      return redirect(app.localePath('/'));
    }

    try {
      let user: ISentUser;
      if (slug.match(/^[0-9]+$/)) {
        user = (await app.$axios.get('user/id/' + slug)).data as ISentUser;
      }
      else {
        user = (await app.$axios.get('user/slug/' + slug)).data as ISentUser;
      }

      app.$accessor.profile.setUser(user);

      // Get answers
      const answers: IPaginatedWithIdsResult<ISentQuestion> = await app.$axios.$get('question/answer/user/' + user.id);

      app.$accessor.profile.setAnswers(answers);
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
  showRefreshProfile = false;
  refreshProfileLoad = false;

  /** Needed to open the delete modal */
  deleteQuestionModal: null | ISentQuestion = null;
  pinQuestionModal: null | TQuestionPin = null;
  blockUserModal = false;

  // Block information
  hasAcceptedToShow = false;

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
    const user = this.$accessor.profile.user;

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
    return this.$accessor.profile.user?.profileAskMeMessage ?? this.$t('write_question');
  }

  get is_slug_loading() {
    return this.edit_load || this.check_slug_load;
  }

  get formatted_created_at_date() {
    return fullDateText(new Date(this.$accessor.profile.user!.createdAt), this);
  }

  get full_formatted_created_at_date() {
    return fullDateText(new Date(this.$accessor.profile.user!.createdAt), this, true);
  }

  get can_show_questions() {
    return this.$accessor.profile.canShowQuestions;
  }

  get twitter_link() {
    return "https://twitter.com/i/user/" + this.$accessor.profile.user!.twitterId;
  }

  get sharable_profile_link() {
    let u = this.localePath('/u/');
    if (!u.endsWith('/'))
      u += '/';

    return "https://twitter.com/intent/tweet?text=" +
      encodeURIComponent(this.$accessor.profile.user!.profileAskMeMessage) +
      "&url=" + encodeURIComponent(QUESTION_IT_FULL_URL + u + this.$accessor.profile.user!.slug) +
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

      const user_res: ISentUser = await this.$axios.$get('user/id/' + this.$accessor.profile.user!.id);

      // Get answers
      const answers_res: IPaginatedWithIdsResult<ISentQuestion> = await this.$axios.$get(
      'question/answer/user/' + this.$accessor.profile.user!.id, {
        params: {
          sinceId: this.answers?.items.length ? this.answers.items[0].id : '0',
        },
      });

      // Save requests data
      this.user = user_res;
      this.answers!.items = [...answers_res.items, ...this.answers!.items];
      let relationship = this.user.relationship;

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

  seeAnyway() {
    this.hasAcceptedToShow = true;
  }


  /* QUESTION DELETION */

  destroyQuestion(question: ISentQuestion) {
    this.deleteQuestionModal = question;
  }

  onQuestionDeleted() {
    const deleted = this.deleteQuestionModal;

    if (deleted) {
      this.$accessor.profile.deleteQuestion(deleted);

      if (this.$route.params.question) {
        // on est sur la page de question, retour sur page slug
        this.$router.push(this.localePath('/u/' + this.user!.slug));
      }

      this.$toast.success(this.$t('question_has_been_deleted'));
    }

    this.deleteQuestionModal = null;
  }


  /* BLOCK USER */

  willblockUnblock() {
    this.blockUserModal = true;
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
    this.pinQuestionModal = { type: 'pin', question: item.id };
  }

  willUnpin() {
    if (!this.user || !this.user.pinnedQuestion)
      return;

    this.pinQuestionModal = { type: 'unpin', question: this.user.pinnedQuestion.id };
  }

  onPinnedQuestion(user: ISentUser) {
    this.pinQuestionModal = null;
    this.user = user;
  }


  /* LOADERS */

  async loadAnswers($state: StateChanger) {
    if (!this.user || !this.answers || !this.answers.items.length || this.answers_complete) {
      this.answers_complete = true;
      $state.complete();
      return;
    }

    try {
      const last_id = this.answers.items[this.answers.items.length - 1].id;
      // Get answers
      const new_answers = await this.$axios.$get('question/answer/user/' + this.user!.id, { params: { untilId: last_id } }) as IPaginatedWithIdsResult<ISentQuestion>;

      if (new_answers.items.length) {
        this.answers.items = [...this.answers.items, ...new_answers.items];
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
        fd.set('askMeMessage', new_ask_me)
      if (new_anon !== undefined)
        fd.set('allowAnonymousQuestions', String(new_anon));

      if (this.new_banner) {
        fd.set('background', this.new_banner);
      }
      if (this.new_pp) {
        fd.set('avatar', this.new_pp);
      }

      const resp = await this.$axios.post('user/settings', fd);

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

    this.showRefreshProfile = true;
  }

  cancelRefreshProfile() {
    this.showRefreshProfile = false;
  }

  async refreshPpWithTwitter() {
    if (!this.$accessor.profile.user || this.refreshProfileLoad)
      return;

    this.refreshProfileLoad = true;

    try {
      const modified = (await this.$axios.patch('users/sync_twitter')).data as ISentUser;

      this.cleanUpObjectUrls();

      this.$accessor.profile.onProfilePictureRefresh(modified);

      this.new_pp = null;
      this.new_banner = null;
    } catch (e) {
      handleError(e, this);
    }

    this.refreshProfileLoad = false;
    this.showRefreshProfile = false;
  }

  cleanUpObjectUrls(user = this.$accessor.profile.user) {
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

    navigator.clipboard.writeText(u + this.$accessor.profile.user!.slug)
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
    if (this.$accessor.profile.user && this.$route.params.slug === this.$accessor.profile.user.id.toString()) {
      if (this.$route.params.question)
        this.$router.replace(this.localePath('/u/' + this.$accessor.profile.user.slug + '/' + this.$route.params.question))
      else
        this.$router.replace(this.localePath('/u/' + this.$accessor.profile.user.slug));
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

.user-root ::v-deep {
  .modal-card-title {
    flex-shrink: unset;
  }
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
