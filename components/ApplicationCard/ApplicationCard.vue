<template>
  <div :class="{ 
    'card': true, 
    'app-card': true, 
  }">
    <div class="card-content">
      <div class="media">
        <div class="media-content">
          <p class="title nanum is-4">
            <span>
              {{ app.name }}
            </span>
          </p>
        </div>
      </div>

      <div class="content nanum">
        <p v-if="small" class="text-content">
          <span v-if="mine">
            {{ $t('dev_this_application_has_x_rights', { right: right_count, s: right_count > 1 ? 's' : '' }) }}
          </span>
          <span v-else>
            {{ $t('this_application_has_x_rights', { right: right_count, s: right_count > 1 ? 's' : '' }) }}
          </span>
        </p>
        <div v-else class="text-full-content">
          <p v-if="app.url" class="app-link">
            <a :href="app.url" target="_blank" rel="noopener noreferrer">
              {{ $t('app_web_site') }}
            </a>
          </p>

          <p v-if="mine" class="app-keys">
            <span class="key">
              {{ $t('app_key') }}
            </span>
            <span class="warning-msg">
              ({{ $t('keep_secure_and_private') }})
            </span>
            <a href="#!" class="regenerate" @click="$emit('regenerate', app.id)">
              {{ $t('regenerate') }}
            </a>
            <pre>{{ app.key }}</pre>
          </p>

          <p v-if="mine" class="test-login-flow">
            <a href="#!" @click="$emit('test-login-flow', app.id)">{{ $t('test_login_flow') }}</a>
          </p>

          <p class="auth-header">
            {{ $t('this_app_can_do_now') }}
          </p>

          <ul class="auth-list">
            <li v-if="mine" class="auth-option">
              - {{ $t('dev_read_profile_informations') }}
            </li>
            <li v-else class="auth-option">
              - {{ $t('read_profile_informations') }}
            </li>

            <li v-for="option in (mine ? dev_permissions : permissions)" :key="option[0]" class="auth-option">
              - {{ option[1] }}
            </li>
          </ul>
        </div>  
      </div>

      <div class="app-card-footer">
        <div class="expand">
          <a v-if="small" href="#!" @click="toggle">{{ $t('show_more') }}</a>
          <a v-else href="#!" @click="toggle">{{ $t('show_less') }}</a>
        </div>

        <div class="app-buttons">
          <button 
            v-if="mine"
            :class="{ 'button': true, 'is-link': true }"
            @click="$emit('edit-app', app.id)"
          >
            {{ $t('edit') }}
          </button>

          <button 
            :class="{ 'button': true, 'is-danger': true }"
            @click="$emit('delete-app', app.id)"
          >
            {{ $t('delete') }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
  @import '~/assets/css/functions.scss';
  
  .app-card {
    opacity: 1;
  }

  .auth-header {
    font-size: 1.2rem;
    font-weight: 300;
    margin-bottom: .5rem !important;
  }

  .auth-list {
    margin: 0 0 1rem .5rem;

    .auth-option {
      font-size: 1.1rem;
      font-weight: bold;
    }
  }

  .card {
    background-color: var(--notification-card-color);
    border-radius: 5px;
  }

  .content {
    .text-content {
      margin-top: 1rem;
      margin-bottom: .5rem;
      font-size: 1.2rem;
      font-weight: 300;
    }

    .app-keys {
      .key {
        font-weight: bold;
      }

      .warning-msg {
        font-size: .9rem;
        font-weight: 300;
      }

      .regenerate {
        font-size: .9rem;
        font-weight: bold;
      }

      pre {
        padding: .5rem 1.5rem;
        margin-top: .5rem;
        border-radius: 10px;
      }
    }

    ul {
      list-style: none;
    }
  }

  .app-card-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .media-content {
    position: relative;
    overflow: hidden;

    .title {
      max-width: 85%;
    }

    .title > a, .subtitle > a {
      color: var(--notification-profile-link);

      &:hover {
        text-decoration: underline;
      }
    }

    .subtitle {
      margin-bottom: 0;
    }

    .icon {
      position: absolute;
      right: 0;
      top: 0;
    }
  }

  .clickable {
    cursor: pointer;
  }
</style>

<script lang="ts" src="./ApplicationCard.ts"></script>
