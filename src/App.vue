<template>
  <div id="app">
    <HomeMain ref="homeMain" @save-scene="handleSaveScene" @echo-scene="handleEchoScene" />
  </div>
</template>

<script>
import HomeMain from './home/HomeMain.vue'

export default {
  name: 'App',
  components: {
    HomeMain,
  },
  data() {
    return {
      savedScenes: []
    }
  },
  methods: {
    handleSaveScene(sceneData) {
      const sceneName = `场景 ${new Date().toLocaleString()}`
      this.savedScenes.push({
        scene: {
          name: sceneName,
          description: ''
        },
        ...sceneData
      })
      console.log('保存场景:', this.savedScenes)
    },
    handleEchoScene(sceneData) {
      // Pass the echo event to HomeMain component
      this.$refs.homeMain.handleEchoScene(sceneData)
    }
  }
}
</script>
