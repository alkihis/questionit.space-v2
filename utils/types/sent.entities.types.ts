// - Generic -

export interface IPaginatedResult<T> {
  items: T[];
  nextPage?: number;
  previousPage?: number;
  page: number;
  count: number;
}

export interface IPaginatedWithIdsResult<T> {
  items: T[];
  nextSinceId?: number;
  nextUntilId?: number;
}

// - User -

export interface ISentUser {
  id: number;
  name: string;
  slug: string;
  twitterId: string;
  profileAskMeMessage: string;
  createdAt: string;
  profilePictureUrl: string | null;
  bannerPictureUrl: string | null;
  allowAnonymousQuestions: boolean;

  // Advanced infos
  relationship?: ISentRelationship;
  pinnedQuestion?: ISentQuestion | null;
  counts?: ISentUserCounts;
  // Limited to self
  sendQuestionsToTwitterByDefault?: boolean | null;
  visible?: boolean;
  allowQuestionOfTheDay?: boolean | null;
  dropQuestionsOnBlockedWord?: boolean;
  safeMode?: boolean;
  useRocketEmojiInQuestions?: boolean;
}

export interface ISentUserCounts {
  answers: number;
  followers: number;
  followings: number;
}

// - Tokens -

export interface ISentToken {
  jti: string;
  createdAt: string;
  lastUsedAt: string;
  createdWithIp: string;
  current?: boolean;
}

// - Relationships -

export interface ISentRelationship {
  following: boolean;
  followedBy: boolean;
  hasBlocked: boolean;
  isBlockedBy: boolean;
}

// - Applications -

export interface ISentApplication extends ISentRegistredApplication {
  key: string;
}

export const allowedPermissions = [
  'sendQuestion', 'answerQuestion', 'likeQuestion',
  'followUser', 'blockUser', 'readTimeline', 'deleteQuestion', 'readNotification',
  'deleteNotification', 'readWaitingQuestion', 'pinQuestion', 'readRelationship',
  'manageBlockedWords',
] as const;

export interface ISentRegistredApplication {
  name: string;
  id: number;
  url: string;
  rights: { [rightName: string]: boolean };
}

export type TPossibleRight = 'sendQuestion' | 'answerQuestion' | 'likeQuestion'
  | 'followUser' | 'blockUser' | 'readTimeline' | 'deleteQuestion' | 'readNotification'
  | 'deleteNotification' | 'readWaitingQuestion' | 'pinQuestion' | 'readRelationship'
  | 'manageBlockedWords';

export type TRightsObject = {
  [K in TPossibleRight]: boolean;
};

// - Questions -

export interface ISentQuestion {
  id: number;
  // null if owner made question in anonymous mode
  owner: ISentUser | null;
  receiver: ISentUser;
  createdAt: string;
  content: string;
  seen: boolean | null;
  answer: ISentAnswer | null;
  inReplyToQuestionId: string | null;
  questionOfTheDay: boolean;
  replyCount: number;
  attachements?: SentQuestionAttachements;
}

export interface ISentAnswer {
  id: number;
  content: string;
  createdAt: string;
  liked: boolean;
  likeCount: number;
  attachment?: ISentAnswerAttachment;
}

export interface ISentAnswerAttachment {
  url: string;
  type: 'image' | 'gif';
}

export interface SentQuestionAttachements {
  poll?: ISentPoll;
}

export interface ISentPoll {
  id: number;
  options: string[];
}

export interface ISentQuestionTree {
  length: number;
  question: ISentQuestion;
  ancestors: ISentQuestion[];
}

export interface IUnusedSentPoll {
  id: number;
  expiration: number;
}

// - Notifications -

export enum ENotificationType {
  Answered = 'answered',
  Question = 'question',
  Follow = 'follow',
  FollowBack = 'follow-back',
}

export interface ISentNotification {
  id: number;
  createdAt: string;
  seen: boolean;
  type: ENotificationType,
  /** Defined if {type} is 'answered' or 'question' */
  question?: ISentQuestion,
  // Si follow: {type} is 'follow' or 'follow-back'.
  user?: ISentUser;
}

export interface INotificationCounts {
  questions: number;
  notifications: number;
}

export type TNotificationContentPayload = INotificationNewFollowerContentPayload | INotificationNewQuestionContentPayload;

export interface INotificationNewFollowerContentPayload {
  id: number;
  user: ISentUser;
}

export interface INotificationNewQuestionContentPayload {
  id: number;
  question: ISentQuestion;
}
