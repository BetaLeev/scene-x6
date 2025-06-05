import { Graph } from '@antv/x6'
import { Transform } from '@antv/x6-plugin-transform'
import { ConnectionManager } from './ConnectionManager'
import { DragManager } from './DragManager' // 新增导入
import { HoverManager } from './HoverManager'
import { MiniMap } from '@antv/x6-plugin-minimap'
import { History } from '@antv/x6-plugin-history'

export class GraphManager {
  constructor(vm) {
    this.vm = vm
    this.graph = null
    // 修改为按类别存储计数器
    this.nodeCounters = {
      '输入': 0,
      '环境': 0,
      '空间': 0,
      '输出': 0
    }
  }

  initGraph(container) {
    // this.registerCustomNode();

    this.graph = new Graph({
      width: 1300,
      height: 900,
      container,
      scroller: {
        enabled: true
      },
      mousewheel: {
        enabled: true,  // 启用鼠标滚轮缩放
        modifiers: ['ctrl', 'meta'],
      },
      panning: {
        enabled: true,  // 启用平移功能
        eventTypes: ['leftMouseDown', 'rightMouseDown', 'mouseWheel']
      },
      grid: {
        size: 10,
        visible: true,
        type: 'doubleMesh',
        args: [
          { color: '#eee', thickness: 1 },
          { color: '#ddd', thickness: 1, factor: 4 }
        ]
      },
      background: {
        color: '#fafafa'
      },
      embedding: {
        enabled: true,
      },
      connecting: ConnectionManager.getConnectionConfig(), // 替换原有的connecting配置

    })

    // 取消注释并修改History插件配置
    this.graph.use(
      new History({
        enabled: true,
        maxHistorySteps: 100 // 可以增加历史记录步数
      })
    )

    // 修改Transform插件配置
    this.graph.use(
      new Transform({
        resizing: {
          enabled: (cell) => {
            // 确保返回true且是环境节点
            const data = cell.getData?.();
            return cell.isNode() && data?.category === '环境';
          },
          minWidth: 240,
          maxWidth: 600,  // 增大最大宽度
          minHeight: 80,
          maxHeight: 800, // 增大最大高度
          orthogonal: false,
          restrict: false,
          autoScroll: true,
          preserveAspectRatio: false,
          allowReverse: true
        },
        rotating: false
      })
    )

    this.minimap = new MiniMap({
      container: document.getElementById('minimap-container'),
      padding: 20,
      scalable: true,
    })
    this.graph.use(this.minimap)


    this.setupEvents()
    return this.graph
  }

  // 在setupEvents方法中移除原来的mouseenter/mouseleave事件监听
  setupEvents() {
    // 初始化拖拽管理器
    DragManager.init(this.graph)
    DragManager.setupDragEvents(this.graph)


    // 添加右键点击事件监听
    // this.graph.on('cell:contextmenu', ({ cell }) => {
    //   if (confirm('确定要删除这个元素吗？')) {
    //     cell.remove()
    //   }
    // })

    this.graph.on('cell:contextmenu', ({ e, cell }) => {
      // this.isShow = true;
      // this.graph.resetSelection(cell);
      const elem = document.querySelector('.x6-menu-wrap');
      elem.style.top = `${e.clientY + 25}px`;
      elem.style.left = `${e.clientX + 25}px`;
      console.log(e, cell, 'e, cell')
      // elem.style.display = 'block';
      // this.type = cell.isNode() ? 'node' : 'edge';
    });


    // 保留非拖拽相关的事件
    this.graph.on('node:dblclick', ({ node }) => {
      this.vm.$emit('node-dblclick', node)
    })

    // 添加节点点击事件监听
    this.graph.on('node:click', ({ node }) => {
      // 清除所有节点的高亮状态
      this.graph.getNodes().forEach(n => {
        n.attr('body/stroke', this.getCategoryColor(n.getData()?.category).border);
      });

      // 设置当前节点高亮
      node.attr('body/stroke', '#FF0000'); // 红色边框高亮
      node.attr('body/strokeWidth', 3); // 加粗边框

      // 触发节点点击事件
      this.vm.$emit('node-click', node);
    });

    // 添加hover事件监听
    HoverManager.setupHoverEvents(this.graph)

    // 添加连线断开事件监听
    this.graph.on('edge:disconnect', ({ edge }) => {
      edge.remove()
    })

    // 添加连线移动事件监听
    this.graph.on('edge:mouseup', ({ edge }) => {
      if (!edge.getSourceCell() || !edge.getTargetCell()) {
        edge.remove()
      }
    })
    // 添加节点移动事件监听
    this.graph.on('node:change:position', ({ node }) => {
      return
      const nodeData = node.getData();

      if (nodeData?.category === '环境') {
        const children = this.graph.getNodes().filter(n =>
          n.getParent()?.id === node.id
        );

        // 根据记录的相对位置更新子节点
        children.forEach(child => {
          const childData = child.getData();
          if (childData?.__relativePos) {
            child.position(
              node.position().x + childData.__relativePos.x,
              node.position().y + childData.__relativePos.y,
              { silent: true }
            );
          }
        });
      }

      const nodes = this.graph.getNodes().filter(n => n.id !== node.id)
      if (this.checkNodesOverlap([node, ...nodes])) {
        // 如果发生碰撞，回退到之前的位置
        node.setPosition(node.previous('position'))
      }
    })
    // 添加节点拖拽结束事件
    this.graph.on('node:mouseup', ({ node }) => {
      const nodeData = node.getData()
      if (nodeData?.category === '空间') {
        const envNodes = this.graph.getNodes().filter(n =>
          n.getData()?.category === '环境'
        )

        const nodeBBox = node.getBBox()
        const parent = envNodes.find(env => {
          const envBBox = env.getBBox()
          return envBBox.containsPoint(nodeBBox.getCenter())
        })

        if (parent) {
          // 仅设置父子关系，不自动排列
          node.setParent(parent)
        } else if (node.getParent()) {
          node.setParent(null)
        }
      }
    })
  }

  registerCustomNode() {
    // 在initGraph方法中，移除节点注册时的contextmenu配置
    Graph.registerNode({
      shape: 'custom-node',
      markup: [
        {
          tagName: 'rect',
          selector: 'body'
        },
        {
          tagName: 'rect',
          selector: 'hoverBox'
        },
        {
          tagName: 'text',
          selector: 'label'
        },
        {
          tagName: 'rect',
          selector: 'hoverLabelBg'
        },
        {
          tagName: 'text',
          selector: 'hoverLabel'
        }
      ],
      // 基础缩放配置（会被节点级别配置覆盖）
      scale: {
        enabled: false // 默认禁用
      },

    }, true)
  }
  // 在addNode方法中确保有正确的attrs配置
  addNode(item, x, y) {
    const colorMap = {
      '输入': { bg: '#e1f3d8', border: '#a3e08d', width: 120, height: 40 },
      '环境': { bg: '#e6f7ff', border: '#91d5ff', width: 240, height: 120 },
      '空间': { bg: '#fdf6ec', border: '#f7d7a3', width: 120, height: 40 },
      '输出': { bg: '#f3e8ff', border: '#d3adf7', width: 120, height: 40 }
    }

    const category = this.getCategory(item.id)
    const config = colorMap[category] || colorMap['输入']
    // 获取并递增对应类别的计数器
    const nodeNumber = ++this.nodeCounters[category]
    // 检查新节点位置是否与其他节点重叠
    let position = { x, y }

    // 在addNode方法中修改空间节点配置
    const node = this.graph.addNode({
      x: position.x,
      y: position.y,
      width: config.width,
      height: config.height,
      label: `${item.label} #${nodeNumber}`, // 使用类别独立的编号
      nodeType: item.nodeType,
      attrs: {
        label: {
          fontSize: 12,
          fill: '#333',
          refY: category === '环境' ? -15 : 20, // 环境节点标签上移
          textAnchor: 'middle',
          textVerticalAnchor: 'middle'
        },
        body: {
          fill: config.bg,
          stroke: config.border,
          strokeWidth: 1,
          strokeDasharray: category === '环境' ? '5,5' : 'none',
          rx: 4,
          ry: 4,
          // 添加透明背景
          fillOpacity: category === '环境' ? '0.6' : 'none',
        },
      },
      // 为输入/输出节点添加连接桩
      ports: {
        groups: {
          right: {
            position: 'right',
            attrs: {
              circle: {
                r: 6,  // 增大半径从4到6
                magnet: true,
                stroke: '#5F95FF',
                strokeWidth: 1,
                fill: '#fff'
              }
            }
          },
          left: {
            position: 'left',
            attrs: {
              circle: {
                r: 6,  // 增大半径从4到6
                magnet: true,
                stroke: '#5F95FF',
                strokeWidth: 1,
                fill: '#fff'
              }
            }
          }
        },
        items: category === '输入' ? [
          { id: 'right', group: 'right' }
        ] : category === '输出' ? [
          { id: 'left', group: 'left' }
        ] : category === '空间' ? [
          { id: 'left', group: 'left' },
          { id: 'right', group: 'right' }
        ] : []
      },
      // 为环境节点添加可调整大小的配置
      resize: true, // 强制设置为true
      handles: {
        'top-right': true,
        'bottom-right': true,
        'bottom-left': true,
        'top-left': true
      },
      data: {
        category: category,
        nodeType: item.nodeType,
        formData: { description: '' },
        previousParent: null,
        embeddable: true,  // 确保空间节点可嵌入
        allowedParents: ['环境'], // 明确指定空间节点可以被环境包含
        droppable: true // 允许被拖入其他节点
      }
    })

    // 修改setupEvents中的节点拖拽事件
    this.graph.on('node:mousedown', ({ node }) => {
      if (node.getData()?.category === '环境') {
        const children = this.graph.getNodes().filter(n =>
          n.getParent()?.id === node.id
        );

        // 记录环境节点初始位置和子节点相对位置
        const parentPos = node.position();
        children.forEach(child => {
          const childPos = child.position();
          child.setData({
            __relativePos: {
              x: childPos.x - parentPos.x,
              y: childPos.y - parentPos.y
            }
          }, { silent: true });
        });
      }
    });

    this.graph.on('node:mouseup', ({ node }) => {
      if (node.getData()?.category === '环境') {
        // 清理拖拽状态
        node.setData({
          __initialPosition: undefined,
          __dragging: false
        }, { silent: true });

        const children = this.graph.getNodes().filter(n =>
          n.getParent()?.id === node.id
        );
        children.forEach(child => {
          child.setData({
            __initialOffset: undefined,
            __dragging: false
          }, { silent: true });
        });
      }
    });
    this.graph.on('node:mouseup', ({ node }) => {
      if (node.getData()?.category === '环境') {
        const children = this.graph.getNodes().filter(n =>
          n.getParent()?.id === node.id
        );

        // 清理临时数据
        children.forEach(child => {
          child.setData({
            __relativePos: undefined
          }, { silent: true });
        });
      }
    });
    this.graph.on('node:mouseup', ({ node }) => {
      const nodeData = node.getData()
      if (nodeData?.category === '空间') {
        const envNodes = this.graph.getNodes().filter(n =>
          n.getData()?.isGroup  // 查找所有群组节点
        )

        const nodeBBox = node.getBBox()
        const parent = envNodes.find(env => {
          const envBBox = env.getBBox()
          return envBBox.containsPoint(nodeBBox.getCenter())
        })

        if (parent) {
          node.setParent(parent)
          this.arrangeChildren(parent)
        } else if (node.getParent()) {
          node.setParent(null)
        }
      }
    })
    // 在addNode方法返回前添加
    if (category === '环境') {
      node.setData({
        ...node.getData(),
        resizable: true
      }, { silent: false }); // 确保触发更新
      node.attr('body/strokeDasharray', '5,5');
      node.resize(config.width, config.height); // 强制初始化尺寸
    }
    return node;
  }

  getCategory(itemId) {
    const categories = this.vm.componentCategories
    for (const category of categories) {
      if (category.items.some(item => item.id === itemId)) {
        return category.name
      }
    }
    return '输入'
  }


  // 检查节点间是否有重叠
  checkNodesOverlap(nodes) {
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const node1 = nodes[i]
        const node2 = nodes[j]

        // 获取节点类型
        const node1Data = node1.getData ? node1.getData() : {}
        const node2Data = node2.getData ? node2.getData() : {}

        // 跳过环境与空间节点的碰撞检测
        if ((node1Data.category === '环境' && node2Data.category === '空间') ||
          (node1Data.category === '空间' && node2Data.category === '环境')) {
          continue
        }

        // 只检查输入/输出节点之间以及它们与环境节点的碰撞
        const node1Check = node1Data.category === '输入' || node1Data.category === '输出'
        const node2Check = node2Data.category === '输入' || node2Data.category === '输出'
        const envCheck = node1Data.category === '环境' || node2Data.category === '环境'

        // 如果不是需要检查的组合，则跳过
        if (!((node1Check && node2Check) || (node1Check && envCheck) || (node2Check && envCheck))) {
          continue
        }

        // 获取边界框
        const bounds1 = node1.getBBox ? node1.getBBox() : {
          x: node1.position?.x || 0,
          y: node1.position?.y || 0,
          width: node1.size?.width || 0,
          height: node1.size?.height || 0
        }

        const bounds2 = node2.getBBox ? node2.getBBox() : {
          x: node2.position?.x || 0,
          y: node2.position?.y || 0,
          width: node2.size?.width || 0,
          height: node2.size?.height || 0
        }

        // 检查是否重叠
        if (!(bounds1.x + bounds1.width < bounds2.x ||
          bounds1.x > bounds2.x + bounds2.width ||
          bounds1.y + bounds1.height < bounds2.y ||
          bounds1.y > bounds2.y + bounds2.height)) {
          return true
        }
      }
    }
    return false
  }

  // 计算节点集合的边界
  calculateNodesBounds(nodes) {
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity

    nodes.forEach(node => {
      const bounds = node.getBBox()
      minX = Math.min(minX, bounds.x)
      minY = Math.min(minY, bounds.y)
      maxX = Math.max(maxX, bounds.x + bounds.width)
      maxY = Math.max(maxY, bounds.y + bounds.height)
    })

    return { minX, minY, maxX, maxY }
  }

  // 添加切换MiniMap显示的方法
  toggleMiniMap() {
    if (this.minimapContainer.style.display === 'none') {
      this.minimapContainer.style.display = 'block'
      this.minimap.update()
    } else {
      this.minimapContainer.style.display = 'none'
    }

    // 在需要时调用，例如：
    // this.graph.on('node:change:position', () => this.updateMiniMap());
    // this.graph.on('node:add', () => this.updateMiniMap());
    // this.graph.on('node:remove', () => this.updateMiniMap());
  }
  // 在GraphManager类中添加
  updateMiniMap() {
    if (this.minimap) {
      this.minimap.update();
    }
  }
  resetNodeCounter() {
    // 重置所有类别的计数器
    this.nodeCounters = {
      '输入': 0,
      '环境': 0,
      '空间': 0,
      '输出': 0
    }
  }

  // 添加美化方法
  beautifyGraph() {
    // 美化所有节点
    this.graph.getNodes().forEach(node => {
      const category = node.getData()?.category;

      // 根据节点类型应用不同样式
      node.attr({
        body: {
          strokeWidth: 2,
          stroke: this.getCategoryColor(category).border,
          fill: this.getCategoryColor(category).bg,
          shadow: {
            enabled: true,
            color: 'rgba(0,0,0,0.2)',
            blur: 5,
            offset: { x: 2, y: 2 }
          }
        },
        label: {
          fontSize: 14,
          fontWeight: 'bold'
        }
      });
    });

    // 美化所有连线
    this.graph.getEdges().forEach(edge => {
      edge.attr({
        line: {
          stroke: '#5F95FF',
          strokeWidth: 2,
          targetMarker: {
            name: 'block',
            size: 6
          },
          strokeDasharray: '0', // 实线
          style: {
            animation: 'ant-line 30s infinite linear'
          }
        }
      });
    });
  }

  // 辅助方法：获取类别颜色
  getCategoryColor(category) {
    const colorMap = {
      '输入': { bg: '#e1f3d8', border: '#67C23A' },
      '环境': { bg: '#e6f7ff', border: '#1890FF' },
      '空间': { bg: '#fdf6ec', border: '#E6A23C' },
      '输出': { bg: '#f3e8ff', border: '#722ED1' },
      'default': { bg: '#f5f5f5', border: '#d9d9d9' }
    };
    return colorMap[category] || colorMap.default;
  }

  // 在GraphManager类中添加undo/redo方法
  undo() {
    if (this.graph.canUndo()) {
      this.graph.undo()
    }
  }

  redo() {
    if (this.graph.canRedo()) {
      this.graph.redo()
    }
  }

  // 可以添加状态检查方法
  canUndo() {
    return this.graph.canUndo()
  }

  canRedo() {
    return this.graph.canRedo()
  }
}

