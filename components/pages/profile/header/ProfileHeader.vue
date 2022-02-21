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
              <a :href="twitter_link" rel="noopener noreferrer" target="_blank" class="icon twitter-icon has-text-info">
                <i class="fab fa-twitter-square"></i>
              </a>
            </p>
          </section>
        </div>
      </div>
    </header>


    <profile-header-desktop />
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from "nuxt-property-decorator";
import { ISentUser } from "~/utils/types/sent.entities.types";
import ProfileHeaderDesktop from "~/components/pages/profile/header/ProfileHeaderDesktop.vue";

@Component({
  components: { ProfileHeaderDesktop },
})
export default class extends Vue {
  @Prop({ type: Object, required: true })
  user!: ISentUser;

  edit = false;
}
</script>

<style lang="scss" scoped>

</style>
