import { Vue, Component, Prop } from 'nuxt-property-decorator';
import { fullDateText, numberFormat, handleError } from '~/utils/helpers';
import { ISentUser } from "~/utils/types/sent.entities.types";

@Component({
  components: {}
})
export default class extends Vue {
  @Prop({ required: true })
  user!: ISentUser;

  follow_running = false;

  get profile_link() {
    return this.localePath('/u/' + this.user.slug);
  }

  get username() {
    return this.user.name;
  }

  get slug() {
    return this.user.slug;
  }

  get relationship() {
    return this.user.relationship ?? null;
  }

  get followers_text() {
    return this.$t('followers_s', { s: (this.user.counts?.followers ?? 0) > 1 ? 's' : '' });
  }

  get followers_number() {
    const n = this.user.counts?.followers ?? 0;

    if (n) {
      return numberFormat(n);
    }
    return this.$t('none').toString().toLowerCase();
  }

  get followings_number() {
    const n = this.user.counts?.followings ?? 0;

    if (n) {
      return numberFormat(n);
    }
    return this.$t('none');
  }

  get followings_text() {
    return this.$t('followings_s', { s: (this.user.counts?.followings ?? 0) > 1 ? 's' : '' });
  }

  get profile_picture() {
    return this.user.profilePictureUrl;
  }

  get its_you_text() {
    if (this.$accessor.isLogged && this.$accessor.loggedUser!.id === this.user.id) {
      return '(' + this.$t('its_you') + ')';
    }
    return '';
  }

  get created_at() {
    return fullDateText(new Date(this.user.createdAt), this);
  }

  async follow() {
    if (this.follow_running)
      return;

    this.follow_running = true;
    try {
      await this.$axios.post('relationships/' + this.user.id);

      this.$toast.success(this.$t('followed_user', { name: this.user.name }));
      this.$emit('follow', this.user);

      if (this.user.relationship)
        this.user.relationship.following = true;
    } catch (e) {
      handleError(e, this);
    }
    this.follow_running = false;
  }

  async unfollow() {
    if (this.follow_running)
      return;

    this.follow_running = true;
    try {
      await this.$axios.delete('relationships/' + this.user.id);

      this.$toast.success(this.$t('unfollowed_user', { name: this.user.name }));
      this.$emit('unfollow', this.user);

      if (this.user.relationship)
        this.user.relationship.following = false;
    } catch (e) {
      handleError(e, this);
    }
    this.follow_running = false;
  }
}
