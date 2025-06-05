<template>
  <div class="container">
    <div class="toolbar">
      <button @click="addNode">添加节点</button>
      <button @click="saveNodes" style="margin-left: 10px;">保存节点</button>
    </div>
    <div class="content">
      <div id="graph-container" ref="container"></div>
      <div class="property-panel" v-if="selectedNode">
        <h3>节点属性</h3>
        <div class="property-item">
          <label>标题:</label>
          <input v-model="selectedNodeData.title" @change="updateNodeProps" />
        </div>
        <div class="property-item">
          <label>姓名:</label>
          <input v-model="selectedNodeData.name" @change="updateNodeProps" />
        </div>
        <div class="property-item">
          <label>身高(cm):</label>
          <input type="number" v-model.number="selectedNodeData.height" @change="updateNodeProps" />
        </div>
        <div class="property-item">
          <label>年龄:</label>
          <input type="number" v-model.number="selectedNodeData.age" @change="updateNodeProps" />
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { Graph } from '@antv/x6';

export default {
  name: 'TestProp',
  data() {
    return {
      graph: null,
      selectedNode: null,
      selectedNodeData: {
        title: '',
        name: '',
        height: 0,
        age: 0
      }
    };
  },
  mounted() {
    this.initGraph();
  },
  methods: {
    initGraph() {
      this.graph = new Graph({
        container: this.$refs.container,
        width: 800,
        height: 600,
        grid: true,
        background: {
          color: '#f0f0f0',
        },
        // 添加连接验证
        connecting: {
          validateConnection({ sourceCell, targetCell }) {
            console.log(targetCell,'targetCell')
            // 禁止从输出节点创建连线
            if (sourceCell && sourceCell.data && sourceCell.data.title === '输出节点') {
              return false;
            }
            return true;
          }
        }
      });

      // 监听节点点击事件
      this.graph.on('node:click', ({ node }) => {
        this.selectedNode = node;
        this.selectedNodeData = { ...node.getData() };
      });
    },
    
    addNode() {
      const node = this.graph.addNode({
        x: 100,
        y: 100,
        width: 120,
        height: 60,
        label: '新节点',
        attrs: {
          body: {
            fill: '#fff',
            stroke: '#333',
            rx: 5,
            ry: 5,
          },
          label: {
            fontSize: 12,
          },
        },
        data: {
          title: '默认标题',
          name: '匿名',
          height: 170,
          age: 25
        }
      });
      
      // 自动选中新添加的节点
      this.selectedNode = node;
      this.selectedNodeData = { ...node.getData() };
    },
    
    updateNodeProps() {
      if (this.selectedNode) {
        // 更新节点数据
        this.selectedNode.setData(this.selectedNodeData);
        
        // 更新节点标签显示
        const { title, name } = this.selectedNodeData;
        this.selectedNode.setLabel(`${title}\n${name}`);
      }
    },
    
    saveNodes() {
      const nodes = this.graph.getNodes();
      const nodeData = nodes.map(node => ({
        id: node.id,
        position: node.position(),
        size: node.size(),
        data: node.getData(),
        label: node.getLabel()
      }));
      
      console.log('节点信息:', nodeData);
      
      // 创建输出节点（修改后）
      const outputNode = this.graph.addNode({
        x: 400,
        y: 300,
        width: 150,
        height: 60,
        label: '输出节点',
        // 添加连接桩配置
        ports: {
          groups: {
            left: {
              position: 'left',
              attrs: {
                circle: {
                  r: 6,
                  magnet: true,
                  stroke: '#ff9800',
                  strokeWidth: 2,
                  fill: '#fff'
                }
              }
            }
          },
          items: [{
            id: 'port-left',
            group: 'left',
            // 设置为只能作为目标
            attrs: {
              circle: {
                magnet: 'passive' // 只能被连接，不能主动连接
              }
            }
          }]
        },
        attrs: {
          body: {
            fill: '#ffeb3b',
            stroke: '#ff9800',
            rx: 5,
            ry: 5,
          },
          label: {
            fontSize: 12,
          },
        },
        data: {
          title: '输出节点',
          name: '输出',
          height: 0,
          age: 0
        }
      });
      
      // 修改连线配置，连接到左侧连接桩
      nodes.forEach(node => {
        if (node.id !== outputNode.id) {
          this.graph.addEdge({
            source: node,
            target: {
              cell: outputNode,
              port: 'port-left'  // 指定连接到左侧连接桩
            },
            attrs: {
              line: {
                stroke: '#888',
                strokeWidth: 1,
                targetMarker: {
                  name: 'block',
                  width: 8,
                  height: 6
                }
              }
            }
          });
        }
      });
      
      alert(`已保存${nodes.length}个节点信息并创建输出节点`);
      
      // 可选：将数据保存到文件
      const blob = new Blob([JSON.stringify(nodeData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'nodes-data.json';
      a.click();
      URL.revokeObjectURL(url);
    }
  }
};
</script>

<style scoped>
.container {
  display: flex;
  flex-direction: column;
  height: 100vh;
}

.toolbar {
  padding: 10px;
  background: #eee;
}

.content {
  display: flex;
  flex: 1;
}

#graph-container {
  flex: 1;
  border: 1px solid #ccc;
}

.property-panel {
  width: 250px;
  padding: 15px;
  background: #f9f9f9;
  border-left: 1px solid #ddd;
}

.property-item {
  margin-bottom: 15px;
}

.property-item label {
  display: block;
  margin-bottom: 5px;
  font-weight: bold;
}

.property-item input {
  width: 100%;
  padding: 5px;
  border: 1px solid #ddd;
  border-radius: 3px;
}
</style>