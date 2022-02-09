import { Component, Prop, Vue } from "nuxt-property-decorator";
import { allowedPermissions, ISentApplication, ISentRegistredApplication } from "~/utils/types/sent.entities.types";

@Component({})
export default class extends Vue {
  @Prop({ required: true })
  app!: ISentRegistredApplication | ISentApplication;

  @Prop({ type: Boolean, default: false })
  mine!: boolean;

  small = true;

  toggle() {
    this.small = !this.small;
  }

  get right_count() {
    return Object.values(this.app.rights).filter(value => value).length + 1;
  }

  get permissions() {
    return allowedPermissions
      .filter(option => this.app.rights[option])
      .map(option => [option, this.$t('end_user_permissions.' + option)]);
  }

  get dev_permissions() {
    return allowedPermissions
      .filter(option => this.app.rights[option])
      .map(option => [option, this.$t('developer_user_permissions.' + option)]);
  }
}
