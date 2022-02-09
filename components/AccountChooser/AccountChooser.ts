import { Vue, Component, Prop } from 'nuxt-property-decorator';
import { randomAnonymousImage } from '~/utils/helpers';
import Dropdown from '../Dropdown/Dropdown';
import { ISentUser } from "~/utils/types/sent.entities.types";

const LAST_USED_ANONYMOUS_KEY = '_last_used_account';


@Component({
  components: {
    Dropdown: Dropdown
  }
})
export default class extends Vue {
  @Prop({ default: true })
  allowAnonymous!: boolean;

  selected: ISentUser | null = null;

  get is_locked() {
    return !this.$accessor.isLogged;
  }

  get disabled() {
    return this.available.length === 0;
  }

  get available() {
    if (!this.$accessor.isLogged) {
      if (this.allowAnonymous)
        return [null];
      return [];
    }
    else {
      if (this.allowAnonymous)
        return [...this.$accessor.availableUsers, null];
      return this.$accessor.availableUsers;
    }
  }

  get selected_pp() {
    return this.imageFor(this.selected);
  }

  get selected_alt() {
    return this.nameFor(this.selected);
  }

  nameFor(user: ISentUser | null) {
    return user?.name ?? this.$t('anonymous');
  }

  imageFor(user: ISentUser | null) {
    return user?.profilePictureUrl ?? randomAnonymousImage('1');;
  }

  /**
   * Return the selected user.
   */
  getSelected() {
    return this.selected;
  }

  onSelectChange(item: ISentUser | null) {
    localStorage.setItem(LAST_USED_ANONYMOUS_KEY, String(item === null));
    this.selected = item;
  }

  mounted() {
    if (this.$accessor.isLogged) {
      // Check if last time is anon
      if (localStorage.getItem(LAST_USED_ANONYMOUS_KEY) !== 'true') {
        this.selected = this.$accessor.loggedUser!;
      }

      if (!this.allowAnonymous) {
        this.selected = this.available.find(e => e && e.id === this.$accessor.loggedUser!.id) ?? this.available[0];
      }
    }
  }
}

