<template>
  <div>
    <div :class="{ solid }" data-navbar-root>
      <nav class="navbar" role="navigation" aria-label="main navigation">
        <div class="navbar-brand">
          <!-- Logo mobile -->
          <nuxt-link :to="$accessor.isLogged ? localePath('/home') : localePath('/')" class="navbar-item is-hidden-desktop">
            <img class="logo-img" src="/images/logo/LogoWhite.png" />
          </nuxt-link>

          <!-- Mobile: User not logged -->
          <a
            v-if="!$accessor.isLogged"
            role="button"
            :class="{ 'navbar-burger': true, 'is-active': is_open }"
            aria-label="menu"
            :aria-expanded="String(is_open)"
            @click="toggle"
            data-mobile-root
          >
            <span aria-hidden="true"></span>
            <span aria-hidden="true"></span>
            <span aria-hidden="true"></span>
          </a>
          <!-- Mobile: User logged: just open -->
          <a
            v-else
            :class="{ 'navbar-burger': true, 'is-active': is_open, 'with-user': true }"
            aria-label="menu"
            :aria-expanded="String(is_open)"
            @click="accountModal()"
            data-mobile-root
          >
            <figure class="image mobile-user-icon-fig">
              <img :src="$accessor.loggedUser.profilePictureUrl" :alt="$accessor.loggedUser.name">
            </figure>
          </a>
          <Badge v-if="!is_open" class="is-hidden-desktop" :count="$accessor.waitingNotificationsCount" />
        </div>

        <!-- Items: desktop -->
        <div class="navbar-menu">
          <!-- Navbar: left -->
          <div class="navbar-start">
            <div v-if="$accessor.isLogged" class="navbar-item">
              <nuxt-link class="has-tooltip-arrow has-tooltip-bottom icon navbar-icon" :data-tooltip="$t('timeline')" :to="localePath('/home')">
                <i class="fas fa-globe-europe" />
              </nuxt-link>
            </div>

            <div class="navbar-item">
              <nuxt-link class="has-tooltip-arrow has-tooltip-bottom icon navbar-icon" :data-tooltip="$t('search')" :to="localePath('/search')">
                <i class="fas fa-search" />
              </nuxt-link>
            </div>

            <div v-if="$accessor.isLogged" class="navbar-item">
              <nuxt-link class="has-tooltip-arrow has-tooltip-bottom icon navbar-icon" :data-tooltip="$t('waiting_questions')" :to="localePath('/waiting')">
                <i class="far fa-comment" />
                <Badge :count="$accessor.waitingAnswerCount" />
              </nuxt-link>
            </div>
          </div>

          <!-- Navbar: logo -->
          <div v-if="showLogo" class="navbar-center">
            <div class="navbar-item">
              <nuxt-link :to="$accessor.isLogged ? localePath('/home') : localePath('/')">
                <img class="logo-img" src="/images/logo/LogoWhite.png" />
              </nuxt-link>
            </div>
          </div>

          <!-- Navbar: right -->
          <div class="navbar-end">
            <div v-if="$accessor.isLogged" class="navbar-item">
              <nuxt-link class="has-tooltip-arrow has-tooltip-bottom icon navbar-icon" :data-tooltip="$t('notifications')" :to="localePath('/notification')">
                <i class="far fa-bell" />
                <Badge :count="$accessor.waitingNotificationsCount" />
              </nuxt-link>
            </div>

            <div v-if="$accessor.isLogged" class="navbar-item">
              <nuxt-link class="has-tooltip-arrow has-tooltip-bottom icon navbar-icon" :data-tooltip="$t('profile')" :to="localePath('/s')">
                <i class="far fa-user" />
              </nuxt-link>
            </div>

            <div v-if="$accessor.isLogged" class="navbar-item user-icon">
              <a
                class="navbar-icon has-tooltip-arrow has-tooltip-bottom"
                :data-tooltip="'@' + $accessor.loggedUser.slug"
                href="#"
                @click.prevent="accountModal()"
              >
                <figure class="image user-icon-fig">
                  <img :src="$accessor.loggedUser.profilePictureUrl" :alt="$accessor.loggedUser.name">
                </figure>
              </a>
            </div>
            <div v-else class="navbar-item">
              <nuxt-link class="has-tooltip-arrow has-tooltip-bottom icon navbar-icon" :data-tooltip="$t('sign_in')" :to="localePath('/login')">
                <i class="fas fa-sign-in-alt" />
              </nuxt-link>
            </div>
          </div>
        </div>

        <!-- Items: Mobile, only when not logged -->
        <div :class="{ 'navbar-menu': true, 'nav-mobile': true, 'is-active': is_open, 'is-hidden': !is_open }" data-mobile-root>
          <!-- All items -->
          <div class="navbar-start">
            <nuxt-link class="navbar-item" :to="localePath('/search')" @click.native="close()">
              <span class="icon">
                <i class="fas fa-search" />
              </span>
              <span>
                {{ $t('search') }}
              </span>
            </nuxt-link>

            <nuxt-link class="navbar-item" :to="localePath('/login')" @click.native="close()">
              <span class="icon">
                <i class="fas fa-sign-in-alt" />
              </span>
              <span>
                {{ $t('sign_in') }}
              </span>
            </nuxt-link>
          </div>
        </div>
      </nav>
      <div class="padder"></div>

      <!-- Switch account modal -->
      <account-handler
        :open="logout_modal"
        @close="closeAccountModal()"
      />
    </div>

    <!-- Bottom navigation menu -->
    <div v-if="$accessor.isLogged" class="bottom-navigation">
      <div v-html="getStyles()" />

      <div class="bar">
        <div
          v-for="name in valid_pages"
          :key="name"
          :class="{ item: true, selected: isPageActive(name) }"
        >
          <nuxt-link class="icon" :to="localePath('/' + name)">
            <i :class="'fa-lg ' + getIcon(name)" />
          </nuxt-link>

          <Badge v-if="name === 'waiting'" :count="$accessor.waitingAnswerCount" :navbadge="true" />
          <Badge v-if="name === 'notification'" :count="$accessor.waitingNotificationsCount" :navbadge="true" />

          <div v-if="isPageActive(name)" class="selected-badge" />
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" src="./Navbar.scss" scoped></style>

<script lang="ts" src="./Navbar.ts"></script>
