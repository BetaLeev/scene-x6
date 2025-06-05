<template>
  <div class="scene-echo-container">
    <div class="scene-list">
      <h4>已保存场景 ({{ savedScenes.length }})</h4>
      <div v-if="savedScenes.length === 0" class="empty-tip">
        暂无保存的场景
      </div>
      <div v-else class="scene-thumbnails">
        <div v-for="(scene, index) in savedScenes" :key="index" class="scene-thumbnail" @click="emitEchoScene(scene)">
          <div class="scene-name">{{ scene.scene.name }}</div>
          <div class="scene-preview">
            <div v-for="(node, i) in scene.nodes.slice(0, 3)" :key="i" class="preview-node" :style="getNodeStyle(node)">
              {{ node.label.substring(0, 4) }}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>


<script>
export default {
  props: {
    savedScenes: {
      type: Array,
      default: () => []
    }
  },
  methods: {
    clearHighlight(index) {
      // 清除所有高亮
      const items = this.$el.querySelectorAll('.scene-item')
      items.forEach(item => {
        item.classList.remove('active-scene')
      })

      // 设置当前选中项高亮
      if (index !== null) {
        items[index]?.classList.add('active-scene')
      }
    },
    emitEchoScene(scene) {
      console.log('点击的场景数据:', JSON.parse(JSON.stringify(scene)))
      this.$emit('echo-scene', scene)
    },
    getNodeStyle(node) {
      return {
        backgroundColor: this.getCategoryColor(node.category).bg,
        borderColor: this.getCategoryColor(node.category).border,
        left: `${node.position.x / 10}px`,
        top: `${node.position.y / 10}px`
      }
    },
    getCategoryColor(category) {
      const colors = {
        '输入': { bg: '#e1f3d8', border: '#67C23A' },
        '环境': { bg: '#e6f7ff', border: '#1890FF' },
        '空间': { bg: '#fdf6ec', border: '#E6A23C' },
        '输出': { bg: '#f3e8ff', border: '#722ED1' }
      }
      return colors[category] || { bg: '#f5f5f5', border: '#d9d9d9' }
    },
    clearHighlight(index) {
      // 清除所有高亮
      const items = this.$el.querySelectorAll('.scene-item')
      items.forEach(item => {
        item.classList.remove('active-scene')
      })

      // 设置当前选中项高亮
      if (index !== null) {
        items[index]?.classList.add('active-scene')
      }
    }
  }
}
</script>

<style scoped>
.empty-tip {
  color: #999;
  font-size: 12px;
  padding: 10px;
}

.scene-echo-container {
  margin-right: 20px;
}

.scene-list {
  max-height: 200px;
  overflow-y: auto;
}

.scene-thumbnails {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.scene-thumbnail {
  width: 120px;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  cursor: pointer;
  background: white;
}

.scene-thumbnail:hover {
  border-color: #1890ff;
}

.scene-name {
  font-size: 12px;
  margin-bottom: 5px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.scene-preview {
  position: relative;
  height: 80px;
  background: #fafafa;
  border: 1px dashed #d9d9d9;
}

.preview-node {
  position: absolute;
  width: 30px;
  height: 20px;
  font-size: 10px;
  border: 1px solid;
  border-radius: 2px;
  display: flex;
  align-items: center;
  justify-content: center;
  transform: scale(0.7);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.scene-item {
  padding: 8px;
  margin: 4px 0;
  cursor: pointer;
  border-radius: 4px;
  transition: all 0.3s;
}

.scene-item:hover {
  background-color: #f0f0f0;
}

.active-scene {
  background-color: #e6f7ff;
  border-left: 3px solid #1890ff;
  font-weight: bold;
}
</style>
