<script setup lang="ts">
const route = useRoute();
const { data: manual } = await useAsyncData(() =>
  queryCollection("content").path(route.path).first()
);

useSeoMeta({
  title: manual.value?.title,
  description: manual.value?.description,
});
</script>

<template>
  <div
    class="flex mx-auto w-[60%] content-center mt-16 text-[16px] text-stone-800 flex-col gap-8"
  >
    <ContentRenderer
      v-if="manual"
      :value="manual"
      class="flex flex-col gap-4"
    />
    <div v-else>manual not found</div>
  </div>
</template>
