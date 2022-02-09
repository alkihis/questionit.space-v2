<template>
  <div :class="{ dropdown: true, 'is-active': open, 'is-right': right }" :data-uuid="uuid">
    <div :class="{ 'dropdown-trigger': true, 'full': true }" @click.stop="toggle()">
      <slot name="trigger" />
    </div>

    <div :class="{ 'dropdown-menu': true, 'no-pad': noPad }" role="menu" @click.stop="toggleOff()">
      <div :class="{ 'dropdown-content': true, 'no-pad': noPad }">
        <slot name="content" />
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
  .dropdown-trigger.full {
    width: 100%;
  }

  .no-pad {
    padding: 0;
    width: max-content;
  }

  .dropdown-menu {
    z-index: 99999;
  }
</style>

<script lang="ts" src="./Dropdown.ts"></script>
