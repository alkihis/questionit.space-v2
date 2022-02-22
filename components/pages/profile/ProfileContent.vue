<template>
  <fluid-container :class="{ unlogged: !$accessor.isLogged, infos: true }">
    <!-- Divider when edit -->
    <div v-if="edit" class="divider-edition">
      <div class="divider">{{ $t('just_here_your_profile') }}</div>
    </div>

    <!-- Messages -->
    <div :class="{ messages: true, edit }">
      <!-- Share link msg -->
      <div v-if="$accessor.profile.isSelf" class="message is-dark">
        <div class="message-body">
          <span>
            {{ $t('want_questions') }}
          </span>

          <a target="_blank" :href="shareableProfileLink">
            {{ $t('share_profile_here') }}
          </a>
        </div>
      </div>

      <div v-if="!user.allowAnonymousQuestions && !edit" class="message is-warning">
        <div v-if="$accessor.profile.isSelf" class="message-body">
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
        <div v-if="$accessor.profile.isSelf" :class="{ clickable: true, activated: displayMode === 'answers' }" @click="displayMode = 'answers'">
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
        <div v-if="$accessor.profile.isSelf" :class="{ clickable: true, activated: displayMode === 'followings' }" @click="displayMode = 'followings'">
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
        <div v-if="$accessor.profile.isSelf" :class="{ clickable: true, activated: displayMode === 'followers' }" @click="displayMode = 'followers'">
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
            :data-tooltip="fullFormattedCreatedAtDate"
          >{{ formattedCreatedAtDate }}</p>
        </div>
      </div>
    </nav>

    <!-- Submit new question field -->
    <div v-if="canSendQuestion && !relationship.hasBlocked" class="field">
      <ask-question
        :allowAnonymous="user.allowAnonymousQuestions"
        :user="user"
        :placeholder="questionPlaceholder"
        mode="new"
      />
    </div>

    <!-- Pinned question -->
    <div v-if="displayMode === 'answers' && user.pinnedQuestion">
      <div class="box pinned-question-box">
        <question-card
          :question="user.pinnedQuestion"
          :allowPin="$accessor.profile.isSelf"
          :pinned="true"
          @pin="$emit('unpin', $event)"
          @destroy="$emit('destroy', user.pinnedQuestion)"
        />
      </div>

      <div class="pinned-divider">
        <div class="divider">{{ $t('answers_of') }} {{ user.name }}</div>
      </div>
    </div>

    <!-- Questions -->
    <div v-if="displayMode === 'answers'">
      <div class="box" v-if="$accessor.profile.answers.items.length">
        <question-card
          v-for="item in $accessor.profile.answers.items"
          :key="item.id"
          :question="item"
          :allowPin="$accessor.profile.isSelf"
          @pin="$emit('pin', $event)"
          @destroy="$emit('destroy', item)"
        />
      </div>
      <div v-else class="no-results">
        <p class="nanum">
          {{ $t('no_answer') }}.
        </p>
      </div>

      <client-only>
        <infinite-loading :key="displayMode" @infinite="loadAnswers" />
      </client-only>
    </div>

    <!-- Followings -->
    <div v-if="displayMode === 'followings'">
      <div class="box" v-if="followings.length">
        <user-card
          v-for="item in followings"
          :key="item.id"
          :user="item"
          @follow="onUserCardFollowingsFollow"
          @unfollow="onUserCardFollowingsUnfollow"
        />
      </div>
      <div v-if="followings.length === 0 && followingsPage === -1" class="no-results">
        <p class="nanum">
          {{ $t('no_following') }}.
        </p>
      </div>

      <infinite-loading :key="displayMode" @infinite="loadFollowings" />
    </div>

    <!-- Followers -->
    <div v-if="displayMode === 'followers'">
      <div class="box" v-if="followers.length">
        <user-card
          v-for="item in followers"
          :key="item.id"
          :user="item"
          @follow="onUserCardFollowersFollow"
          @unfollow="onUserCardFollowersUnfollow"
        />
      </div>
      <div v-if="followers.length === 0 && followersPage === -1" class="no-results">
        <p class="nanum">
          {{ $t('no_follower') }}.
        </p>
      </div>

      <infinite-loading :key="displayMode" @infinite="loadFollowers" />
    </div>
  </fluid-container>
</template>

<script lang="ts">
import { Component, Vue } from 'nuxt-property-decorator';
import { fullDateText, handleError, numberFormat, QUESTION_IT_FULL_URL } from '~/utils/helpers';
import AskQuestion from '~/components/AskQuestion.vue';
import QuestionCard from '~/components/QuestionCard.vue';
import { StateChanger } from 'vue-infinite-loading';
import { IPaginatedResult, IPaginatedWithIdsResult, ISentQuestion, ISentUser } from '~/utils/types/sent.entities.types';
import UserCard from '~/components/UserCard.vue';

@Component({
  components: { UserCard, QuestionCard, AskQuestion },
})
export default class extends Vue {
  displayMode: 'answers' | 'followings' | 'followers' = 'answers';

  answersCompleted = false;

  followings: ISentUser[] = [];
  followingsPage = 0;

  followers: ISentUser[] = [];
  followersPage = 0;

  get user() {
    return this.$accessor.profile.user!;
  }

  get edit() {
    return this.$accessor.profile.editUser !== null;
  }

  get relationship() {
    return this.user.relationship!;
  }

  get canSendQuestion() {
    if (!this.user)
      return false;

    if (!this.$accessor.isLogged && !this.user.allowAnonymousQuestions)
      return false;

    if (this.relationship && this.relationship.hasBlocked)
      return false;

    return !this.$accessor.profile.isSelf;
  }

  get questionPlaceholder() {
    return this.$accessor.profile.user?.profileAskMeMessage ?? this.$t('write_question');
  }

  get formattedCreatedAtDate() {
    return fullDateText(new Date(this.$accessor.profile.user!.createdAt), this);
  }

  get fullFormattedCreatedAtDate() {
    return fullDateText(new Date(this.$accessor.profile.user!.createdAt), this, true);
  }

  get shareableProfileLink() {
    let u = this.localePath('/u/');
    if (!u.endsWith('/'))
      u += '/';

    return "https://twitter.com/intent/tweet?text=" +
      encodeURIComponent(this.$accessor.profile.user!.profileAskMeMessage) +
      "&url=" + encodeURIComponent(QUESTION_IT_FULL_URL + u + this.$accessor.profile.user!.slug) +
      "&via=QuestionItSpace";
  }

  numberFormat(number: number) {
    return numberFormat(number);
  }

  /* LOADERS */

  async loadAnswers($state: StateChanger) {
    if (!this.user || this.$accessor.profile.answers.items.length === 0 || this.answersCompleted) {
      this.answersCompleted = true;
      $state.complete();
      return;
    }

    try {
      const lastId = this.$accessor.profile.answers.items[this.$accessor.profile.answers.items.length - 1]?.id;
      // Get answers
      const newAnswers = await this.$axios.$get('question/answer/user/' + this.user!.id, { params: { untilId: lastId } }) as IPaginatedWithIdsResult<ISentQuestion>;

      if (newAnswers.items.length) {
        this.$accessor.profile.addAnswers({ answers: newAnswers.items, addToTop: false });
        $state.loaded();
      }
      else {
        this.answersCompleted = true;
        $state.complete();
        // no answers left.
      }
    } catch (e) {
      handleError(e, this);
      $state.error();
    }
  }

  async loadFollowings($state: StateChanger) {
    if (!this.user || !this.$accessor.profile.isSelf || this.followingsPage === -1) {
      this.followingsPage = -1;
      $state.complete();
      return;
    }

    try {
      const page = this.followingsPage;

      // Get answers
      const newFollowings = (
        await this.$axios.get('relationship/followings', { params: { page } })
      ).data as IPaginatedResult<ISentUser>;

      this.followingsPage++;

      if (newFollowings.items.length) {
        this.followings = [...this.followings, ...newFollowings.items];
        $state.loaded();
      }
      else {
        this.followingsPage = -1;
        $state.complete();
        return;
        // no followings left.
      }
    } catch (e) {
      handleError(e, this);
      $state.error();
    }
  }

  async loadFollowers($state: StateChanger) {
    if (!this.user || !this.$accessor.profile.isSelf || this.followersPage === -1) {
      this.followingsPage = -1;
      $state.complete();
      return;
    }

    try {
      const page = this.followersPage;

      // Get answers
      const newFollowers = (
        await this.$axios.get('relationship/followers', { params: { page } })
      ).data as IPaginatedResult<ISentUser>;

      this.followingsPage++;

      if (newFollowers.items.length) {
        this.followers = [...this.followers, ...newFollowers.items];
        $state.loaded();
      }
      else {
        this.followersPage = -1;
        $state.complete();
        return;
        // no followers left.
      }
    } catch (e) {
      handleError(e, this);
      $state.error();
    }
  }

  /* ACTIONS */

  onUserCardFollowersUnfollow(target: ISentUser) {
    // Decrement
    this.$accessor.profile.decrementFollowingsCount();

    // If user is in the followings array, remove him
    this.followings = this.followings.filter(e => e.id !== target.id);
  }

  onUserCardFollowingsUnfollow() {
    // Decrement
    this.$accessor.profile.decrementFollowingsCount();

    // Do not touch the user: we don't want to remove it
  }

  onUserCardFollowersFollow(target: ISentUser) {
    // Increment
    this.$accessor.profile.incrementFollowingsCount();

    // If user is not in the followings array, add him
    if (!this.followings.some(e => e.id === target.id)) {
      this.followings = [target, ...this.followings];
    }
  }

  onUserCardFollowingsFollow() {
    // Increment
    this.$accessor.profile.incrementFollowingsCount();

    // Do not touch the users: if user has successfully followed him,
    // he is in the followings array
  }
}
</script>

<style lang="scss" scoped>
.no-results {
  margin-top: 3rem;
  text-align: center;
  font-size: 1.2rem;
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

  .infos.unlogged {
    padding-top: .5rem;
  }
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

.pinned-divider {
  margin: 1rem 0;
}

.pinned-question-box {
  margin-top: 1rem;
  margin-bottom: 1rem;
}
</style>
