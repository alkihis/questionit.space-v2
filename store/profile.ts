import { getterTree, mutationTree, actionTree } from 'typed-vuex';
import type { ISentRelationship, ISentUser } from '~/utils/types/sent.entities.types';
import { IPaginatedWithIdsResult, ISentQuestion } from '~/utils/types/sent.entities.types';

interface IProfileState {
  user: ISentUser | null;
  answers: IPaginatedWithIdsResult<ISentQuestion>;
  hasAcceptedToShow: boolean;
  editUser: ISentUser | null;
}

export const state: () => IProfileState = () => ({
  user: null,
  answers: { items: [] },
  hasAcceptedToShow: false,
  editUser: null,
});

export const getters = getterTree(state, {
  relationship: state => state.user!.relationship! as ISentRelationship,
  canShowProfile: state => !state.user!.relationship!.hasBlocked || state.hasAcceptedToShow,
  canShowQuestions: state => (!state.user!.relationship!.hasBlocked || state.hasAcceptedToShow) && !state.user!.relationship!.isBlockedBy,
  isSelf: (state, _, rootState) => rootState.loggedUser && rootState.loggedUser.id === state.user?.id,
});

export const mutations = mutationTree(state, {
  reset(state) {
    state.user = null;
    state.answers = { items: [] };
    state.hasAcceptedToShow = false;
    state.editUser = null;
  },
  setUser(state, user: ISentUser | null) {
    state.user = user;
  },
  setAnswers(state, answers: IPaginatedWithIdsResult<ISentQuestion>) {
    state.answers = answers;
  },
  addAnswers(state, { answers, addToTop }: { answers: ISentQuestion[], addToTop: boolean }) {
    if (addToTop) {
      state.answers.items = [...answers, ...state.answers.items];
      state.answers.nextSinceId = answers[0]?.id ?? state.answers.nextSinceId;
    } else {
      state.answers.items = [...state.answers.items, ...answers];
      state.answers.nextUntilId = answers[answers.length - 1]?.id ?? state.answers.nextUntilId;
    }
  },
  updateRelationshipAfterBlock(state) {
    const relationship = state.user?.relationship;
    // Refresh relationship
    if (state.user && relationship) {
      relationship.hasBlocked = true;

      // On le suit
      if (relationship.following) {
        state.user.counts!.followers!--;
      }
      // Il nous suit
      if (relationship.followedBy) {
        state.user.counts!.followings!--;
      }

      relationship.following = false;
      relationship.followedBy = false;
    }

    state.hasAcceptedToShow = false;
  },
  updateRelationshipAfterUnblock(state) {
    const relationship = state.user?.relationship;
    // Refresh relationship
    if (state.user && relationship) {
      relationship.hasBlocked = false;
    }

    state.hasAcceptedToShow = false;
  },
  acceptToShow(state) {
    state.hasAcceptedToShow = true;
  },
  startEdition(state) {
    state.editUser = { ...state.user! };
  },
  cancelEdition(state) {
    state.editUser = null;
  },
  likeQuestion(state, question: ISentQuestion) {
    const found = state.answers.items.findIndex(q => q.id === question.id);

    if (found !== -1 && !state.answers.items[found].answer!.liked) {
      state.answers.items[found].answer!.liked = true;
      state.answers.items[found].answer!.likeCount++;
    }
  },
  dislikeQuestion(state, question: ISentQuestion) {
    const found = state.answers.items.findIndex(q => q.id === question.id);

    if (found !== -1 && state.answers.items[found].answer!.liked) {
      state.answers.items[found].answer!.liked = false;
      state.answers.items[found].answer!.likeCount--;
    }
  },
  deleteQuestion(state, question: ISentQuestion) {
    state.answers.items = state.answers.items.filter(e => e.id !== question.id) ?? [];

    // If deleted question is pinned question
    if (state.user?.pinnedQuestion && state.user.pinnedQuestion.id === question.id) {
      state.user.pinnedQuestion = undefined;
    }

    if (state.user?.counts?.answers) {
      state.user.counts.answers--;
    }
  },
  onProfilePictureRefresh(state, modified: ISentUser) {
    state.user!.profilePictureUrl = modified.profilePictureUrl;
    state.user!.bannerPictureUrl = modified.bannerPictureUrl;

    if (state.editUser) {
      state.editUser.profilePictureUrl = modified.profilePictureUrl;
      state.editUser.bannerPictureUrl = modified.bannerPictureUrl;
    }
  },
});

export const actions = actionTree(
  { state, getters, mutations },
  {

  }
);
