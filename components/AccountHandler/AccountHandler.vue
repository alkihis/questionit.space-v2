<template>
  <bulma-modal :open="open" @close="close()" :flexible="true">
    <div v-if="open" :class="{ box: true, root: true, switching: switch_loading }">
      <article
        v-for="user in users"
        :key="user.id"
        :class="{ 'user-card': true, 'clickable': !isSelf(user), 'bg-hover': true }"
        @click="!isSelf(user) ? switchUser(user) : void 0"
      >
        <div class="media-left">
          <figure class="image is-64x64">
            <img :src="user.profilePictureUrl" :alt="user.name">
          </figure>
        </div>
        <div class="media-content">
          <div v-if="!isSelf(user)" class="content with-delete">
            <p>
              <strong>{{ user.name }}</strong> <small>@{{ user.slug }}</small>
            </p>

            <span v-if="user.id in counts && counts[user.id]" class="badge-user">
              <Badge :count="counts[user.id]" :inline="true" />
            </span>

            <div class="tag-wrapper">
              <span class="user-tag">
                <span class="tag is-dark non-hover" @click="willUnlogSomeone($event, user)">
                  {{ $t('delete') }}
                </span>
                <span class="tag is-danger on-hover" @click="willUnlogSomeone($event, user)">
                  {{ $t('delete') }}
                </span>
              </span>
            </div>
          </div>
          <div v-else>
            <p>
              <strong>{{ user.name }}</strong> <small>@{{ user.slug }}</small>
              <br>
              <small>{{ $t('currently_logged_in') }}</small>
            </p>
          </div>
        </div>
      </article>

      <div v-if="users.length < 3" class="add-account clickable bg-hover has-text-link" @click="addUser()">
        <span class="icon is-large">
          <i class="fas fa-plus fa-lg"></i>
        </span>
        <span>
          {{ $t('add_account') }}
        </span>
      </div>

      <div class="remove-all-accounts bg-hover clickable has-text-danger" @click="willUnlogEveryone()">
        <span class="icon is-large">
          <i class="fas fa-sign-out-alt fa-lg"></i>
        </span>
        <span v-if="users.length > 1">
          {{ $t('unlog_all') }}
        </span>
        <span v-else>
          {{ $t('sign_out') }}
        </span>
      </div>
    </div>

    <!-- Modal for all delete -->
    <bulma-modal :open="!!will_all_delete" :card="true" @close="cancelUnlog()">
      <header class="modal-card-head">
        <p class="modal-card-title">{{ $t('sign_out_everyone') }}</p>
        <button class="delete" aria-label="close" @click="cancelUnlog()"></button>
      </header>
      <section class="modal-card-body">
        {{ $t('sure_you_want_logout_everyone') }}
        <br />
        {{ $t('will_disable_push_notifications') }}
      </section>
      <footer class="modal-card-foot is-flex-right">
        <button
          class="button is-info"
          :disabled="all_delete_loading"
          @click="cancelUnlog()"
        >{{ $t('cancel') }}</button>
        <button
          :class="{ button: true, 'is-loading': true, 'is-loading': all_delete_loading }"
          :disabled="all_delete_loading"
          @click="logoutAll()"
        >{{ $t('validate') }}</button>
      </footer>
    </bulma-modal>

    <!-- Modal for single delete -->
    <bulma-modal :open="!!will_delete" :card="true" @close="cancelUnlog()">
      <header class="modal-card-head">
        <p class="modal-card-title">{{ $t('sign_out') }}</p>
        <button class="delete" aria-label="close" @click="cancelUnlog()"></button>
      </header>
      <section class="modal-card-body">
        {{ $t('sure_you_want_logout_this_user') }}
      </section>
      <footer class="modal-card-foot is-flex-right">
        <button class="button is-info" @click="cancelUnlog()">{{ $t('cancel') }}</button>
        <button class="button is-danger" @click="unlogSomeone()">{{ $t('sign_out') }}</button>
      </footer>
    </bulma-modal>
  </bulma-modal>
</template>

<style lang="scss" scoped>
  @import '~/assets/css/functions.scss';
  .root {
    @media screen and (min-width: 768px) {
      padding: 1rem;

      & > * {
        padding-left: 1rem;
        padding-right: 1rem;
      }
    }
    margin-bottom: 0;
    opacity: 1;
    transition: opacity .3s;

    &.switching {
      opacity: .7;
      pointer-events: none;
    }
  }

  .badge-user {
    display: inline-flex;
    align-items: center;
    margin-left: .4rem;
  }

  .clickable {
    cursor: pointer;

    &.is-hoverable:hover > *:not(.icon) {
      text-decoration: underline;
    }
  }

  .bg-hover.clickable {
    transition: background-color .3s;

    &:hover {
      background-color: var(--account-clickable-bg-hover);
    }
  }

  .user-card {
    display: grid;
    grid-template-columns: max-content auto;
    transition: background-color .3s;

    figure img {
      border-radius: 18px;
    }

    .media-content {
      display: flex;
      align-items: center;
      height: 100%;

      p {
        margin: 0;
      }

      .content.with-delete {
        display: flex;
        justify-content: space-between;
        width: 100%;

        .tag-wrapper {
          margin-left: 1rem;
          display: inline-flex;
          align-items: center;

          @media screen and (min-width: 768px) {
            margin-left: 3rem;
          }
        }
      }
    }
  }

  .user-card {
    padding-top: 1rem;
    padding-bottom: 1rem;
  }

  .user-card + .user-card {
    border-top: 1px solid rgba(219, 219, 219, 0.5);
  }

  .add-account, .remove-all-accounts {
    border-top: 1px solid rgba(219, 219, 219, 0.5);
    padding-top: .5rem;
    padding-bottom: .5rem;

    .fas {
      font-size: 1.2rem;
    }

    span {
      vertical-align: middle;
    }
  }

  .user-tag {
    &:hover .non-hover {
      display: none;
    }
    .on-hover {
      display: none;
    }
    &:hover .on-hover {
      display: inline-flex;
    }
  }
</style>

<script lang="ts" src="./AccountHandler.ts"></script>
