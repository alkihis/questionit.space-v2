<template>
  <main>
    <section class="hero is-light">
      <div class="hero-body">
        <div class="container">
          <h1 class="title">
            {{ $t('developer_space') }}
          </h1>
          <h2 class="subtitle">
            {{ $t('manage_your_applications_and_create_new_one') }}.
          </h2>
          <h3 class="back-to-settings">
            <nuxt-link :to="localePath('/settings')">&lsaquo; {{ $t('back_to_settings') }}</nuxt-link>
          </h3>
        </div>
      </div>
    </section>

    <fluid-container v-if="apps" class="root">
      <div class="apps">
        <application-card
          v-for="app in apps"
          :key="app.id"
          :app="app"
          :mine="true"
          @delete-app="openDeleteApplication"
          @edit-app="openEditApplication"
          @regenerate="openRegenerateKey"
          @test-login-flow="openTestApp"
        />

        <p v-if="apps.length === 0" class="no-apps">
          {{ $t('you_dont_have_created_any_app') }}
        </p>
      </div>

      <div class="create-app">
        <a href="#!" @click="createApplication">{{ $t('create_an_app') }}</a>
        •
        <a href="https://docs.questionit.space" rel="noopener noreferrer">{{ $t('documentation') }}</a>
      </div>
    </fluid-container>
    <fluid-container v-else>
      Unable to load apps.
    </fluid-container>

    <bulma-modal :open="!!delete_app" :card="true" @close="cancelDeleteApplication">
      <header class="modal-card-head">
        <p class="modal-card-title">{{ $t('delete_app') }}</p>
        <button class="delete" aria-label="close" @click="cancelDeleteApplication"></button>
      </header>

      <section class="modal-card-body">
        <!-- Content -->
        <p>
          {{ $t('all_users_of_this_application_will_not_be_able_to_use_it_again') }}
        </p>
      </section>

      <footer class="modal-card-foot is-flex-right">
        <button class="button" @click="cancelDeleteApplication">{{ $t('cancel') }}</button>
        <button
          :disabled="delete_load"
          :class="{ 'button': true, 'is-danger': true, 'is-loading': delete_load }"
          @click="deleteApplication"
        >{{ $t('delete') }}</button>
      </footer>
    </bulma-modal>

    <bulma-modal :open="!!regenerate" :card="true" @close="closeRegenerateKey">
      <header class="modal-card-head">
        <p class="modal-card-title">{{ $t('regenerate') }}</p>
        <button class="delete" aria-label="close" @click="closeRegenerateKey"></button>
      </header>

      <section class="modal-card-body">
        <!-- Content -->
        <p>
          {{ $t('regenerate_modal_text') }}
        </p>
      </section>

      <footer class="modal-card-foot is-flex-right">
        <button class="button" @click="closeRegenerateKey">{{ $t('cancel') }}</button>
        <button
          :disabled="delete_load"
          :class="{ 'button': true, 'is-danger': true, 'is-loading': delete_load }"
          @click="regenerateKey"
        >{{ $t('regenerate') }}</button>
      </footer>
    </bulma-modal>

    <application-editor
      :app="edit_app"
      :mode="edit_mode"
      @close="cancelEditApplication"
      @created="createdApplication"
      @edited="editedApplication"
    />

    <bulma-modal :open="!!test_app" :card="true" @close="closeTestApp">
      <header class="modal-card-head">
        <p class="modal-card-title">{{ $t('test_login_flow') }}</p>
        <button class="delete" aria-label="close" @click="closeTestApp"></button>
      </header>

      <section class="modal-card-body">
        <!-- Content -->
        <div v-if="test_final_token">
          <p class="test-generated-header">
            {{ $t('generated_test_data') }}
          </p>

          <pre class="test-generated-data">{{ test_final_token }}</pre>
        </div>
        <div v-else>
          <div class="field">
            <label class="label">PIN</label>

            <div class="control">
              <input
                class="input"
                type="text"
                v-model="test_pin"
                :disabled="test_started"
              />
            </div>
          </div>

          <div>
            <button class="button is-link" @click="confirmTestApp">Validate PIN</button>
          </div>
        </div>
      </section>

      <footer class="modal-card-foot is-flex-right">
        <button class="button" @click="closeTestApp">{{ $t('close') }}</button>
      </footer>
    </bulma-modal>
  </main>
</template>

<script lang="ts">
import { Vue, Component } from 'nuxt-property-decorator';
import BulmaModal from '~/components/BulmaModal/BulmaModal';
import { makeTitle, handleError, isAxiosError, convertAxiosError, QUESTION_IT_REAL_URL } from '~/utils/helpers';
import ApplicationCard from '~/components/ApplicationCard/ApplicationCard';
import ApplicationEditor from '~/components/ApplicationEditor/ApplicationEditor';
import { allowedPermissions, ISentApplication } from "~/utils/types/sent.entities.types";

@Component({
  components: {
    BulmaModal: BulmaModal,
    ApplicationCard: ApplicationCard,
    ApplicationEditor: ApplicationEditor,
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
  apps!: ISentApplication[];
  error!: any;

  delete_app = 0;
  delete_load = false;

  edit_app: ISentApplication | null = null;
  edit_mode: 'create' | 'edit' = 'create';

  regenerate: string | null = null;
  regenerate_load = false;

  test_app: number | null = null;
  test_pin: string = '';
  test_token: string = '';
  test_final_token: string = '';
  test_started = false;

  head() {
    return {
      title: makeTitle(this.$t('account_settings').toString())
    };
  }

  createApplication() {
    // Fake app
    const fake: ISentApplication = {
      id: 0,
      key: '',
      name: '',
      url: '',
      rights: {},
    };

    for (const permission of allowedPermissions) {
      fake.rights[permission] = false;
    }

    this.edit_app = fake;
    this.edit_mode = 'create';
  }

  openEditApplication(id: number) {
    const app = this.apps.find(app => app.id === id) ?? null;
    this.edit_mode = 'edit';

    if (app) {
      this.edit_app = { ...app };
      this.edit_app.rights = { ...app.rights };
    }
  }

  cancelEditApplication() {
    this.edit_app = null;
  }

  createdApplication(app: ISentApplication) {
    this.apps.push(app);
    this.edit_app = null;
  }

  editedApplication(app: ISentApplication) {
    this.apps = this.apps.map(a => a.id === app.id ? app : a);
    this.edit_app = null;
  }

  openDeleteApplication(id: number) {
    this.delete_app = id;
  }

  cancelDeleteApplication() {
    if (this.delete_load)
      return;

    this.delete_app = 0;
  }

  async deleteApplication() {
    if (this.delete_load || !this.delete_app)
      return;

    this.delete_load = true;

    try {
      await this.$axios.$delete('apps', { params: { app_id: this.delete_app } });

      this.apps = this.apps.filter(app => app.id !== this.delete_app);
      this.delete_app = 0;
      this.$toast.success(this.$t('application_delete_success'));
    } catch (e) {
      handleError(e, this);
    }

    this.delete_load = false;
  }

  openRegenerateKey(id: string) {
    if (this.regenerate_load)
      return;

    this.regenerate = id;
  }

  closeRegenerateKey() {
    if (this.regenerate_load)
      return;

    this.regenerate = null;
  }

  async regenerateKey() {
    if (this.regenerate_load || !this.regenerate)
      return;

    this.regenerate_load = true;

    try {
      const app: ISentApplication = await this.$axios.$patch('apps/regenerate', { id: this.regenerate });

      this.apps = this.apps.map(a => a.id === app.id ? app : a);
      this.regenerate = null;
      this.$toast.success(this.$t('regenerate_success'));
    } catch (e) {
      handleError(e, this);
    }

    this.regenerate_load = false;
  }

  async openTestApp(app: number) {
    if (this.test_app)
      return;

    const app_obj = this.apps.find(a => a.id === app);

    if (!app_obj)
      return;


    this.test_app = app;
    this.test_pin = '';
    this.test_final_token = '';

    try {
      const data = await this.$axios.$post('apps/token', { key: app_obj.key, url: 'oob' });
      const url = QUESTION_IT_REAL_URL + '/appflow?token=' + encodeURIComponent(data.token);
      this.test_token = data.token;

      // Open appflow into another tab
      window.open(url, '_blank');
    } catch (e) {
      handleError(e, this);
      this.test_app = null;
    }
  }

  async confirmTestApp() {
    if (!this.test_app)
      return;

    const app_obj = this.apps.find(a => a.id === this.test_app);

    if (!app_obj)
      return;

    try {
      this.test_started = true;
      const data = await this.$axios.$post('auth/token/create', { key: app_obj.key, token: this.test_token, validator: this.test_pin });

      // Finally ok
      this.test_final_token = JSON.stringify(data, null, 2);
    } catch (e) {
      handleError(e, this);
    }

    this.test_started = false;
  }

  closeTestApp() {
    this.test_app = null;
    this.test_started = false;
    this.test_final_token = '';
    this.test_pin = '';
  }
}
</script>

<style lang="scss" scoped>
@import '~/assets/css/functions.scss';

.root {
  padding: 1.5rem 0 7rem 0;

  .no-apps {
    margin-top: 2rem;
    text-align: center;
    font-size: 1.4rem;
    font-weight: 300;
  }

  .create-app {
    margin-top: 3rem;
    text-align: center;
    font-size: 1.2rem;
  }
}

.back-to-settings {
  font-size: 1.15rem;
}

.test-generated-header {
  text-align: center;
  font-size: 1.2rem;
  margin-bottom: 1.5rem;
  font-weight: bold;
}

.test-generated-data {
  padding: 1rem 1.5rem;
  border-radius: 5px;
}
</style>
