import { getterTree, mutationTree, actionTree } from 'typed-vuex';
import type { ISentRelationship, ISentUser } from '~/utils/types/sent.entities.types';
import { IPaginatedWithIdsResult, ISentQuestion } from '~/utils/types/sent.entities.types';
import { handleError } from '~/utils/helpers';
import { SLUG_REGEX } from '~/pages/u/_slug/index.vue';

interface IProfileState {
  user: ISentUser | null;
  answers: IPaginatedWithIdsResult<ISentQuestion>;
  hasAcceptedToShow: boolean;
  editUser: ISentUser | null;
  editionLoad: boolean;
  newPP: File | null;
  newBanner: File | null;
  slugEditionStatus: 'invalid' | 'available' | 'taken' | null;
  slugLoadTimeout: number;
}

export const state: () => IProfileState = () => ({
  user: null,
  answers: { items: [] },
  hasAcceptedToShow: false,
  editUser: null,
  editionLoad: false,
  newPP: null,
  newBanner: null,
  slugEditionStatus: null,
  slugLoadTimeout: 0,
});

export const getters = getterTree(state, {
  relationship: state => state.user!.relationship! as ISentRelationship,
  canShowProfile: state => !state.user!.relationship!.hasBlocked || state.hasAcceptedToShow,
  canShowQuestions: state => (!state.user!.relationship!.hasBlocked || state.hasAcceptedToShow) && !state.user!.relationship!.isBlockedBy,
  isSelf: (state, _, rootState) => rootState.loggedUser && rootState.loggedUser.id === state.user?.id,
  twitterLink: state => 'https://twitter.com/i/user/' + state.user!.twitterId,
});

export const mutations = mutationTree(state, {
  reset(state) {
    state.user = null;
    state.answers = { items: [] };
    state.hasAcceptedToShow = false;
    state.editUser = null;
    state.editionLoad = false;
    state.newPP = null;
    state.newBanner = null;
    state.slugEditionStatus = null;
    state.slugLoadTimeout = 0;
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
    state.editionLoad = false;
  },
  cancelEdition(state) {
    if (state.editUser) {
      // Revoke urls
      if (state.editUser.profilePictureUrl?.startsWith('blob:')) {
        URL.revokeObjectURL(state.editUser.profilePictureUrl);
      }
      if (state.editUser.bannerPictureUrl?.startsWith('blob:')) {
        URL.revokeObjectURL(state.editUser.bannerPictureUrl);
      }
    }

    state.editUser = null;
    state.editionLoad = false;
    state.newBanner = null;
    state.newPP = null;

    clearTimeout(state.slugLoadTimeout);
    state.slugLoadTimeout = 0;
    state.slugEditionStatus = null;
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
      // Revoke urls
      if (state.editUser.profilePictureUrl?.startsWith('blob:')) {
        URL.revokeObjectURL(state.editUser.profilePictureUrl);
      }
      if (state.editUser.bannerPictureUrl?.startsWith('blob:')) {
        URL.revokeObjectURL(state.editUser.bannerPictureUrl);
      }

      state.editUser.profilePictureUrl = modified.profilePictureUrl;
      state.editUser.bannerPictureUrl = modified.bannerPictureUrl;
      state.newPP = null;
      state.newBanner = null;
    }
  },
  onPPInputChange(state, file: File | null) {
    state.newPP = file;
  },
  onBannerInputChange(state, file: File | null) {
    state.newBanner = file;
  },
  onPPCropEnd(state, file: File) {
    if (state.editUser) {
      state.editUser.profilePictureUrl = URL.createObjectURL(file);
    }
  },
  onBannerCropEnd(state, file: File) {
    if (state.editUser) {
      state.editUser.bannerPictureUrl = URL.createObjectURL(file);
    }
  },
  onEditLoadStateChange(state, isLoading: boolean) {
    state.editionLoad = isLoading;
  },
  setSlugEditionStatus(state, status: 'invalid' | 'available' | 'taken' | null) {
    state.slugEditionStatus = status;
  },
  setSlugLoadTimeout(state, timeout: number) {
    state.slugLoadTimeout = timeout;
  },
  changeEditUserProperty(state, partialUser: Partial<ISentUser>) {
    if (!state.editUser) {
      return;
    }

    state.editUser = { ...state.editUser, ...partialUser };
  },
  incrementFollowingsCount(state) {
    state.user!.counts!.followings++;
  },
  decrementFollowingsCount(state) {
    state.user!.counts!.followings--;
  },
  incrementFollowersCount(state) {
    state.user!.counts!.followers++;
  },
  decrementFollowersCount(state) {
    state.user!.counts!.followers--;
  },
});

export const actions = actionTree(
  { state, getters, mutations },
  {
    setEditionSlug({ state, commit }, slug: string) {
      commit('changeEditUserProperty', { slug });

      clearTimeout(state.slugLoadTimeout);
      commit('setSlugLoadTimeout', 0);

      if (!slug.match(SLUG_REGEX)) {
        commit('setSlugEditionStatus', 'invalid');
        return;
      }
      if (slug.toLocaleLowerCase() === state.user!.slug.toLocaleLowerCase()) {
        commit('setSlugEditionStatus', null);
        return;
      }

      const timeout = setTimeout(async () => {
        commit('setSlugLoadTimeout', 0);

        try {
          const available = (await this.$axios.get('user/check-available-slug', { params: { slug } })).data as { available: boolean };

          commit('setSlugEditionStatus', available.available ? 'available' : 'taken');
        } catch (e) {
          handleError(e, this);
        }
      }, 350);

      commit('setSlugLoadTimeout', timeout as any as number);
    },
  },
);
