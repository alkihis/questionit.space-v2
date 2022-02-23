import { Vue, Component, Prop } from 'nuxt-property-decorator';
import BulmaModal from '../BulmaModal.vue';
import Badge from '~/components/Badge/Badge';
import { cancelPushSubscription, getPushSubscription, handleError } from '~/utils/helpers';
import { ISentUser } from "~/utils/types/sent.entities.types";

@Component({
  components: {
    BulmaModal: BulmaModal,
    Badge,
  }
})
export default class extends Vue {
  @Prop({ default: false })
  open!: boolean;

  counts: { [userId: string]: number } = {};
  count_inited = false;
  last_download?: Date;

  will_all_delete = false;
  will_delete: false | ISentUser = false;
  all_delete_loading = false;
  switch_loading = false;
  count_loading = false;

  get users() {
    return this.$accessor.availableUsers;
  }

  isSelf(user: ISentUser) {
    return this.$accessor.loggedUser?.id === user.id;
  }

  willUnlogSomeone(evt: Event, user: ISentUser) {
    evt.preventDefault();
    evt.stopImmediatePropagation();

    this.will_delete = user;
  }

  cancelUnlog() {
    if (this.all_delete_loading)
      return;

    this.will_delete = false;
    this.will_all_delete = false;
  }

  willUnlogEveryone() {
    this.will_all_delete = true;
  }

  async switchUser(user: ISentUser) {
    this.switch_loading = true;

    // Switch push notification holder
    const current = await getPushSubscription();

    if (current) {
      const couples = this.$accessor.userTokenCouples;
      const couple = couples.find(e => e[0].id === user.id);

      if (!couple) {
        console.error("No user matching targeted user");
        return;
      }

      try {
        await this.$axios.post('push/update', { endpoint: current.endpoint, target: user.id, token: couple[1] });

        // console.log("Push notification changed from", this.$accessor.logged_user, "to", user);
      } catch (e) {
        handleError(e, this);
        return;
      } finally {
        this.switch_loading = false;
      }
    }
    else {
      this.switch_loading = false;
    }

    this.$accessor.switchUser(user);
    // Refresh cookie
    this.$cookies.set('current_token', this.$accessor.token, { path: '/', expires: new Date('2099-12-31') });
    this.$axios.setToken(this.$accessor.token ?? false, 'Bearer');
    this.$router.push(this.localePath('/s'));
    this.$toast.success(this.$t('switched_to_name', { name: user.name }));
    this.$emit('close');
  }

  unlogSomeone() {
    const user = this.will_delete;
    if (!user || this.isSelf(user)) {
      // Can't unlog self
      return;
    }

    const couple = this.$accessor.userTokenCouples.find(u => u[0].id === user.id);

    if (couple) {
      this.$axios.delete('auth/token', { headers: { 'Authorization': 'Bearer ' + couple[1] } })
        .catch(e => {
          console.error("Unable to revoke token", e);
        });
    }

    this.$accessor.removeUser(user);

    // Refresh the cookies
    this.$cookies.set('token', this.$accessor.tokenString, { path: '/', expires: new Date("2099-01-01") });

    this.$toast.success(this.$t('success_unlog_name', { name: user.name }));
    this.will_delete = false;
  }

  async refreshCounts() {
    const now = Date.now();

    if (this.last_download) {
      const actual = this.last_download.getTime();

      // Last refresh : less than 1 minute
      if (now < (actual + (1000 * 60))) {
        return;
      }
    }

    this.count_loading = true;

    try {
      const accounts = this.$accessor.userTokenCouples.filter(e => !this.isSelf(e[0]));

      const results = await Promise.all(
        accounts.map(a => this.$axios.$get('notification/count', { headers: { Authorization: 'Bearer ' + a[1] } }))
      ) as { questions: number; notifications: number; }[];

      this.counts = {};
      for (let i = 0; i < results.length; i++) {
        const res = results[i];
        const [user, ] = accounts[i];

        this.counts[user.id] = res.notifications;
      }

      this.last_download = new Date;
    } catch (e) {}

    this.count_loading = false;
  }

  addUser() {
    this.$router.push(this.localePath('/login'));
    this.$emit('close');
  }

  async logoutAll() {
    // Cancel subscription
    this.all_delete_loading = true;
    try {
      await cancelPushSubscription();
    } catch (e) { }
    this.all_delete_loading = false;
    this.$router.push(this.localePath('/logout'));
    this.$emit('close');
    this.will_all_delete = false;
  }

  close() {
    if (this.switch_loading)
      return;

    this.count_inited = false;
    this.$emit('close');
  }

  updated() {
    if (this.open && !this.count_inited) {
      this.count_inited = true;
      this.refreshCounts();
    }
  }
}
