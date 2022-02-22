<template>
  <Dropdown :class="{ 'disabled': disabled, 'is-up': true, 'account-chooser-root': true }" :noPad="true">
    <!-- Trigger -->
    <template v-slot:trigger>
      <div class="user-select-trigger clickable">
        <!-- Tiny pp -->
        <div class="user">
          <figure class="image is-32x32 user-image">
            <img :src="selected_pp" :alt="selected_alt">
          </figure>

          <span class="trigger-name nanum">
            {{ selected_alt }}
          </span>
        </div>
        <div class="drop-icon has-text-grey-light">
          <span class="icon">
            <i class="fas fa-chevron-up"></i>
          </span>
        </div>
      </div>
    </template>

    <!-- Selector -->
    <template v-slot:content>
      <div
        v-for="user in available"
        :key="user ? user.id : '0'"
        class="selectible-user user clickable"
        @click="onSelectChange(user)"
      >
        <!-- Tiny pp -->
        <figure class="image is-32x32 user-image">
          <img :src="imageFor(user)" :alt="nameFor(user)">
        </figure>

        <!-- Name -->
        <span class="trigger-name nanum">
          {{ nameFor(user) }}
        </span>
      </div>
    </template>
  </Dropdown>
</template>

<script lang="ts">
import { Vue, Component, Prop } from 'nuxt-property-decorator';
import { randomAnonymousImage } from '~/utils/helpers';
import Dropdown from './Dropdown/Dropdown';
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
</script>

<style lang="scss" scoped>
@import '~/assets/css/functions.scss';

.account-chooser-root {
  .clickable {
    cursor: pointer;
  }

  .disabled {
    pointer-events: none;
  }

  @media screen and (max-width: 1023px) {
    .dropdown, .dropdown-trigger {
      width: 100%;
    }
  }

  figure.user-image > img {
    border-radius: 50%;
  }

  .user-select-trigger {
    border: var(--account-trigger-border) 1px solid;
    background-color: var(--account-chooser-bg-color);
    border-radius: 10px;
    padding: .3rem .7rem;
    transition: background-color .3s;

    &:hover {
      background-color: var(--account-chooser-bg-color-hover);
    }

    display: flex;
    align-items: center;
    justify-content: space-between;

    .drop-icon {
      margin-left: 1rem;
    }
  }

  .user {
    display: flex;
    align-items: center;
    figure {
      margin-right: 1rem;
    }
  }

  .selectible-user {
    transition: background-color .3s;

    padding-top: .7rem;
    padding-bottom: .7rem;
    padding-left: 1rem;
    padding-right: 2rem;

    width: 100%;

    &:hover {
      background-color: var(--account-chooser-bg-color-hover);
    }
  }

  .selectible-user + .selectible-user {
    border-top: var(--account-chooser-account-border) 1px solid;
  }

  .trigger-name {
    font-weight: bold;
  }
}
</style>
