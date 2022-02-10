<template>
  <bulma-modal v-if="app" :open="true" :card="true" @close="cancel">
    <header class="modal-card-head">
      <p v-if="mode === 'edit'" class="modal-card-title">{{ $t('edit_app') }}</p>
      <p v-else class="modal-card-title">{{ $t('create_an_app') }}</p>

      <button class="delete" aria-label="close" @click="cancel"></button>
    </header>

    <section class="modal-card-body">
      <!-- Content -->
      <p class="before-fields">
        {{ $t('personalize_your_application_here') }}
      </p>

      <!-- App name -->
      <div class="field">
        <label class="label">{{ $t('application_name') }}</label>

        <div class="control has-icons-left">
          <input
            :class="{ input: true, 'is-danger': !isNameValid() }"
            type="text"
            :placeholder="$t('app_name_here')"
            v-model="name"
            :disabled="load"
          >
          <span class="icon is-small is-left">
            <i class="fas fa-signature"></i>
          </span>
        </div>
      </div>

      <!-- App URL -->
      <div class="field">
        <label class="label">{{ $t('application_url') }}</label>

        <div class="control has-icons-left">
          <input
            :class="{ input: true, 'is-danger': !isUrlValid() }"
            type="text"
            :placeholder="$t('optional')"
            v-model="url"
            :disabled="load"
          >
          <span class="icon is-small is-left">
            <i class="fas fa-globe"></i>
          </span>
        </div>
      </div>

      <!-- Permissions -->
      <p class="permission-header">
        {{ $t('permissions') }}
      </p>

      <div class="permissions">
        <!-- Required permission (read profile) -->
        <div class="field">
          <input type="checkbox" class="is-checkradio is-circle is-info" id="check-required-permission" checked disabled />
          <label class="checkbox" for="check-required-permission" >
            {{ $t('dev_read_profile_informations') }}
          </label>
        </div>

        <div v-for="permission in permissions" :key="permission" class="field">
          <input
            type="checkbox"
            value="permission"
            class="is-checkradio is-circle is-info"
            :id="'check-' + permission"
            :checked="getPermissionValue(permission)"
            :disabled="load"
            @change="setPermissionValue($event, permission)"
          >
          <label class="checkbox" :for="'check-' + permission">
            {{ $t('developer_user_permissions.' + permission) }}
          </label>
        </div>
      </div>
    </section>

    <footer class="modal-card-foot is-flex-right">
      <button class="button" @click="cancel">{{ $t('cancel') }}</button>
      <button
        :disabled="load"
        :class="{ 'button': true, 'is-link': true, 'is-loading': load }"
        @click="editApplication"
      >{{ $t('validate') }}</button>
    </footer>
  </bulma-modal>
  <div v-else></div>
</template>

<script lang="ts">
import { Vue, Component, Prop } from 'nuxt-property-decorator';
import BulmaModal from '~/components/BulmaModal/BulmaModal';
import { handleError } from '~/utils/helpers';
import ApplicationCard from '~/components/pages/settings/apps/ApplicationCard.vue';
import { allowedPermissions, ISentApplication } from "~/utils/types/sent.entities.types";

@Component({
  components: {
    BulmaModal,
    ApplicationCard,
  },
  middleware: 'logged',
  layout: 'default_solid',
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
      const dto: any = { rights: current.rights };

      dto.name = current.name;
      dto.url = current.url;

      if (this.mode === 'create') {
        const app = await this.$axios.$post('application', dto) as ISentApplication;
        this.$emit('created', app);
        this.$toast.success(this.$t('application_create_success'));
      }
      else {
        const app = await this.$axios.$put('application/' + current.id, dto) as ISentApplication;
        this.$emit('edited', app);
        this.$toast.success(this.$t('application_edit_success'));
      }
    } catch (e) {
      handleError(e, this);
    }

    this.load = false;
  }
}
</script>

<style lang="scss" scoped>
  @import '~/assets/css/functions.scss';

  .modal-card-body {
    .before-fields {
      margin-bottom: 1rem;
    }

    .permission-header {
      font-weight: bold;
      font-size: 1.2rem;
      margin-top: 1.3rem;
      margin-bottom: 1rem;
    }

    .permissions {
      margin-bottom: 1rem;
    }
  }
</style>
