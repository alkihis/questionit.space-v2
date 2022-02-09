<template>
  <div>
    <question-conversation
      v-if="question"
      :question="question"
      :ancestors="ancestors"
      :replies="replies"
      :has_more="has_more"
      :has_more_replies="has_more_replies"
      :allowReplies="allowReplies"
      :allowPin="allowPin"
      :pinned="pinned"
      @close="close()"
      @question-change="changeView($event)"
      @destroy="$emit('destroy', $event)"
      @like="$emit('like', $event)"
      @pin="$emit('pin', $event)"
    />
      <!-- Todo Better error handling. -->
    <bulma-modal v-else-if="error" :open="true" @close="close()">
      <div class="box is-align-center">
        {{ formatError() }}
      </div>
    </bulma-modal>
  </div>
</template>

<script lang="ts">
import { Component, Vue, Prop } from 'nuxt-property-decorator';
import BulmaModal from '~/components/BulmaModal/BulmaModal';
import QuestionCard from '~/components/QuestionCard/QuestionCard.vue';
import QuestionAncestor from '~/components/QuestionAncestor/QuestionAncestor';
import QuestionConversation from '~/components/QuestionConversation/QuestionConversation.vue';
import { isAxiosError, convertAxiosError, makeTitle, fullDateText, randomAnonymousImage, QUESTION_IT_FULL_URL } from '~/utils/helpers';
import { ISentQuestion } from "~/utils/types/sent.entities.types";

const LOAD_SIZE = 10;

@Component({
  components: {
    BulmaModal: BulmaModal,
    QuestionCard: QuestionCard,
    QuestionAncestor: QuestionAncestor,
    QuestionConversation: QuestionConversation,
  },
  scrollToTop: false,
  async asyncData({ route, app, redirect }) {
    const params = route.params; // { slug: 'Alkihis', question: '8' }

    if (!route.params.question) {
      return;
    }

    try {
      const questionid = Number(params.question);

      if (isNaN(questionid) || questionid < 0) {
        throw new Error("Invalid question id");
      }

      const slug = route.params.slug;

      const question_ancestors = app.$axios.get('questions/tree/' + questionid, { params: { size: LOAD_SIZE } });
      const reply_res = app.$axios.get('questions/replies/' + questionid, { params: { size: LOAD_SIZE } });

      // Await requests
      await Promise.all([question_ancestors, reply_res]);

      const {
        question,
        ancestors
      } = (await question_ancestors).data as { question: ISentQuestion, ancestors: ISentQuestion[] };

      if (slug.match(/^[0-9]+$/)) {
        if (String(question.receiver.id) !== slug) {
          // bad id
          return redirect(app.localePath('/u/' + question.receiver.slug + '/' + question.id));
        }
      }
      else if (question.receiver.slug.toLowerCase() !== slug.toLowerCase()) {
        return redirect(app.localePath('/u/' + question.receiver.slug + '/' + question.id));
      }

      const replies = (await reply_res).data as ISentQuestion[];

      return {
        question,
        ancestors,
        replies,
        has_more: ancestors.length >= LOAD_SIZE,
        has_more_replies: replies.length >= LOAD_SIZE,
      };
    } catch (error) {
      if (isAxiosError(error)) {
        error = convertAxiosError(error);
      }
      return { error, question: undefined };
    }
  },
})
export default class extends Vue {
  question: ISentQuestion | undefined;
  ancestors!: ISentQuestion[];
  replies!: ISentQuestion[];
  error?: any;

  has_more!: boolean;
  has_more_replies!: boolean;

  @Prop({ default: true })
  allowReplies?: boolean;

  @Prop({ default: false })
  allowPin!: boolean;

  @Prop({ default: false })
  pinned!: boolean;

  head() {
    if (!this.question) {
      return {};
    }

    const user = this.question.receiver;
    const question = this.question;
    const dscr = `${
      this.$t('someone_asked', { name: question.owner?.name ?? this.$t('anonymous') })
    } ${question.content} — ${question.answer} (${fullDateText(new Date(question.createdAt), this, true, true)})`;
    const url = QUESTION_IT_FULL_URL + '/u/' + user.slug + '/' + question.id;
    const title = makeTitle(user.name);

    const pp = user.profilePictureUrl ?? (QUESTION_IT_FULL_URL + randomAnonymousImage(question.id));

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

  close() {
    this.$router.push(this.localePath('/u/' + this.$nuxt.$route.params.slug));
  }

  changeView(item: ISentQuestion) {
    this.$router.push(this.localePath('/u/' + item.receiver.slug + '/' + item.id));
  }

  formatError() {
    // todo independant component!
    if (this.error?.response?.status === 404) {
      return this.$t('question_not_found');
    }
    return this.$t('unknown_error');
  }
}
</script>

<style lang="scss" scoped>
.box.loading-box {
  padding: 24px;
}
</style>
