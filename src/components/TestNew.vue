<template>
  <div>
    <button @click="addEnvironmentSpaceModule">添加环境空间模块</button>
    <button @click="addTestNode" style="margin-left: 10px;">添加测试节点</button>

    <div id="test-container" ref="container" style="width: 800px; height: 600px; border: 1px solid #ccc;"></div>
  </div>
</template>

<script>
import { Graph } from '@antv/x6';

export default {
  name: 'TestNew',
  data() {
    return {
      graph: null,
      inputCount: 0,
      processCount: 0,
      environmentSpace: null,
      padding: 20, // 环境空间模块内边距
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
        // 添加缩放配置
        resizing: {
          enabled: true,
        },
      });

      // 监听节点拖拽结束事件
      this.graph.on('node:dragend', ({ node }) => {
        if (this.environmentSpace && this.isNodeInsideEnvironment(node)) {
          this.adjustEnvironmentSize(node); // 添加node参数
        }
      });
    },
    addEnvironmentSpaceModule() {
      this.environmentSpace = this.graph.addNode({
        x: 200,
        y: 200,
        width: 200,
        height: 200,
        label: '我的群组',
        // 优化可伸缩配置
        resizing: {
          enabled: true,
          minWidth: 100,
          minHeight: 60,
          maxWidth: 800,
          maxHeight: 600,
          orthogonal: true, // 允许正交缩放
          restricted: false,
          preserveAspectRatio: false,
          // 添加控制点样式
          handles: [
            'n', 'e', 's', 'w', // 四个边
            'ne', 'nw', 'se', 'sw' // 四个角
          ].map(dir => ({
            name: dir,
            attrs: {
              'stroke': '#2980B9',
              'fill': '#fff',
              'stroke-width': 1,
              'r': 6,
            }
          }))
        },
        // 新增存储子节点的属性
        data: {
          children: []
        },
        attrs: {
          body: {
            fill: 'rgba(52, 152, 219, 0.1)',
            stroke: '#2980B9',
          },
          label: {
            fill: '#2980B9',
          },
        },
      });
    
      // 监听空间模块移动事件
      this.environmentSpace.on('change:position', () => {
        this.updateChildrenPosition();
      });
      
      // 监听空间模块大小改变事件
      this.environmentSpace.on('change:size', () => {
        this.updateChildrenPosition();
        this.handleSizeChange(); // 新增处理尺寸变化
      });
    },

  // 新增：更新子节点位置
  updateChildrenPosition() {
    if (!this.environmentSpace) return;
    const parentPos = this.environmentSpace.position();
    const parentSize = this.environmentSpace.size();
    const children = this.environmentSpace.getData().children || [];
    
    children.forEach(childId => {
      const childNode = this.graph.getCellById(childId);
      if (childNode) {
        const relativeX = childNode.getData().relativeX;
        const relativeY = childNode.getData().relativeY;
        // 计算缩放后的位置
        const scaleX = parentSize.width / 200; // 200是初始宽度
        const scaleY = parentSize.height / 200; // 200是初始高度
        childNode.position(
          parentPos.x + relativeX * scaleX,
          parentPos.y + relativeY * scaleY
        );
      }
    });
  },

  // 修改拖拽结束处理
  async adjustEnvironmentSize(node) {
    if (!this.environmentSpace) return;
    
    const spacing = 10; // 节点间最小间距
    const nodesInside = this.graph.getNodes().filter(n => 
      this.isNodeInsideEnvironment(n) && n.id !== node.id
    );
    
    const nodeBBox = node.getBBox();
    const isColliding = nodesInside.some(existingNode => {
      const existingBBox = existingNode.getBBox();
      // 检查碰撞（包含间距）
      return (
        nodeBBox.x - spacing < existingBBox.x + existingBBox.width &&
        nodeBBox.x + nodeBBox.width + spacing > existingBBox.x &&
        nodeBBox.y - spacing < existingBBox.y + existingBBox.height &&
        nodeBBox.y + nodeBBox.height + spacing > existingBBox.y
      );
    });
    
    if (isColliding) {
      this.graph.removeCell(node);
      alert('节点不能重叠或碰撞，请保持至少'+spacing+'px间距');
      return;
    }

    // 记录相对位置
    const parentPos = this.environmentSpace.position();
    const nodePos = node.position();
    node.setData({
      relativeX: nodePos.x - parentPos.x,
      relativeY: nodePos.y - parentPos.y,
      parentId: this.environmentSpace.id
    });

    // 添加到子节点列表
    const children = this.environmentSpace.getData().children;
    if (!children.includes(node.id)) {
      children.push(node.id);
      this.environmentSpace.setData({ children });
    }

    // 原有尺寸调整逻辑保持不变
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    nodesInside.concat(node).forEach((node) => {
      const bbox = node.getBBox();
      minX = Math.min(minX, bbox.x);
      minY = Math.min(minY, bbox.y);
      maxX = Math.max(maxX, bbox.x + bbox.width);
      maxY = Math.max(maxY, bbox.y + bbox.height);
    });

      if (nodesInside.length > 0) {
        const newWidth = maxX - minX + this.padding * 2;
        const newHeight = maxY - minY + this.padding * 2;
        const newX = minX - this.padding;
        const newY = minY - this.padding;

        this.environmentSpace.setPosition(newX, newY);
        this.environmentSpace.setSize(newWidth, newHeight);
      }
    },
    // 修改节点位置判断
    isNodeInsideEnvironment(node) {
      if (!this.environmentSpace) return false;
      // 排除空间模块自身
      if (node.id === this.environmentSpace.id) return false;
      
      const envBBox = this.environmentSpace.getBBox();
      const nodeBBox = node.getBBox();
      return envBBox.containsRect(nodeBBox);
    },
    
    addTestNode() {
      if (!this.environmentSpace) {
        alert('请先添加环境空间模块');
        return;
      }
      
      const testNode = this.graph.addNode({
        x: 250,
        y: 250,
        width: 60,
        height: 40,
        label: '测试节点',
        attrs: {
          body: {
            fill: '#fff',
            stroke: '#333',
          },
          label: {
            fill: '#333',
          },
        },
      });
      
      // 自动将测试节点添加到环境空间模块中
      this.adjustEnvironmentSize(testNode);
    },
  },
  // 新增：处理尺寸改变时的布局
  handleSizeChange() {
    if (!this.environmentSpace) return;
    
    const parentSize = this.environmentSpace.size();
    const children = this.environmentSpace.getData().children || [];
    
    // 计算缩放比例
    const scaleX = parentSize.width / 200; // 200是初始宽度
    const scaleY = parentSize.height / 200; // 200是初始高度
    
    children.forEach(childId => {
      const childNode = this.graph.getCellById(childId);
      if (childNode) {
        // 更新子节点大小（如果需要）
        const childSize = childNode.size();
        childNode.size({
          width: childSize.width * scaleX,
          height: childSize.height * scaleY
        });
      }
    });
  },
};
</script>

<style scoped>
/* 可以在这里添加样式 */
</style>