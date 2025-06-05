<template>
    <div class="container" @keydown.ctrl.z="handleUndo" @keydown.ctrl.r="handleRedo" tabindex="0">
        <div class="left-sidebar">
            <ComponentPanel :categories="componentCategories" @drag-start="onDragStart"
                @component-dblclick="onComponentDblClick" />
        </div>

        <div class="main-content">
            <CanvasArea :graph="graph" @echo-scene-info="handleSceneInfoEcho" @canvas-mounted="initGraph"
                @save-scene="$emit('save-scene', $event)" @node-blur="handleNodeBlur" />
        </div>

        <div class="right-sidebar">
            <PropertyPanel ref="propertyPanel" :selected-node="selectedNode" @save-properties="saveNodeProperties" />
        </div>

        <div id="minimap-container"></div>
    </div>
</template>


<script>
import { GraphManager } from './modules/GraphManager'
import ComponentPanel from './modules/ComponentPanel'
import CanvasArea from './modules/CanvasArea'
import PropertyPanel from './modules/PropertyPanel'

export default {
    components: { ComponentPanel, CanvasArea, PropertyPanel },
    data() {
        return {
            componentCategories: [
                {
                    name: '输入',
                    items: [
                        { id: 'input', label: '输入', nodeType: 'Input' },
                    ]
                },
                {
                    name: '环境',
                    items: [
                        { id: 'env1', label: '环境', nodeType: 'Environment' },
                    ]
                },
                {
                    name: '空间',
                    items: [
                        { id: 'space1', label: '空间', nodeType: 'Space' },
                    ]
                },
                {
                    name: '输出',
                    items: [
                        { id: 'output1', label: '输出', nodeType: 'Output' },
                    ]
                }
            ],
            graph: null,
            graphManager: null,
            selectedNode: null
        }
    },
    mounted() {

        this.graphManager = new GraphManager(this)
        // 确保容器可获取焦点
        this.$el.setAttribute('tabindex', '0')
        this.$el.focus()

        // 添加键盘事件监听
        this.$el.addEventListener('keydown', this.handleKeyDown)
    },
    beforeDestroy() {
        // 移除事件监听
        this.$el.removeEventListener('keydown', this.handleKeyDown)
    },
    methods: {
        handleUndo() {
            if (this.graphManager && this.graphManager.canUndo()) {
                this.graphManager.undo()
            }
        },
        handleRedo() {
            if (this.graphManager && this.graphManager.canRedo()) {
                this.graphManager.redo()
            }
        },
        initGraph(container) {
            if (!this.graphManager) {
                this.graphManager = new GraphManager(this)
            }
            this.graph = this.graphManager.initGraph(container)
            this.setupGraphListeners()
            this.setupDropHandlers(container)
        },
        handleSceneInfoEcho(sceneInfo) {
            this.$refs.propertyPanel.handleSceneInfoEcho(sceneInfo)
        },
        setupDropHandlers(container) {
            container.addEventListener('dragover', (e) => {
                e.preventDefault()
                if (e.dataTransfer) {
                    e.dataTransfer.dropEffect = 'copy'
                }
            })

            container.addEventListener('drop', (e) => {
                console.log(e, 'addEventListener')
                e.preventDefault()
                try {
                    if (e.dataTransfer) {
                        const data = e.dataTransfer.getData('text/plain')
                        if (data) {
                            const item = JSON.parse(data)
                            const { offsetX, offsetY } = e
                            this.graphManager.addNode(item, offsetX, offsetY)
                        }
                    }
                } catch (error) {
                    console.error('Drop error:', error)
                }
            })
        },
        setupGraphListeners() {
            console.log('setupGraphListeners')

            this.graph.on('blank:click', () => {
                this.handleNodeDeselected();
            })

            this.graph.on('node:click', ({ node }) => {
                const nodeData = node.getData() || {}
                this.selectedNode = {
                    id: node.id,
                    label: node.label,
                    getData: () => nodeData,
                    position: node.position(),
                    data: nodeData,
                    formData: nodeData.formData || {}  // 确保formData存在
                }
                console.log('点击节点数据:', nodeData) // 调试用
            })
        },
        getNodeType(categoryName) {
            const typeMap = {
                '输入': 'Input',
                '环境': 'Env',
                '空间': 'Space',
                '输出': 'Output'
            }
            return typeMap[categoryName] || 'Input'
        },
        onDragStart(event, item) {
            // 获取当前组件的category
            const category = this.componentCategories.find(cat =>
                cat.items.some(i => i.id === item.id)
            )?.name

            // 添加category和nodeType到item对象
            const itemWithType = {
                ...item,
                category,
                nodeType: this.getNodeType(category)
            }

            event.dataTransfer.setData('text/plain', JSON.stringify(itemWithType))
        },

        onComponentDblClick(item) {
            // 处理组件双击事件
        },
        saveNodeProperties({ nodeId, data }) {
            if (this.graph && nodeId) {
                const node = this.graph.getCellById(nodeId)
                if (node) {
                    const currentData = node.getData() || {}
                    const newData = {
                        ...currentData,
                        formData: {
                            ...(currentData.formData || {}),
                            ...data
                        }
                    }
                    node.setData(newData)
                    console.log('保存后节点数据:', newData) // 调试用
                }
            }
        },
        handleKeyDown(e) {
            // 处理Delete键删除选中节点
            if ((e.key === 'Backspace' || e.key === 'Delete') && this.selectedNode) {
                const node = this.graph.getCellById(this.selectedNode.id)
                if (node) {
                    node.remove()
                    this.selectedNode = null
                }
            }
        },
        handleNodeBlur() {
            if (this.$refs.propertyPanel.selectedNode) {
                this.$refs.propertyPanel.handleNodeBlur()
            }
        },
        handleNodeDeselected() {
            this.selectedNode = null
        }
    }
}
</script>

<style scoped>
.container {
    display: flex;
    width: 100%;
    height: 100vh;
    outline: none;
}

.left-sidebar {
    width: 200px;
    /* 左侧固定宽度 */
    height: 100vh;
    background-color: #f0f0f0;
    flex-shrink: 0;
    /* 禁止收缩 */
}

.main-content {
    flex: 1;
    /* 中间伸缩 */
    min-width: 0;
    /* 防止内容溢出 */
    height: 100vh;
    overflow: hidden;
}

.right-sidebar {
    width: 300px;
    /* 右侧固定宽度 */
    height: 100vh;
    background-color: #f0f0f0;
    flex-shrink: 0;
    /* 禁止收缩 */
}

#minimap-container {
    position: absolute;
    right: 330px;
    bottom: 20px;
    border: 1px solid #eaeaea;
}
</style>
