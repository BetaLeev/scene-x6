<template>
  <div style="display: flex; flex-direction: row;">
    <div style="width: 400px; padding: 10px;">
      <h3>模块添加</h3>
      <button @click="addInputModule">添加输入模块</button>
      <button @click="addProcessingModule">添加处理模块</button>
      <button @click="addOutputModule">添加输出模块</button>
      <button @click="addEnvironmentSpaceModule">添加环境空间模块</button>
      <button @click="deleteSelectedElement" :disabled="!selectedNode && !selectedEdge">删除选中元素</button>
      <button @click="saveGraph">保存</button>
    </div>
    <div id="dag-container" ref="container" style="flex: 1; height: 600px; border: 1px solid #ccc; margin: 10px;">
    </div>
    <div class="property-panel" v-if="selectedNode">
      <h3>编辑模块</h3>
      <div class="property-item">
        <label>标签:</label>
        <input v-model="selectedNodeData.label" @input="updateNodeProps" />
      </div>
      <div class="property-item">
        <label>颜色:</label>
        <input type="color" v-model="selectedNodeData.color" @input="updateNodeProps" />
      </div>
      <div class="property-item" v-if="selectedNodeData.type === 'input'">
        <label>输入值:</label>
        <input v-model="selectedNodeData.inputValue" @input="updateNodeProps" />
      </div>
      <div class="property-item" v-if="selectedNodeData.type === 'process'">
        <label>处理参数:</label>
        <input v-model="selectedNodeData.processParam" @input="updateNodeProps" />
      </div>
      <div class="property-item" v-if="selectedNodeData.type === 'output'">
        <label>输出值:</label>
        <input v-model="selectedNodeData.outputValue" @input="updateNodeProps" />
      </div>
      <div class="property-item" v-if="selectedNodeData.type === 'environment'">
        <label>环境名称:</label>
        <input v-model="selectedNodeData.environmentName" @input="updateNodeProps" />
      </div>
    </div>
  </div>
</template>

<script>
import { Graph } from '@antv/x6';

export default {
  name: 'DAGEditor',
  data() {
    return {
      graph: null,
      inputCount: 0,
      processCount: 0,
      outputCount: 0,
      environmentSpaceCount: 0,
      selectedNode: null,
      selectedEdge: null,
      selectedNodeColor: '#ffffff',
      inputNodes: [],
      processNodes: [],  // 确保已初始化
      outputNodes: [],
      environmentSpaces: [],
      isConnecting: false,
      sourceNode: null,
      selectedNodeData: {
        label: '',
        color: '#ffffff',
        type: '',
        inputValue: '',
        processParam: '',
        outputValue: '',
        environmentName: ''
      }
    };
  },
  mounted() {
    this.initGraph();
  },
  methods: {
    initGraph() {
      // 确保数组已初始化
      this.processNodes = this.processNodes || [];
      
      this.graph = new Graph({
        container: this.$refs.container,
        width: 800,
        height: 600,
        grid: true,
        background: {
          color: '#f0f0f0',
        },
        connecting: {
          snap: {
            radius: 40,  // 增大吸附半径
            strictness: 300,  // 增加吸附严格度
            resampling: false
          },
          allowMulti: false,  // 不允许一个连接桩连接多条线
          highlight: true,  // 高亮可连接状态
          connector: 'smooth', // 使用曲线连接器
          createEdge: () => {
            return this.graph.createEdge({
              attrs: {
                line: {
                  stroke: '#1890ff',
                  strokeWidth: 2,
                  targetMarker: {
                    name: 'block',
                    width: 12,
                    height: 8,
                  },
                },
              },
              connector: 'smooth', // 使用曲线连接器
            });
          },
          validateConnection: ({ sourceView, targetView, sourceMagnet, targetMagnet }) => {
            if (!sourceView || !targetView) return false;
            // 简化验证逻辑，只检查基本连接条件
            return sourceMagnet && targetMagnet &&
              sourceMagnet.getAttribute('port-group') === 'out' &&
              targetMagnet.getAttribute('port-group') === 'in';

          },
        },
        resizing: {
          enabled: true,
          minWidth: 100,
          minHeight: 60,
          maxWidth: 600,  // 增加最大宽度限制
          maxHeight: 500, // 增加最大高度限制
          allowResize: ({ node }) => {
            // 只允许环境空间模块调整大小
            return this.environmentSpaces.includes(node);
          },
          // 调整大小手柄样式
          handles: {
            name: 'rectangle',
            attrs: {
              fill: '#2980B9',
              stroke: '#fff',
              'stroke-width': 1,
            },
          },
        },
        embedding: {
          enabled: true,
          findParent: ({ node }) => {
            try {
              if (!node || !Array.isArray(this.processNodes) || !Array.isArray(this.environmentSpaces)) {
                return null;
              }
              
              // Ensure node is valid and has required methods
              if (!node.isNode || typeof node.isNode !== 'function') {
                return null;
              }

              if (this.processNodes.includes(node)) {
                const foundSpace = this.environmentSpaces.find(space => {
                  try {
                    if (!space || !space.isNode || !space.getBBox || !node.getBBox) {
                      return false;
                    }
                    const spaceBBox = space.getBBox();
                    const nodeBBox = node.getBBox();
                    return spaceBBox && nodeBBox && spaceBBox.containsPoint(nodeBBox.getCenter());
                  } catch (e) {
                    console.error('Error in findParent space check:', e);
                    return false;
                  }
                });
                return foundSpace || null;
              }
              return null;
            } catch (e) {
              console.error('Error in findParent:', e);
              return null;
            }
          }
        },
      });

      this.graph.on('node:click', ({ node }) => {
        this.selectNode(node);
      });

      this.graph.on('edge:click', ({ edge }) => {
        this.selectEdge(edge);
      });

      // 监听边的连接事件
      this.graph.on('edge:connected', ({ edge }) => {
        const sourceNode = edge.getSourceNode();
        const targetNode = edge.getTargetNode();

        // 检查连接规则
        if (!this.isValidConnection(sourceNode, targetNode)) {
          this.graph.removeEdge(edge); // 连接不合法，移除边
        } else {
          this.selectedEdge = edge; // 连接成功，选中边
        }
      });
    },
    addEnvironmentSpaceModule() {
      this.environmentSpaceCount++
      const environmentSpaceNode = this.graph.addNode({
        x: 600,
        y: 50 + this.environmentSpaceCount * 100,
        width: 200,
        height: 100,
        label: `环境空间 ${this.environmentSpaceCount}`,
        group: true,
        resizable: {
          enabled: true,
          minWidth: 100,
          minHeight: 80,
          maxWidth: 400,
          maxHeight: 300
        },
        attrs: {
          body: {
            stroke: '#2980B9',
            fill: 'rgba(41,128,185,0.1)',
            strokeWidth: 2,
            rx: 4,
            ry: 4
          },
          label: {
            fontSize: 12,
            refX: '50%',
            refY: '50%',
            textAnchor: 'middle'
          }
        },
        zIndex: -1
      })
    
      environmentSpaceNode.on('resize', ({ width, height }) => {
        console.log(width, height,'width, height')
        this.adjustNodesInEnvironment(environmentSpaceNode)
      })
    
      environmentSpaceNode.setProp('prevPosition', environmentSpaceNode.position())
      this.environmentSpaces.push(environmentSpaceNode)
    },
    addInputModule() {
      this.inputCount++
      const inputNode = this.graph.addNode({
        x: 50,
        y: 50 + this.inputCount * 100,
        width: 100,
        height: 40,
        label: `输入模块 ${this.inputCount}`,
        ports: {
          groups: {
            out: {
              position: 'right',
              attrs: {
                circle: {
                  r: 5,
                  magnet: true,
                  stroke: '#2ECC71',
                  fill: '#fff',
                },
              },
            },
          },
          items: [{
            id: 'port1',
            group: 'out',
            args: { dy: 0 },
            attrs: {
              circle: {
                magnet: 'active' // 只能主动连接，不能被动连接
              }
            }
          }]
        },
        attrs: {
          body: {
            fill: '#2ECC71',
            stroke: '#27AE60',
          },
          label: {
            fill: '#fff',
          },
        },
      });
      this.inputNodes.push(inputNode);
      this.selectNode(inputNode); // 自动选中新添加的节点
    },
    addProcessingModule() {
      this.processCount++
      const processNode = this.graph.addNode({
        x: 250,
        y: 50 + this.processCount * 100,
        width: 100,
        height: 40,
        label: `处理模块 ${this.processCount}`,
        ports: {
          groups: {
            in: {
              position: 'left',
              attrs: {
                circle: {
                  r: 5,
                  magnet: true,
                  stroke: '#E67E22',
                  fill: '#fff',
                },
              },
            },
            out: {
              position: 'right',
              attrs: {
                circle: {
                  r: 5,
                  magnet: true,
                  stroke: '#E67E22',
                  fill: '#fff',
                },
              },
            },
          },
          items: [
            {
              id: 'in1',
              group: 'in',
              args: { dy: 0 },
              attrs: {
                circle: {
                  magnet: 'passive' // 只能被连接，不能主动连接
                }
              }
            },
            {
              id: 'out1',
              group: 'out',
              args: { dy: 0 },
              attrs: {
                circle: {
                  magnet: 'active' // 只能主动连接，不能被动连接
                }
              }
            }
          ]
        },
        attrs: {
          body: {
            fill: '#E67E22',
            stroke: '#D35400',
          },
          label: {
            fill: '#fff',
          },
        },
      });
      processNode.setData({ allowGroup: true }, { silent: true });
      this.processNodes.push(processNode);
    },
    addOutputModule() {
      this.outputCount++
      const outputNode = this.graph.addNode({
        x: 450,
        y: 50 + this.outputCount * 100,
        width: 100,
        height: 40,
        label: `输出模块 ${this.outputCount}`,
        ports: {
          groups: {
            in: {
              position: 'left',
              attrs: {
                circle: {
                  r: 5,
                  magnet: true,
                  stroke: '#9B59B6',
                  fill: '#fff',
                },
              },
            },
          },
          items: [{
            id: 'in1',
            group: 'in',
            args: { dy: 0 },
            attrs: {
              circle: {
                magnet: 'passive' // 只能被连接，不能主动连接
              }
            }
          }]
        },
        attrs: {
          body: {
            fill: '#9B59B6',
            stroke: '#8E44AD',
          },
          label: {
            fill: '#fff',
          },
        },
      });
      this.outputNodes.push(outputNode);
    },
    // 修改连接创建方式
    selectNode(node) {
      if (this.isConnecting) {
        if (this.inputNodes.includes(node)) {
          this.sourceNode = node;
        } else if (this.processNodes.includes(node) && this.sourceNode) {
          // 确保连接符合规则
          if (this.isValidConnection(this.sourceNode, node)) {
            const edge = this.graph.addEdge({
              source: {
                cell: this.sourceNode.id,
                port: 'port1',
                anchor: { name: 'center' }  // 明确指定锚点
              },
              target: {
                cell: node.id,
                port: 'in1',
                anchor: { name: 'center' }  // 明确指定锚点
              },
              attrs: {
                line: {
                  stroke: '#888',
                  strokeWidth: 2,
                  targetMarker: {
                    name: 'block',
                    width: 12,
                    height: 8,
                  },
                },
              },
              zIndex: 0,
            });

            // 添加连接成功后的视觉反馈
            edge.attr('line/stroke', '#52c41a');
            setTimeout(() => {
              edge.attr('line/stroke', '#888');
            }, 500);

            this.selectedEdge = edge;
          }
          this.sourceNode = null;
          this.isConnecting = false;
        }
      } else {
        this.selectedNode = node;
        this.selectedNodeData = {
          label: node.attr('label/text'),
          color: node.attr('body/fill'),
          type: this.getNodeType(node),
          ...node.getData() // 获取节点已有的数据
        };
      }
    },
    selectEdge(edge) {
      this.selectedEdge = edge;
    },
    deleteSelectedEdge() {
      if (this.selectedEdge) {
        this.graph.removeEdge(this.selectedEdge);
        this.selectedEdge = null;
      }
    },
    updateNodeLabel() {
      if (this.selectedNode) {
        this.selectedNode.attr('label/text', this.selectedNode.label);
      }
    },
    updateNodeColor() {
      if (this.selectedNode) {
        this.selectedNode.attr('body/fill', this.selectedNodeColor);
      }
    },
    isValidConnection(sourceNode, targetNode) {
      // 只允许输入模块连接到处理模块
      if (this.inputNodes.includes(sourceNode) && this.processNodes.includes(targetNode)) {
        return true;
      }
      // 只允许处理模块连接到输出模块
      if (this.processNodes.includes(sourceNode) && this.outputNodes.includes(targetNode)) {
        return true;
      }
      // 允许处理模块之间相互连接
      if (this.processNodes.includes(sourceNode) && this.processNodes.includes(targetNode)) {
        return true;
      }
      return false;
    },
    startConnecting() {
      this.isConnecting = true;
    },
    deleteSelectedElement() {
      if (this.selectedNode) {
        // 确保数组存在
        this.inputNodes = this.inputNodes || [];
        this.processNodes = this.processNodes || [];
        this.outputNodes = this.outputNodes || [];
        this.environmentSpaces = this.environmentSpaces || [];
        
        // 从对应的数组中移除节点
        const arrays = [this.inputNodes, this.processNodes, this.outputNodes, this.environmentSpaces];
        arrays.forEach(arr => {
          if (!arr) return;
          const index = arr.indexOf(this.selectedNode);
          if (index > -1) {
            arr.splice(index, 1);
          }
        });
        this.graph.removeNode(this.selectedNode);
        this.selectedNode = null;
      } else if (this.selectedEdge) {
        this.graph.removeEdge(this.selectedEdge);
        this.selectedEdge = null;
      }
    },
    saveGraph() {
      if (!this.graph) return {};
      
      const graphData = {
        nodes: (this.graph.getNodes() || [])
          .filter(node => node !== null)
          .map(node => ({
            id: node.id,
            type: this.getNodeType(node),
            label: node.attr('label/text'),
            position: node.position(),
            size: node.size ? node.size() : null,
            ports: (node.getPorts() || []).map(port => ({
              id: port.id,
              group: port.group,
              args: port.args
            }))
          })),
        edges: (this.graph.getEdges() || [])
          .filter(edge => edge && edge.getSourceNode && edge.getTargetNode)
          .map(edge => ({
            source: {
              node: edge.getSourceNode().id,
              port: edge.getSourcePortId(),
              portData: edge.getSourceNode().getPort(edge.getSourcePortId())
            },
            target: {
              node: edge.getTargetNode().id,
              port: edge.getTargetPortId(),
              portData: edge.getTargetNode().getPort(edge.getTargetPortId())
            },
            connector: edge.getConnector(),
            vertices: edge.getVertices()
          })),
        environmentSpaces: (this.environmentSpaces || [])
          .filter(space => space !== null)
          .map(space => ({
            id: space.id,
            label: space.attr('label/text'),
            position: space.position(),
            size: space.size(),
            nodes: this.getNodesInEnvironmentSpace(space),
          })),
      };
      console.log('Graph Data:', graphData);
      return graphData;
    },
    getNodeType(node) {
      if (this.inputNodes.includes(node)) return 'input';
      if (this.processNodes.includes(node)) return 'process';
      if (this.outputNodes.includes(node)) return 'output';
      if (this.environmentSpaces.includes(node)) return 'environment';
      return 'unknown';
    },
    getNodesInEnvironmentSpace(space) {
      if (!space || !this.processNodes || !Array.isArray(this.processNodes)) return [];
      
      const spaceBBox = space.getBBox();
      return this.processNodes
        .filter(node => node && node.getBBox)
        .filter(node => {
          const nodeBBox = node.getBBox();
          return spaceBBox.containsRect(nodeBBox);
        })
        .map(node => node.id);
    },
    adjustNodesInEnvironment(spaceNode) {
      try {
        if (!spaceNode || !spaceNode.isNode || typeof spaceNode.isNode !== 'function' || 
            !Array.isArray(this.processNodes) || !spaceNode.getBBox || typeof spaceNode.getBBox !== 'function') {
          return;
        }
        
        const processNodes = (this.processNodes || []).filter(node => 
          node && node.isNode && node.getParent && typeof node.getParent === 'function'
        );
        
        if (!processNodes.length) return;
        
        const spaceBounds = spaceNode.getBBox();
        if (!spaceBounds) return;
        
        const padding = 15;
        const contentWidth = spaceBounds.width - 2 * padding;
        const contentHeight = spaceBounds.height - 2 * padding;
        
        const cols = Math.ceil(Math.sqrt(processNodes.length));
        const rows = Math.ceil(processNodes.length / cols);
        const cellWidth = contentWidth / cols;
        const cellHeight = contentHeight / rows;
        
        processNodes.forEach((node, index) => {
          if (!node || !node.size || typeof node.size !== 'function') return;
          
          const col = index % cols;
          const row = Math.floor(index / cols);
          const x = spaceBounds.x + padding + col * cellWidth + cellWidth/2 - node.size().width/2;
          const y = spaceBounds.y + padding + row * cellHeight + cellHeight/2 - node.size().height/2;
          
          node.position(x, y, { silent: true });
          node.setParent(spaceNode); // 确保节点父节点正确
        });
      } catch (e) {
        console.error('Error in adjustNodesInEnvironment:', e);
      }
    },
    isNodeInEnvironment(node, spaceNode) {
      const nodeRect = node.getBBox();
      const spaceRect = spaceNode.getBBox();
      return spaceRect.containsRect(nodeRect);
    },
    updateNodeProps() {
      if (this.selectedNode) {
        // 更新节点数据
        this.selectedNode.setData(this.selectedNodeData);
        
        // 更新节点标签和颜色
        this.selectedNode.attr('label/text', this.selectedNodeData.label);
        this.selectedNode.attr('body/fill', this.selectedNodeData.color);
      }
    },
  },
}
</script>

<style scoped>
/* 可以在这里添加样式 */
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

.property-item input[type="color"] {
  height: 30px;
  padding: 0;
}
</style>