<template>
    <div class="right-sidebar">
        <h2 class="editor-title">编辑</h2>

        <!-- 场景编辑区域 -->
        <div v-if="!selectedNode" class="scene-editor">
            <div class="property-form">
                <div class="form-item">
                    <label><span class="required">*</span>场景名称</label>
                    <input type="text" v-model="sceneData.name" required>
                </div>
                <div class="form-item">
                    <label>场景描述</label>
                    <textarea v-model="sceneData.description"></textarea>
                </div>
                <button @click="saveScene">保存场景</button>
            </div>
        </div>

        <!-- 节点编辑区域 -->
        <div v-else class="node-editor">
            <h4 class="node-title">{{ selectedNode.label }} 属性</h4>
            <div class="property-form">
                <div v-for="field in editForm.fields" :key="field.prop" class="form-item">
                    <label>{{ field.label }}</label>
                    <!-- 新增select类型支持 -->
                    <select v-if="field.type === 'select'" v-model="editForm.data[field.prop]"
                        @change="handlePropertyChange(field.prop)">
                        <option v-for="option in field.options" :value="option.value" :key="option.value">
                            {{ option.label }}
                        </option>
                    </select>
                    <input v-else-if="field.type === 'text'" type="text" v-model="editForm.data[field.prop]"
                        @blur="handlePropertyChange(field.prop)">
                    <textarea v-else-if="field.type === 'textarea'" v-model="editForm.data[field.prop]"
                        @blur="handlePropertyChange(field.prop)"></textarea>
                </div>
                <button @click="saveComponent">保存节点</button>
            </div>
        </div>
    </div>
</template>

<script>
import { getEditForm } from './NodeEditor'

export default {
    props: {
        selectedNode: {
            type: Object,
            default: null
        }
    },
    data() {
        return {
            sceneData: {
                name: '',
                description: ''
            },
            editForm: {
                fields: [],
                data: {},
                // 新增默认值处理
                defaultData: {}
            }
        }
    },
    watch: {
        selectedNode: {
            immediate: true,
            handler(node) {
                if (node) {
                    this.loadNodeForm(node)
                }
            }
        }
    },
    methods: {
        loadNodeForm(node) {
            console.log(node,'node')
            this.editForm = getEditForm(node)
        },
        handlePropertyChange(prop) {
            this.$emit('property-change', {
                nodeId: this.selectedNode.id,
                prop,
                value: this.editForm.data[prop]
            })
        },
        getSceneData() {
            return {
                name: this.sceneData.name,
                description: this.sceneData.description
            }
        },
        saveScene() {
            this.$emit('save-scene', {
                name: this.sceneData.name,
                description: this.sceneData.description
            })
        },
        saveComponent() {
            this.$emit('save-properties', {
                nodeId: this.selectedNode.id,
                data: { ...this.editForm.data }
            })
        },
        handleSceneInfoEcho(sceneInfo) {
            this.sceneData = {
                name: sceneInfo.name,
                description: sceneInfo.description
            }
        }
    },
    mounted() {
        this.$parent.$on('echo-scene-info', this.handleSceneInfoEcho)
    },
    beforeDestroy() {
        this.$parent.$off('echo-scene-info', this.handleSceneInfoEcho)
    }
}
</script>


<style scoped>
.right-sidebar {
    width: 300px;
    padding: 20px;
    box-sizing: border-box;
    box-shadow: -2px 0 10px rgba(0, 0, 0, 0.05);
}

.editor-title {
    font-size: 18px;
    color: #333;
    margin-bottom: 20px;
    padding-bottom: 10px;
    border-bottom: 1px solid #eee;
}

.property-form {
    margin-top: 15px;
}

.form-item {
    margin-bottom: 20px;
}

.form-item label {
    display: block;
    font-size: 14px;
    color: #666;
    margin-bottom: 8px;
    font-weight: 500;
}

.form-item input,
.form-item textarea {
    width: 100%;
    padding: 10px;
    border: 1px solid #ddd;
    border-radius: 4px;
    font-size: 14px;
    transition: border-color 0.3s;
}

.form-item input:focus,
.form-item textarea:focus {
    border-color: #1890ff;
    outline: none;
    box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.2);
}

.form-item textarea {
    height: 100px;
    resize: vertical;
}

button {
    margin-top: 10px;
    padding: 10px 16px;
    background-color: #1890ff;
    border: none;
    color: white;
    font-size: 14px;
    border-radius: 4px;
    cursor: pointer;
    transition: background-color 0.3s;
}

button:hover {
    background-color: #40a9ff;
}

.node-title {
    font-size: 16px;
    color: #333;
    margin-bottom: 15px;
    padding-bottom: 8px;
    border-bottom: 1px solid #eee;
}

.required {
    color: #ff4d4f;
    margin-right: 4px;
}

.scene-editor,
.node-editor {
    padding: 15px;
    box-sizing: border-box;
    border-radius: 4px;
}

.tabs {
    display: flex;
    border-bottom: 1px solid #ddd;
    margin-bottom: 15px;
}

.tabs button {
    padding: 8px 16px;
    background: none;
    border: none;
    cursor: pointer;
    border-bottom: 2px solid transparent;
}

/* 新增select样式 */
.form-item select {
    width: 100%;
    padding: 10px;
    border: 1px solid #ddd;
    border-radius: 4px;
    font-size: 14px;
    background-color: white;
    transition: border-color 0.3s;
}

.form-item select:focus {
    border-color: #1890ff;
    outline: none;
    box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.2);
}
</style>