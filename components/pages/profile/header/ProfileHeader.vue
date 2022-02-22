<template>
  <div class="user-profile-header">
    <header class="profile-header" :style="'background-image: url(\'' + user.bannerPictureUrl + '\');'">
      <!-- Pen edit banner -->
      <div v-if="edit" class="edit-overlay clickable" @click="clickOnModifyBanner">
        <div class="pen-icon-edit-banner">
          <span class="icon has-text-white">
            <i class="fas fa-pen"></i>
          </span>
        </div>
      </div>

      <div class="profile">
        <div class="profile-user-picture" :style="'background-image: url(\'' + user.profilePictureUrl + '\');'">
          <!-- Pen edit profile picture -->
          <div v-if="edit" class="edit-overlay clickable" @click="clickOnModifyPp" style="border-radius: 25%;">
            <div class="pen-icon-edit-banner">
              <span class="icon has-text-white">
                <i class="fas fa-pen"></i>
              </span>
            </div>
          </div>

          <section class="hero">
            <p class="title nanum">
              {{ user.name }}
            </p>
            <p class="subtitle nanum">
              @{{ user.slug }}
              <a :href="$accessor.profile.twitterLink" rel="noopener noreferrer" target="_blank" class="icon twitter-icon has-text-info">
                <i class="fab fa-twitter-square"></i>
              </a>
            </p>
          </section>
        </div>
      </div>
    </header>

    <!-- Fake inputs for modify pp and banner -->
    <input type="file" ref="pp-input" class="is-hidden pp-modifier" @change="handleFilePpModify" />
    <input type="file" ref="banner-input" class="is-hidden banner-modifier" @change="handleFileBannerModify" />

    <profile-header-desktop
      @refresh-profile="$emit('refresh-profile')"
      @block="$emit('block')"
      @follow="$emit('follow')"
      @unfollow="$emit('unfollow')"
      @start-edition="$accessor.profile.startEdition()"
      @cancel-edition="cancelEdition"
      @end-edition="endEdition"
    />

    <profile-header-mobile
      @refresh-profile="$emit('refresh-profile')"
      @block="$emit('block')"
      @follow="$emit('follow')"
      @unfollow="$emit('unfollow')"
      @start-edition="$accessor.profile.startEdition()"
      @cancel-edition="cancelEdition"
      @end-edition="endEdition"
    />

    <crop-modal
      v-if="cropModalOpen === 'pp'"
      :image="$accessor.profile.newPP"
      mode="pp"
      @close="handleFilePpCropped"
      @cropped="handleFilePpCropped"
    />
    <crop-modal
      v-if="cropModalOpen === 'banner'"
      :image="$accessor.profile.newBanner"
      mode="banner"
      @close="handleFileBannerCropped"
      @cropped="handleFileBannerCropped"
    />
  </div>
</template>

<script lang="ts">
import { Component, Vue } from 'nuxt-property-decorator';
import ProfileHeaderDesktop from '~/components/pages/profile/header/ProfileHeaderDesktop.vue';
import ProfileHeaderMobile from '~/components/pages/profile/header/ProfileHeaderMobile.vue';
import CropModal from '~/components/CropModal/CropModal';
import { ISentUser } from '~/utils/types/sent.entities.types';
import { handleError } from '~/utils/helpers';

@Component({
  components: { CropModal, ProfileHeaderMobile, ProfileHeaderDesktop },
})
export default class extends Vue {
  cropModalOpen: 'pp' | 'banner' | false = false;

  get user() {
    return this.$accessor.profile.user!;
  }

  get edit() {
    return this.$accessor.profile.editUser !== null;
  }

  clickOnModifyPp() {
    (this.$refs['pp-input'] as HTMLElement).click();
  }

  handleFilePpModify(e: Event) {
    const el = e.target as HTMLInputElement;
    if (el.files?.[0]) {
      if (el.files![0].size > 5 * 1024 * 1024) {
        this.$toast.error(this.$t('file_is_too_big'));
        return;
      }

      // Nouvelle pp
      this.$accessor.profile.onPPInputChange(el.files![0]);
      this.cropModalOpen = 'pp';

      el.value = '';
    }
  }

  handleFilePpCropped(file?: File) {
    this.cropModalOpen = false;
    this.$accessor.profile.onPPInputChange(file ?? null);

    if (file) {
      this.$accessor.profile.onPPCropEnd(file);
    }
  }

  clickOnModifyBanner() {
    (this.$refs['banner-input'] as HTMLElement).click();
  }

  handleFileBannerModify(e: Event) {
    const el = e.target as HTMLInputElement;
    if (el.files?.[0]) {
      if (el.files![0].size > 5 * 1024 * 1024) {
        this.$toast.error(this.$t('file_is_too_big'));
        return;
      }

      this.$accessor.profile.onBannerInputChange(el.files![0]);
      this.cropModalOpen = 'banner';

      el.value = '';
    }
  }

  handleFileBannerCropped(file?: File) {
    this.cropModalOpen = false;
    this.$accessor.profile.onBannerInputChange(file ?? null);

    if (file) {
      this.$accessor.profile.onBannerCropEnd(file);
    }
  }

  async endEdition() {
    if (this.$accessor.profile.editionLoad || !this.$accessor.profile.editUser)
      return;

    const user = { ...this.$accessor.profile.editUser };

    user.name = user.name.trim();
    user.slug = user.slug.trim();

    // Try to upload modifications
    const new_name = user.name !== this.user.name ? user.name : undefined;
    const new_slug = user.slug !== this.user.slug ? user.slug : undefined;
    const new_ask_me = user.profileAskMeMessage !== this.user.profileAskMeMessage ? user.profileAskMeMessage : undefined;
    const new_anon = user.allowAnonymousQuestions;

    this.$accessor.profile.onEditLoadStateChange(true);

    try {
      const fd = new FormData;

      if (new_name)
        fd.set('name', new_name);
      if (new_slug)
        fd.set('slug', new_slug)
      if (new_ask_me)
        fd.set('askMeMessage', new_ask_me)
      if (new_anon !== undefined)
        fd.set('allowAnonymousQuestions', String(new_anon));

      if (this.$accessor.profile.newBanner) {
        fd.set('background', this.$accessor.profile.newBanner);
      }
      if (this.$accessor.profile.newPP) {
        fd.set('avatar', this.$accessor.profile.newPP);
      }

      const modified = await this.$axios.$post('user/settings', fd) as ISentUser;

      if (modified.slug !== this.user?.slug)
        this.$router.replace(this.localePath('/u/' + modified.slug));

      this.$accessor.profile.setUser(modified);

      this.$accessor.setLoggedUser({ ...modified });

      this.$accessor.profile.cancelEdition();

      this.$toast.success(this.$t('profile_updated'));
    } catch (e) {
      handleError(e, this);
    } finally {
      this.$accessor.profile.onEditLoadStateChange(false);
    }
  }

  cancelEdition() {
    if (this.$accessor.profile.editionLoad || !this.$accessor.profile.editUser)
      return;

    this.$accessor.profile.cancelEdition();
  }
}
</script>

<style lang="scss" scoped>
.clickable {
  cursor: pointer;

  &.with-underline:hover {
    text-decoration: underline;
  }

  &:hover > p, &.activated > p {
    color: var(--user-clickable-hover);
  }
}

.user-profile-header ::v-deep {
  .twitter-icon {
    vertical-align: bottom;
    @media screen and (min-width: 1024px) {
      vertical-align: middle;
    }
  }
}

section.hero {
  padding-top: 3rem;

  .container {
    display: grid;
    grid-template-columns: auto max-content;
  }

  @media screen and (max-width: 1023px) {
    display: none;
  }
}

.profile {
  width: 10rem;
  height: 10rem;
  bottom: -5rem;
  position: absolute;

  @media screen and (max-width: 1023px) {
    width: 7rem;
    height: 7rem;
  }

  &-user-picture {
    width: 100%;
    height: 100%;
    position: relative;

    border-radius: 25%;
    box-shadow: 0 0.5em 1em -0.125em rgba(10, 10, 10, .1), 0 0 0 1px rgba(10, 10, 10, .02);
    border: .2rem solid white;

    background-size: cover;
    background-repeat: no-repeat;
    background-position: center center;

    section.hero {
      display: none;
      width: max-content;

      p {
        width: inherit;
      }
    }

    @media screen and (max-width: 1023px) {
      width: 7rem;
      height: 7rem;
      margin-bottom: 0;
      margin-left: 1.5rem;
      display: flex;
      align-items: flex-end;

      section.hero {
        display: flex;
        margin-left: 8rem;
        margin-bottom: .5rem;
        max-width: 50vw;

        p.title {
          font-size: 1.8rem;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          width: 100%;
        }

        p.subtitle {
          font-size: 1.2rem;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          width: 100%;
        }
      }
    }
  }
}

header.profile-header {
  display: flex;
  position: relative;
  justify-content: center;
  align-items: flex-end;
  height: 33vh;

  .edit-overlay {
    position: absolute;
    width: 100%;
    height: 100%;
    background-color: transparent;
    transition: background-color .3s;

    &:hover {
      background-color: rgba(0, 0, 0, 0.274);
    }
  }

  .pen-icon-edit-banner {
    position: absolute;
    top: 50%;  /* position the top  edge of the element at the middle of the parent */
    left: 50%; /* position the left edge of the element at the middle of the parent */

    transform: translate(-50%, -50%);
    background-color: #3e3e3e63;
    padding: 6px;
    border-radius: 25px;
  }


  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  background-color: #4384a2;

  @media screen and (max-width: 1023px) {
    height: 20vh;
    justify-content: left;
    margin-bottom: 6rem;
  }
}
</style>
