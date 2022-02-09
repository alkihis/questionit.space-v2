import { Vue, Component, Prop } from 'nuxt-property-decorator';
import BulmaModal from '~/components/BulmaModal/BulmaModal';
import { handleError, isAxiosError, convertAxiosError } from '~/utils/helpers';
import ApplicationCard from '~/components/ApplicationCard/ApplicationCard';
import { allowedPermissions, ISentApplication } from "~/utils/types/sent.entities.types";

@Component({
  components: {
    BulmaModal: BulmaModal,
    ApplicationCard: ApplicationCard,
  },
  middleware: 'logged',
  layout: 'default_solid',
  async asyncData({ app }) {
    try {
      const apps = await app.$axios.$get('apps');

      return { apps };
    } catch (e) {
      if (isAxiosError(e)) {
        e = convertAxiosError(e);
      }
      return { error: e };
    }
  },
})
export default class extends Vue {
  @Prop({ required: true })
  app!: ISentApplication;

  @Prop({ required: true })
  mode!: 'create' | 'edit';

  load = false;

  get name() {
    return this.app.name;
  }

  set name(name: string) {
    this.app.name = name;
  }

  get url() {
    return this.app.url;
  }

  set url(url: string) {
    this.app.url = url;
  }

  get permissions() {
    return allowedPermissions;
  }

  getPermissionValue(permission: string) {
    return this.app.rights[permission] ?? false;
  }

  setPermissionValue(event: InputEvent, permission: string) {
    const el = event.target as HTMLInputElement;
    this.app.rights[permission] = el.checked;
  }

  isNameValid() {
    return this.app.name.length <= 32;
  }

  isUrlValid() {
    if (this.app.url) {
      try {
        new URL(this.app.url);
      } catch (e) {
        return false;
      }
    }

    return this.app.url.length <= 255;
  }

  cancel() {
    if (this.load)
      return;

    this.$emit('close');
  }

  async editApplication() {
    if (this.load)
      return;

    if (this.app.name.length < 2) {
      this.$toast.error(this.$t('name_cant_be_empty'));
      return;
    }

    this.load = true;

    try {
      const current = this.app;
      const dto: any = { ...current.rights };
      if (this.mode === 'edit') {
        dto.id = current.id;
      }

      dto.name = current.name;
      dto.url = current.url;

      const method = this.mode === 'create' ? this.$axios.$post : this.$axios.$put;
      const modified_app = await method.call(this.$axios, 'apps', dto) as ISentApplication;

      if (this.mode === 'create') {
        this.$emit('created', modified_app);
        this.$toast.success(this.$t('application_create_success'));
      }
      else {
        this.$emit('edited', modified_app);
        this.$toast.success(this.$t('application_edit_success'));
      }
    } catch (e) {
      handleError(e, this);
    }

    this.load = false;
  }
}
