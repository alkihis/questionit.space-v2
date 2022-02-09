import { Component, Vue, Prop } from 'nuxt-property-decorator';
import { dateText, fullDateText, randomAnonymousImage, handleError } from '~/utils/helpers';
import { ISentNotification } from "~/utils/types/sent.entities.types";

@Component({
  components: {},
})
export default class extends Vue {
  @Prop({ required: true })
  notification!: ISentNotification;

  @Prop({ default: false })
  deleted!: boolean;

  get date() {
    return dateText(new Date(this.notification.createdAt), this);
  }

  get full_date() {
    return fullDateText(new Date(this.notification.createdAt), this, false, true);
  }

  get name() {
    if (this.notification.question) {
      switch (this.notification.type) {
        // Question répondue: On affiche le nom du receveur
        case 'answered':
          return this.notification.question!.receiver.name;
        // Nouvelle question: On affiche le nom de l'émetteur
        case 'question':
          return this.notification.question!.owner?.name ?? this.$t('anonymous').toString();
      }
    }
    if (this.notification.user) {
      return this.notification.user.name;
    }
    return this.$t('unknown');
  }

  get slug() {
    if (this.notification.question) {
      switch (this.notification.type) {
        // Question répondue: On affiche le nom du receveur
        case 'answered':
          return this.notification.question.receiver.slug;
        // Nouvelle question: On affiche le nom de l'émetteur
        case 'question':
          return this.notification.question.owner?.slug ?? this.$t('anonymous').toString();
      }
    }
    if (this.notification.user) {
      return this.notification.user.slug;
    }
    return this.$t('unknown');
  }

  get link() {
    if (this.notification.question) {
      switch (this.notification.type) {
        // Question répondue: Lien vers la question
        case 'answered':
          return this.localePath('/u/' + this.notification.question.receiver.slug + '/' + this.notification.question.id);
        // Nouvelle question: Lien vers waiting
        case 'question':
          return this.localePath('/waiting');
      }
    }
    if (this.notification.user) {
      return this.localePath('/u/' + this.notification.user.slug);
    }
    return '#!';
  }

  get can_follow_back() {
    return this.notification.type === 'follow' && this.notification.user?.relationship?.following === false;
  }

  get has_followed_back() {
    return this.notification.user?.relationship?.following;
  }

  get profile_link() {
    if (this.notification.question) {
      switch (this.notification.type) {
        // Question répondue: Lien vers le profil du receveur
        case 'answered':
          return this.localePath('/u/' + this.notification.question.receiver.slug);
        // Nouvelle question: Lien vers le profil du
        case 'question': {
          if (!this.notification.question.owner) {
            return '';
          }
          return this.localePath('/u/' + this.notification.question.owner.slug);
        }
      }
    }
    if (this.notification.user) {
      return this.localePath('/u/' + this.notification.user.slug);
    }
    return '';
  }

  get is_valid() {
    return !!this.notification.question || !!this.notification.user;
  }

  get safe_profile_img() {
    if (this.notification.question) {
      switch (this.notification.type) {
        // Question répondue: Image du receveur
        case 'answered':
          return this.notification.question.receiver.profilePictureUrl;
        // Nouvelle question: Image du sender
        case 'question':
          return this.notification.question.owner?.profilePictureUrl;
      }
    }
    if (this.notification.user) {
      return this.notification.user.profilePictureUrl;
    }
  }

  get profile_img() {
    return this.safe_profile_img ?? randomAnonymousImage(this.notification.question?.id ?? 1);
  }

  get content() {
    switch (this.notification.type) {
      // Question répondue: On affiche le contenu de la quest
      case 'answered':
        return this.$t('someone_has_replied_to_your_question', { name: this.name });
      case 'question':
        return this.$t('someone_ask_you_a_question', { name: this.name });
      case 'follow':
        return this.$t('someone_followed_you', { name: this.name });
      case 'follow-back':
        return this.$t('someone_followed_you_back', { name: this.name });
    }
  }

  navigateToLink(e: MouseEvent) {
    if (this.is_valid) {
      // Check if tree does not contains data-stopper="true"
      let can_go = true;
      let current: HTMLElement | null = e.target as HTMLElement;

      while (current) {
        if ('hasAttribute' in current && current.hasAttribute('data-stopper')) {
          can_go = false;
          break;
        }

        current = current.parentElement;
      }

      if (can_go)
        this.$router.push(this.link);
    }
  }

  async followBack() {
    if (this.has_followed_back || this.notification.type !== 'follow' || !this.notification.user)
      return;

    this.notification.user.relationship!.following = true;

    try {
      await this.$axios.post('relationships/' + this.notification.user.id);
      this.$toast.success(this.$t('followed_user', { name: this.notification.user.name }));
    } catch (e) {
      handleError(e, this);
      this.notification.user.relationship!.following = false;
    }
  }
}
