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

    <fluid-container class="root">
      <template v-if="!error">
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
      </template>
      <div v-else>
        <p class="no-apps">
          Unable to load apps.
        </p>
      </div>
    </fluid-container>

    <bulma-modal :open="!!deleteAppId" :card="true" @close="cancelDeleteApplication">
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
          :disabled="deleteAppLoad"
          :class="{ 'button': true, 'is-danger': true, 'is-loading': deleteAppLoad }"
          @click="deleteApplication"
        >{{ $t('delete') }}</button>
      </footer>
    </bulma-modal>

    <bulma-modal :open="!!regenerateAppId" :card="true" @close="closeRegenerateKey">
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
          :disabled="deleteAppLoad"
          :class="{ 'button': true, 'is-danger': true, 'is-loading': deleteAppLoad }"
          @click="regenerateKey"
        >{{ $t('regenerate') }}</button>
      </footer>
    </bulma-modal>

    <application-editor
      :app="editedApplication"
      :mode="editMode"
      @close="cancelEditApplication"
      @created="createdApplication"
      @edited="editApplication"
    />

    <bulma-modal :open="!!testApplication" :card="true" @close="closeTestApp">
      <header class="modal-card-head">
        <p class="modal-card-title">{{ $t('test_login_flow') }}</p>
        <button class="delete" aria-label="close" @click="closeTestApp"></button>
      </header>

      <section v-if="testApplication" class="modal-card-body">
        <!-- Content -->
        <div v-if="testApplication.finalToken">
          <p class="test-generated-header">
            {{ $t('generated_test_data') }}
          </p>

          <pre class="test-generated-data">{{ testApplication.finalToken }}</pre>
        </div>
        <div v-else>
          <div class="field">
            <label class="label">PIN</label>

            <div class="control">
              <input
                class="input"
                type="text"
                v-model="testApplication.pin"
                :disabled="testApplication.started"
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
import ApplicationCard from '~/components/pages/settings/apps/ApplicationCard.vue';
import ApplicationEditor from '~/components/pages/settings/apps/ApplicationEditor.vue';
import { allowedPermissions, ISentApplication } from "~/utils/types/sent.entities.types";

interface ITestApplication {
  application: ISentApplication;
  pin: string;
  token: string;
  finalToken: string;
  started: boolean;
}

@Component({
  components: {
    BulmaModal,
    ApplicationCard,
    ApplicationEditor,
  },
  middleware: 'logged',
  layout: 'default_solid',
  async asyncData({ app }) {
    try {
      const apps = await app.$axios.$get('application');

      return { apps, error: null };
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

  deleteAppId = 0;
  deleteAppLoad = false;

  editedApplication: ISentApplication | null = null;
  editMode: 'create' | 'edit' = 'create';

  regenerateAppId: string | null = null;
  regeneratePinLoad = false;

  testApplication: ITestApplication | null = null;

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

    this.editedApplication = fake;
    this.editMode = 'create';
  }

  openEditApplication(id: number) {
    const app = this.apps.find(app => app.id === id) ?? null;
    this.editMode = 'edit';

    if (app) {
      this.editedApplication = { ...app };
      this.editedApplication.rights = { ...app.rights };
    }
  }

  cancelEditApplication() {
    this.editedApplication = null;
  }

  createdApplication(app: ISentApplication) {
    this.apps.push(app);
    this.editedApplication = null;
  }

  editApplication(app: ISentApplication) {
    this.apps = this.apps.map(a => a.id === app.id ? app : a);
    this.editedApplication = null;
  }

  openDeleteApplication(id: number) {
    this.deleteAppId = id;
  }

  cancelDeleteApplication() {
    if (this.deleteAppLoad)
      return;

    this.deleteAppId = 0;
  }

  async deleteApplication() {
    if (this.deleteAppLoad || !this.deleteAppId)
      return;

    this.deleteAppLoad = true;

    try {
      await this.$axios.$delete('application/' + this.deleteAppId);

      this.apps = this.apps.filter(app => app.id !== this.deleteAppId);
      this.deleteAppId = 0;
      this.$toast.success(this.$t('application_delete_success'));
    } catch (e) {
      handleError(e, this);
    }

    this.deleteAppLoad = false;
  }

  openRegenerateKey(id: string) {
    if (this.regeneratePinLoad)
      return;

    this.regenerateAppId = id;
  }

  closeRegenerateKey() {
    if (this.regeneratePinLoad)
      return;

    this.regenerateAppId = null;
  }

  async regenerateKey() {
    if (this.regeneratePinLoad || !this.regenerateAppId)
      return;

    this.regeneratePinLoad = true;

    try {
      const app: ISentApplication = await this.$axios.$patch(`application/${this.regenerateAppId}/regenerate-key`);

      this.apps = this.apps.map(a => a.id === app.id ? app : a);
      this.regenerateAppId = null;
      this.$toast.success(this.$t('regenerate_success'));
    } catch (e) {
      handleError(e, this);
    }

    this.regeneratePinLoad = false;
  }

  async openTestApp(appId: number) {
    if (this.testApplication)
      return;

    const application = this.apps.find(a => a.id === appId);

    if (!application)
      return;

    this.testApplication = {
      application,
      pin: '',
      finalToken: '',
      token: '',
      started: false,
    };

    try {
      const data = await this.$axios.$post('application/token', { key: application.key, url: 'oob' });
      const url = QUESTION_IT_REAL_URL + '/appflow?token=' + encodeURIComponent(data.token);
      this.testApplication.token = data.token;

      // Open appflow into another tab
      window.open(url, '_blank');
    } catch (e) {
      handleError(e, this);
      this.testApplication = null;
    }
  }

  async confirmTestApp() {
    if (!this.testApplication)
      return;

    try {
      this.testApplication.started = true;
      const data = await this.$axios.$post('token/create', {
        key: this.testApplication.application.key,
        token: this.testApplication.token,
        validator: this.testApplication.pin,
      });

      // Finally ok
      this.testApplication.finalToken = JSON.stringify(data, null, 2);
    } catch (e) {
      handleError(e, this);
    }

    this.testApplication.started = false;
  }

  closeTestApp() {
    this.testApplication = null;
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
