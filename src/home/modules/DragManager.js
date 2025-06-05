export class DragManager {
  static graph = null

  static init(graph) {
    this.graph = graph
  }

  static setupDragEvents(graph) {
    // 从GraphManager迁移来的拖拽相关事件
    graph.on('node:change:position', ({ node }) => {
      return
      this.handleNodePositionChange(node)

      // 群组碰撞检测逻辑
      if (node.prop('group')) {
        const otherGroups = graph.getNodes().filter(n => n.prop('group') && n.id !== node.id)
        const overlappingGroup = otherGroups.find(group => {
          const groupBounds = group.getBBox()
          const nodeBounds = node.getBBox()
          return this.checkOverlap(groupBounds, nodeBounds)
        })

        if (overlappingGroup) {
          const prevPosition = node.getProp('prevPosition') || { x: 200, y: 100 }
          node.position(prevPosition.x, prevPosition.y, { silent: true })
          return
        }
        node.setProp('prevPosition', node.position())
      }

      // 输入节点与群组碰撞处理
      if (node.prop('nodeType') === 'input') {
        const groups = graph.getNodes().filter(n => n.prop('group'))
        const overlappingGroup = groups.find(group => {
          const groupBounds = group.getBBox()
          const expandedBounds = this.expandBounds(groupBounds, 10)
          return this.checkOverlap(expandedBounds, node.getBBox())
        })

        if (overlappingGroup) {
          this.repositionNodeOutsideGroup(node, overlappingGroup)
        }
      }
    })

    // 添加节点resize事件监听
    graph.on('node:resize', ({ node }) => {
      const nodeData = node.getData()
      if (nodeData?.nodeType === 'Environment') {
        // 标记节点已被手动调整大小
        node.setData({
          ...nodeData,
          manualResized: true
        }, { silent: true })
      }
    })
  }

  // 辅助方法
  static checkOverlap(bounds1, bounds2) {
    return (
      bounds1.x < bounds2.x + bounds2.width &&
      bounds1.x + bounds1.width > bounds2.x &&
      bounds1.y < bounds2.y + bounds2.height &&
      bounds1.y + bounds1.height > bounds2.y
    )
  }

  static expandBounds(bounds, padding) {
    return {
      x: bounds.x - padding,
      y: bounds.y - padding,
      width: bounds.width + padding * 2,
      height: bounds.height + padding * 2
    }
  }

  static repositionNodeOutsideGroup(node, group) {
    const groupBounds = group.getBBox()
    let [newX, newY] = [node.position().x, node.position().y]
    const groupCenter = {
      x: groupBounds.x + groupBounds.width / 2,
      y: groupBounds.y + groupBounds.height / 2
    }
    const nodeCenter = {
      x: newX + node.size().width / 2,
      y: newY + node.size().height / 2
    }

    if (nodeCenter.x < groupCenter.x) {
      newX = groupBounds.x - node.size().width - 10
    } else {
      newX = groupBounds.x + groupBounds.width + 10
    }

    if (nodeCenter.y < groupCenter.y) {
      newY = groupBounds.y - node.size().height - 10
    } else {
      newY = groupBounds.y + groupBounds.height + 10
    }

    node.position(newX, newY, { silent: true })
  }

  static getEmbeddingConfig() {
    return {
      enabled: true,
      validate: ({ child, parent, childView, parentView }) => {
        return child.data.nodeType === 'Space' && parent.data.nodeType === 'Environment'
      },
      frontOnly: true,
      showNode: true,
    }
  }

  static setupDragEvents(graph) {
    return
    graph.on('node:change:position', ({ node }) => {
      this.handleNodePositionChange(node)

      // 群组碰撞检测逻辑
      if (node.prop('group')) {
        const otherGroups = graph.getNodes().filter(n => n.prop('group') && n.id !== node.id)
        const overlappingGroup = otherGroups.find(group => {
          const groupBounds = group.getBBox()
          const nodeBounds = node.getBBox()
          return this.checkOverlap(groupBounds, nodeBounds)
        })

        if (overlappingGroup) {
          const prevPosition = node.getProp('prevPosition') || { x: 200, y: 100 }
          node.position(prevPosition.x, prevPosition.y, { silent: true })
          return
        }
        node.setProp('prevPosition', node.position())
      }

      // 输入节点与群组碰撞处理
      if (node.prop('nodeType') === 'input') {
        const groups = graph.getNodes().filter(n => n.prop('group'))
        const overlappingGroup = groups.find(group => {
          const groupBounds = group.getBBox()
          const expandedBounds = this.expandBounds(groupBounds, 10)
          return this.checkOverlap(expandedBounds, node.getBBox())
        })

        if (overlappingGroup) {
          this.repositionNodeOutsideGroup(node, overlappingGroup)
        }
      }
    })
  }
  static handleNodePositionChange(node) {
    if (!node || !node.getData || !DragManager.graph) return;

    const parent = node.getParent();
    const nodeData = node.getData() || {};

    // 检查是否是空间节点离开环境节点
    if (!parent && nodeData.previousParent && nodeData?.category === '空间') {
      node.setParent(null);
      node.setData({ ...nodeData, previousParent: null });
      return;
    }

    // 严格检查：只有空间节点可以进入环境群组
    if (parent && parent.isNode && parent.getData &&
      parent.getData()?.category === '环境' &&
      nodeData?.category === '空间') {

      requestAnimationFrame(() => {
        try {
          // 节点置顶
          node.toFront();

          // 获取所有连接到该节点的边并置顶
          const edges = DragManager.graph.getConnectedEdges(node);
          edges.forEach(edge => edge.toFront());

          // 处理空间节点
          if (nodeData.previousParent && nodeData.previousParent !== parent) {
            node.setParent(null);
          }
          node.setParent(parent, { silent: true });
          node.setData({
            ...nodeData,
            previousParent: nodeData.previousParent || parent
          }, { silent: true });
        } catch (error) {
          console.error('节点位置变更处理出错:', error);
        }
      });
    }
  }
}