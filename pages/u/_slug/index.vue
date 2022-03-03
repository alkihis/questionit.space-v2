<template>
  <div>
    <main v-if="$accessor.profile.user" class="user-root">
      <nuxt-child
        v-if="$route.params.question && !$accessor.profile.relationship.isBlockedBy"
        :key="$route.params.question"
        :allowReplies="!$accessor.profile.relationship.hasBlocked"
        :allowPin="$accessor.profile.isSelf"
        @destroy="destroyQuestion"
        @like="$accessor.profile.refreshLikeDetails({ id: $event.id, liked: $event.answer.liked, likeCount: $event.answer.likeCount })"
        @pin="willPin"
      ></nuxt-child>

      <!-- Pull to refresh on mobile -->
      <pull-loader :method="pullRefresh">
        <profile-header
          @refresh-profile="willRefreshProfile"
          @block="willblockUnblock"
          @follow="follow"
          @unfollow="unfollow"
        />

        <profile-content
          v-if="$accessor.profile.canShowQuestions"
          @pin="willPin"
          @unpin="willUnpin"
          @destroy="destroyQuestion"
        />

        <!-- Blocked by this user -->
        <fluid-container v-else-if="relationship.isBlockedBy">
          <p class="is-align-center blocked-message">
            {{ $t('you_have_been_block_by_this_user') }}.
          </p>
        </fluid-container>

        <!-- Has blocked this user; hasn't accepted to show profile -->
        <fluid-container v-else-if="relationship.hasBlocked && !$accessor.profile.hasAcceptedToShow">
          <p class="is-align-center blocked-message">
            {{ $t('you_have_blocked_this_user') }}.
          </p>
          <p class="is-align-center allow-show-message">
            <a href="#!" @click.prevent="$accessor.profile.acceptToShow()">
              {{ $t('show_this_user_after_all') }}
            </a>
          </p>
        </fluid-container>
      </pull-loader>

      <!-- Modal for question delete -->
      <profile-question-delete-modal :question.sync="deleteQuestionModal" @deleted="onQuestionDeleted" />

      <!-- Modal for user block -->
      <profile-user-block-modal :open.sync="blockUserModal" />

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
import { makeTitle, handleError, QUESTION_IT_FULL_URL, FULL_BLACK_LOGO, isAxiosError, convertAxiosError } from '~/utils/helpers';
import BulmaModal from '~/components/BulmaModal.vue';
// @ts-ignore
import PullLoader from '~/components/PullLoader.vue';
import { IPaginatedWithIdsResult, ISentQuestion, ISentUser } from "~/utils/types/sent.entities.types";
import ProfilePinQuestionModal, { TQuestionPin } from "~/components/pages/profile/modals/ProfilePinQuestionModal.vue";
import ProfileQuestionDeleteModal from "~/components/pages/profile/modals/ProfileQuestionDeleteModal.vue";
import ProfileUserBlockModal from "~/components/pages/profile/modals/ProfileUserBlockModal.vue";
import ProfileHeader from '~/components/pages/profile/header/ProfileHeader.vue';
import ProfileContent from '~/components/pages/profile/ProfileContent.vue';

export const SLUG_REGEX = /^[a-z_-][a-z0-9_-]{1,19}$/i;

@Component({
  components: {
    ProfileContent,
    ProfileHeader,
    ProfileUserBlockModal,
    ProfileQuestionDeleteModal,
    ProfilePinQuestionModal,
    BulmaModal,
    PullLoader,
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

  showRefreshProfile = false;
  refreshProfileLoad = false;

  /** Needed to open the delete modal */
  deleteQuestionModal: null | ISentQuestion = null;
  pinQuestionModal: null | TQuestionPin = null;
  blockUserModal = false;

  isFollowing = false;
  isPullRefreshing = false;

  head() {
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

  get user() {
    return this.$accessor.profile.user!;
  }

  get relationship() {
    return this.$accessor.profile.relationship;
  }

  /* METHODS */

  /**
   * Refresh questions and profile data
   */
  async refreshProfile() {
    if (this.isPullRefreshing || this.$accessor.profile.editUser !== null || this.$accessor.profile.editionLoad)
      return;

    try {
      this.isPullRefreshing = true;
      const answers = this.$accessor.profile.answers.items;

      const userResponse: ISentUser = await this.$axios.$get('user/id/' + this.$accessor.profile.user!.id);

      // Get answers
      const answersResponse: IPaginatedWithIdsResult<ISentQuestion> = await this.$axios.$get(
      'question/answer/user/' + this.$accessor.profile.user!.id, {
        params: {
          sinceId: answers.length ? answers[0].answer!.id : '0',
        },
      });

      // Save requests data
      this.$accessor.profile.setUser(userResponse);
      this.$accessor.profile.addAnswers({ answers: answersResponse.items, addToTop: true });
    } catch (e) {
      // failed to refresh :'(
      return -1;
    } finally {
      this.isPullRefreshing = false;
    }
  }

  pullRefresh() {
    return this.refreshProfile();
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
    if (!this.user || !this.$accessor.isLogged || !this.relationship || this.isFollowing) {
      return;
    }

    this.isFollowing = true;
    const before = this.relationship.following;

    try {
      await this.$axios.post('relationship/' + this.user.id);
      this.$accessor.profile.updateRelationship({ following: true });
      this.$toast.success(this.$t('followed_user', { name: this.user.name }));

      if (before !== this.relationship.following) {
        // Follow status change
        this.$accessor.profile.incrementFollowersCount();
      }
    } catch (e) {
      handleError(e, this);
    } finally {
      this.isFollowing = false;
    }
  }

  async unfollow() {
    if (!this.user || !this.$accessor.isLogged || !this.relationship || this.isFollowing) {
      return;
    }

    this.isFollowing = true;
    const before = this.relationship.following;

    try {
      await this.$axios.delete('relationship/' + this.user.id);
      this.$accessor.profile.updateRelationship({ following: false });
      this.$toast.success(this.$t('unfollowed_user', { name: this.user.name }));

      if (before !== this.relationship.following && this.user.counts?.followers) {
        // Follow status change
        this.$accessor.profile.decrementFollowersCount();
      }
    } catch (e) {
      handleError(e, this);
    } finally {
      this.isFollowing = false;
    }
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
    this.$accessor.profile.setUser(user);
  }


  /* PROFILE EDITION */

  willRefreshProfile() {
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
      const modified = (await this.$axios.patch('user/sync-profile-with-twitter')).data as ISentUser;

      this.$accessor.profile.onProfilePictureRefresh(modified);
    } catch (e) {
      handleError(e, this);
    }

    this.refreshProfileLoad = false;
    this.showRefreshProfile = false;
  }

  /* LIFECYCLE */

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

.blocked-message {
  font-size: 1.2rem;
  font-weight: bold;
  color: #d80606;
}

.allow-show-message {
  margin-top: 1rem;
  font-size: 1.1rem;
}

.user-root ::v-deep {
  padding-bottom: 3rem;

  .title, .subtitle {
    word-break: normal;
  }

  .question-field {
    margin-bottom: 1rem;

    @media screen and (max-width: 1023px) {
      margin-top: 1rem;
    }
  }
}
</style>
