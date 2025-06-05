<template>
  <div class="left-sidebar">
    <h3 class="area-title">组件区域</h3>
    <div class="component-section">
      <div class="component-category" v-for="category in categories" :key="category.name">
        <h4>{{ category.name }}</h4>
        <div class="component-item" v-for="item in category.items" :key="item.id" draggable="true"
          @dragstart="onDragStart($event, item)" @dblclick="onComponentDblClick(item)"
          :class="getItemClass(category.name)">
          {{ item.label }}
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  props: {
    categories: Array
  },
  methods: {
    getItemClass(categoryName) {
      return {
        'input-item': categoryName === '输入',
        'env-item': categoryName === '环境',
        'space-item': categoryName === '空间',
        'output-item': categoryName === '输出'
      }
    },
    onDragStart(event, item) {
      try {
        if (!event.dataTransfer) {
          throw new Error('Drag event dataTransfer is not available')
        }
        event.dataTransfer.setData('text/plain', JSON.stringify(item))
        event.dataTransfer.effectAllowed = 'copy'
      } catch (error) {
        console.error('Drag start error:', error)
      }
    },
    onComponentDblClick(item) {
      this.$emit('component-dblclick', item)
    }
  }
}
</script>

<style scoped>
.left-sidebar {
  width: 200px;
  height: 100vh;
  background-color: #f0f0f0;
  padding: 10px;
  box-sizing: border-box;
}

.component-section {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.component-category {
  background: #fff;
  padding: 10px;
  border-radius: 4px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.component-category h4 {
  margin: 0 0 8px 0;
  color: #555;
}

.component-item {
  padding: 6px 8px;
  margin: 4px 0;
  border-radius: 2px;
  cursor: move;
  border: 1px solid;
}

.input-item {
  background: #e1f3d8;
  border-color: #a3e08d;
}

.env-item {
  background: #e6f7ff;
  border-color: #91d5ff;
}

.space-item {
  background: #fdf6ec;
  border-color: #f7d7a3;
}

.output-item {
  background: #f3e8ff;
  border-color: #d3adf7;
}
</style>