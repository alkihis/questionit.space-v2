<template>
  <div class="nanum" style="margin-top: 1rem; margin-bottom: 1rem;">
    {{ $t('unable_to_load_items') }}.
    <a href="javascript:;" @click="$attrs.trigger">{{ $t('retry') }}</a>
  </div>
</template>