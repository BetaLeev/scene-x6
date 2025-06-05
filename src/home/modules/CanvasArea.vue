<template>
  <div class="main-content">
    <div class="operation-header">
      <SceneEcho ref="sceneEcho" :savedScenes="savedScenes"
        @echo-scene="(sceneData, index) => handleEchoScene(sceneData, index)" />

      <h3 class="area-title">操作画布</h3>
      <div class="x6-menu-wrap" style="display: none;">
        删除
      </div>

      <div class="operation-buttons">
        <div class="left-buttons">
          <button @click="handleUndo">撤销</button>
          <button @click="handleRedo">重做</button>
        </div>
        <div class="right-buttons">
          <button @click="handleSave">保存</button>
          <button @click="graph.clearCells()">清空画布</button>
          <!-- <button @click="handlePublish">发布</button> -->
          <!-- <button @click="handleSaveAs">另存场景</button> -->
        </div>


      </div>
    </div>
    <div class="canvas" ref="canvas" @dragover.prevent="handleDragOver" @drop.prevent="handleDrop">
    </div>
  </div>
</template>

<script>
import { Graph } from '@antv/x6'
import SceneEcho from './SceneEcho.vue'

export default {
  components: { SceneEcho },
  props: {
    graph: {
      type: Graph,
      default: null
    }
  },
  data() {
    return {
      savedScenes: [],
    }
  },
  mounted() {
    this.$nextTick(() => {
      if (this.$refs.canvas) {
        console.log('Graph实例 传递 完成:', this.graph)
        this.$emit('canvas-mounted', this.$refs.canvas)
      }
    })
  },
  methods: {

    handleRedo() {
      const graph = this.graph;
      graph.redo()

    },
    handleUndo() {
      const graph = this.graph
      graph.undo()
    },

    handleSave() {
      const graph = this.graph
      if (!graph) return

      // Get scene info from parent component
      const sceneInfo = this.$parent?.$refs?.propertyPanel?.getSceneData
        ? this.$parent.$refs.propertyPanel.getSceneData()
        : {
          name: `场景 ${this.savedScenes.length + 1}`,
          description: ''
        }

      // 获取画布数据
      const nodes = graph.getNodes()
      const edges = graph.getEdges()

      console.log(edges, 'edges')
      edges.map(edge => (
        console.log(edge.getSourceCell(), 'sourceCell'),
        console.log(edge.connector, 'connector'),
        console.log(edge, 'connector connector')
      ))
      // 构建完整的场景数据
      const sceneData = {
        scene: sceneInfo,
        nodes: nodes.map(node => ({
          id: node.id,
          shape: node.shape || 'custom-node',
          label: node.label || '未命名节点',
          position: node.position(),
          size: node.size(),
          category: node.getData()?.category || '默认类别',
          data: node.getData() || {},
          attrs: node.getAttrs() || {},
          ports: node.ports || [],
          portMarkup: node.getPortMarkup() || [],
          zIndex: node.getZIndex() || 0,
        })),
        edges: edges.map(edge => ({
          source: edge.source,
          target: edge.target,
          shape: edge.shape || 'custom-edge',
          data: edge.getData() || {},
          attrs: edge.getAttrs() || {},
          vertices: edge.getVertices() || [],
          router: edge.router || {},
          connector: edge.getConnector() || {},
          zIndex: edge.getZIndex() || 0
        }))
      }
      // 添加到已保存场景列表
      this.savedScenes.push(sceneData)

      // 触发保存事件
      this.$emit('save-scene', sceneData)

      this.graph.clearCells()
    },
    handleEchoScene(sceneData, index) {
      // 清除之前的高亮
      if (this.currentHighlightIndex !== null) {
        this.$refs.sceneEcho.clearHighlight(this.currentHighlightIndex)
      }

      // 设置当前高亮索引
      this.currentHighlightIndex = index

      const graph = this.graph;
      if (!graph) return

      graph.clearCells()

      const processedData = {
        ...sceneData,
        nodes: sceneData.nodes.map(node => ({
          ...node
        })),
        edges: sceneData.edges.map(edge => ({
          ...edge,
        }))
      }

      console.log('处理后的场景数据:', processedData);
      graph.fromJSON(processedData)


      // 触发场景信息回显
      this.$emit('echo-scene-info', {
        name: sceneData.scene?.name || `场景 ${this.savedScenes.length + 1}`,
        description: sceneData.scene?.description || ''
      })


    },

    handlePublish() {
      console.log('发布场景')
    },
    handleSaveAs() {
      console.log('另存场景')
    },
    handleDragOver(e) {
      e.preventDefault()
    },
    handleDrop(e) {
      this.$emit('canvas-drop', e)
    },
  }
}
</script>

<style>
.x6-menu-wrap {
  position: absolute;
  z-index: 999;
  border: 1px solid rgba(44, 254, 255, 0.6);
}

.x6-menu-wrap .x6-menu {
  position: relative;
  display: inline-block;
  min-width: 82px;
  min-height: 32px;
  margin: 0;
  padding: 4px 0;
  outline: 0;
  cursor: pointer;
}

.x6-menu-wrap .x6-menu .x6-mune-item {
  width: 100%;
  padding: 0 10px;
}

.x6-widget-contextmenu {
  z-index: 9999 !important;
}

.operation-header {
  /* display: flex; */
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.operation-buttons {
  display: flex;
  justify-content: space-between;
  gap: 10px;
}

.left-buttons,
.right-buttons {
  display: flex;
  gap: 10px;
}

/* 保持原有按钮样式不变 */
.operation-buttons button {
  padding: 5px 10px;
  background: #1890ff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.operation-buttons button:hover {
  background: #40a9ff;
}

.main-content {
  flex: 1;
  background-color: #ffffff;
  padding: 10px;
}

.canvas {
  width: 100%;
  height: calc(100% - 30px);
  border: 1px solid #d9d9d9;
  background: #fafafa;
  position: relative;
  /* 添加定位 */
  overflow: hidden;
  /* 防止内容溢出 */
}

.area-title {
  margin: 0 0 10px 0;
  padding-bottom: 5px;
  border-bottom: 1px solid #ddd;
  color: #333;
}
</style>
