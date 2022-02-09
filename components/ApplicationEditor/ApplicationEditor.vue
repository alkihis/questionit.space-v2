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

<script lang="ts" src="./ApplicationEditor.ts"></script>
