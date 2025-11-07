<template>
  <div class="catalog-filters">
    <slot />
  </div>
</template>

<script setup lang="ts">
// Заглушка для будущих фильтров каталога
</script>

<style scoped>
.catalog-filters {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
</style>
