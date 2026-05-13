<template>
  <div id="app">
    <scale-container :height="960">
      <router-view />
    </scale-container>
  </div>
</template>

<script>
export default {
  name: 'App'
}
</script>

