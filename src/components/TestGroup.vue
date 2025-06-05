<template>
    <div>
        <div style="margin-bottom: 20px;">
            <button @click="createGroup">创建群组</button>
            <button @click="addInputNode">添加输入节点</button>
            <button @click="addProcessNode">添加处理节点</button>
        </div>
        <div ref="container" style="margin-top:100px;height: 600px; border: 1px solid #ccc;"></div>
    </div>
</template>

<script>
import { Graph, Shape } from '@antv/x6'
// Remove unused Rectangle import
// import { Rectangle } from '@antv/x6-geometry'

export default {
    name: 'GroupDemo',
    data() {
        return {
            graph: null,
            currentGroup: null
        }
    },
    mounted() {
        this.initGraph()
    },
    methods: {
        initGraph() {
            this.graph = new Graph({
                container: this.$refs.container,
                width: 800,
                height: 600,
                grid: true,
                embedding: {
                    enabled: true,
                    findParent: ({ node }) => {
                        if (node.prop('nodeType') === 'process' && node.getData('allowGroup') !== false) {
                            const groups = this.graph.getNodes().filter(n => n.prop('group') === true)
                            // Get node's bounding box
                            const nodeBBox = node.getBBox()
                            // Find groups that contain the node's center point
                            return groups.filter(group => {
                                const groupBBox = group.getBBox()
                                return groupBBox.containsPoint(nodeBBox.getCenter())
                            })
                        }
                        return []
                    }
                },
                plugins: [
                    {
                        name: 'transform',
                        args: {
                            resizing: true,  // Enable resize handles
                            rotating: false, // Disable rotation
                            // Customize handle appearance
                            resizeHandle: {
                                width: 8,
                                height: 8,
                                fill: '#1890ff',
                                stroke: '#ffffff'
                            }
                        }
                    }
                ]
            })

            // 群组碰撞检测逻辑
            this.graph.on('node:change:position', ({ node }) => {
                if (node.prop('group')) {
                    // 检查群组与其他群组的重叠
                    const otherGroups = this.graph.getNodes().filter(n => n.prop('group') && n.id !== node.id)
                    const overlappingGroup = otherGroups.find(group => {
                        const groupBounds = group.getBBox()
                        const nodeBounds = node.getBBox()
                        return (
                            nodeBounds.x < groupBounds.x + groupBounds.width &&
                            nodeBounds.x + nodeBounds.width > groupBounds.x &&
                            nodeBounds.y < groupBounds.y + groupBounds.height &&
                            nodeBounds.y + nodeBounds.height > groupBounds.y
                        )
                    })

                    if (overlappingGroup) {
                        // 恢复群组到之前的位置
                        const prevPosition = node.getProp('prevPosition') || { x: 200, y: 100 }
                        node.position(prevPosition.x, prevPosition.y, { silent: true })
                        return
                    }
                    // 保存当前位置作为下次比较的基准
                    node.setProp('prevPosition', node.position())
                }
                if (node.prop('nodeType') === 'input') {
                    const groups = this.graph.getNodes().filter(n => n.prop('group'))

                    // 检查是否与任何群组接触或重叠
                    const overlappingGroup = groups.find(group => {
                        const groupBounds = group.getBBox()
                        const nodeBounds = node.getBBox()
                        // 扩大群组边界10px作为缓冲区
                        const expandedGroupBounds = {
                            x: groupBounds.x - 10,
                            y: groupBounds.y - 10,
                            width: groupBounds.width + 20,
                            height: groupBounds.height + 20
                        }
                        return (
                            nodeBounds.x < expandedGroupBounds.x + expandedGroupBounds.width &&
                            nodeBounds.x + nodeBounds.width > expandedGroupBounds.x &&
                            nodeBounds.y < expandedGroupBounds.y + expandedGroupBounds.height &&
                            nodeBounds.y + nodeBounds.height > expandedGroupBounds.y
                        )
                    })

                    if (overlappingGroup) {
                        const groupBounds = overlappingGroup.getBBox()
                        // 计算节点应该在群组外的位置（10px间距）
                        let newX = node.position().x
                        let newY = node.position().y

                        // 计算节点与群组中心的相对位置
                        const groupCenterX = groupBounds.x + groupBounds.width / 2
                        const groupCenterY = groupBounds.y + groupBounds.height / 2
                        const nodeCenterX = newX + node.size().width / 2
                        const nodeCenterY = newY + node.size().height / 2

                        // 根据相对位置决定推离方向
                        if (nodeCenterX < groupCenterX) { // 节点在群组左侧
                            newX = groupBounds.x - node.size().width - 10
                        } else { // 节点在群组右侧
                            newX = groupBounds.x + groupBounds.width + 10
                        }

                        if (nodeCenterY < groupCenterY) { // 节点在群组上方
                            newY = groupBounds.y - node.size().height - 10
                        } else { // 节点在群组下方
                            newY = groupBounds.y + groupBounds.height + 10
                        }

                        node.position(newX, newY, { silent: true })
                    }
                }
            })
        },

        createGroup() {
            this.currentGroup = new Shape.Rect({
                x: 200,
                y: 100,
                width: 200,
                height: 100,
                resizable: {
                    enabled: true,
                    minWidth: 80,  // 最小宽度
                    minHeight: 60, // 最小高度
                    maxWidth: 600, // 最大宽度限制
                    maxHeight: 400, // 最大高度限制
                    preserveAspectRatio: false, // 不保持宽高比
                    orthogonal: true, // 正交调整
                    allowReverse: true, // 允许反向调整
                    handles: {
                        // 自定义调整手柄样式
                        'top': { attrs: { 'stroke-width': 1, stroke: '#1890ff' } },
                        'right': { attrs: { 'stroke-width': 1, stroke: '#1890ff' } },
                        'bottom': { attrs: { 'stroke-width': 1, stroke: '#1890ff' } },
                        'left': { attrs: { 'stroke-width': 1, stroke: '#1890ff' } },
                        'top-right': { attrs: { 'stroke-width': 1, stroke: '#1890ff' } },
                        'bottom-right': { attrs: { 'stroke-width': 1, stroke: '#1890ff' } },
                        'bottom-left': { attrs: { 'stroke-width': 1, stroke: '#1890ff' } },
                        'top-left': { attrs: { 'stroke-width': 1, stroke: '#1890ff' } }
                    }
                },
                draggable: true,
                attrs: {
                    body: {
                        stroke: '#1890ff',
                        fill: 'rgba(24,144,255,0.1)',
                        strokeWidth: 2,
                        rx: 4, // 圆角
                        ry: 4  // 圆角
                    },
                    label: {
                        text: '我的群组',
                        fontSize: 14,
                        refX: '50%',
                        refY: '50%',
                        textAnchor: 'middle',
                        textVerticalAnchor: 'middle'
                    }
                },
                zIndex: -1,
                group: true
            });

            // 添加调整大小事件监听
            this.currentGroup.on('resize', ({ size }) => {
                console.log(size, 'size')
                this.adjustGroupContent(this.currentGroup);
            });

            this.graph.addNode(this.currentGroup);
            this.currentGroup.setProp('prevPosition', { x: 200, y: 100 });
        },

        // 调整群组内容布局
        adjustGroupContent(group) {
            const processNodes = this.graph.getNodes().filter(n =>
                n.prop('nodeType') === 'process' &&
                n.getParent()?.id === group.id
            );

            if (processNodes.length === 0) return;

            const groupBounds = group.getBBox();
            const padding = 20;
            const contentWidth = groupBounds.width - 2 * padding;
            const contentHeight = groupBounds.height - 2 * padding;

            // 简单网格布局
            const cols = Math.ceil(Math.sqrt(processNodes.length));
            const rows = Math.ceil(processNodes.length / cols);
            const cellWidth = contentWidth / cols;
            const cellHeight = contentHeight / rows;

            processNodes.forEach((node, index) => {
                const col = index % cols;
                const row = Math.floor(index / cols);
                const x = groupBounds.x + padding + col * cellWidth + cellWidth / 2 - node.size().width / 2;
                const y = groupBounds.y + padding + row * cellHeight + cellHeight / 2 - node.size().height / 2;

                node.position(x, y, { silent: true });
            });
        },

        addInputNode() {
            const node = this.graph.addNode({
                x: 50,
                y: 50,
                width: 100,
                height: 40,
                label: '输入模块',
                nodeType: 'input',
                attrs: {
                    body: {
                        fill: '#2ECC71',
                        stroke: '#27AE60'
                    },
                    label: {
                        fill: '#fff'
                    }
                }
            })
            node.setEmbeddable(false)
            node.setData({ allowGroup: false }, { silent: true })
            // 移除鼠标事件处理，因为initGraph中的逻辑已经处理了
        },

        addProcessNode() {
            const node = this.graph.addNode({
                x: 50,
                y: 150,
                width: 100,
                height: 40,
                label: '处理模块',
                nodeType: 'process',
                attrs: {
                    body: {
                        fill: '#E67E22',
                        stroke: '#D35400'
                    },
                    label: {
                        fill: '#fff'
                    }
                },
                // 添加可嵌入配置
                embeddable: true,
                allowEmbed: true
            })
            // 确保节点可以被嵌入
            node.setEmbeddable(true)
            node.setData({ allowGroup: true }, { silent: true })
        }
    },

    initGraph() {
        this.graph = new Graph({
            container: this.$refs.container,
            width: 800,
            height: 600,
            grid: true,
            embedding: {
                enabled: true,
                findParent: ({ node }) => {
                    if (node.prop('nodeType') === 'process' && node.getData('allowGroup') !== false) {
                        const groups = this.graph.getNodes().filter(n => n.prop('group') === true)
                        // Get node's bounding box
                        const nodeBBox = node.getBBox()
                        // Find groups that contain the node's center point
                        return groups.filter(group => {
                            const groupBBox = group.getBBox()
                            return groupBBox.containsPoint(nodeBBox.getCenter())
                        })
                    }
                    return []
                }
            },
            plugins: [
                {
                    name: 'transform',
                    args: {
                        resizing: true,  // Enable resize handles
                        rotating: false, // Disable rotation
                        // Customize handle appearance
                        resizeHandle: {
                            width: 8,
                            height: 8,
                            fill: '#1890ff',
                            stroke: '#ffffff'
                        }
                    }
                }
            ]
        })

        // 群组碰撞检测逻辑
        this.graph.on('node:change:position', ({ node }) => {
            if (node.prop('group')) {
                // 检查群组与其他群组的重叠
                const otherGroups = this.graph.getNodes().filter(n => n.prop('group') && n.id !== node.id)
                const overlappingGroup = otherGroups.find(group => {
                    const groupBounds = group.getBBox()
                    const nodeBounds = node.getBBox()
                    return (
                        nodeBounds.x < groupBounds.x + groupBounds.width &&
                        nodeBounds.x + nodeBounds.width > groupBounds.x &&
                        nodeBounds.y < groupBounds.y + groupBounds.height &&
                        nodeBounds.y + nodeBounds.height > groupBounds.y
                    )
                })

                if (overlappingGroup) {
                    // 恢复群组到之前的位置
                    const prevPosition = node.getProp('prevPosition') || { x: 200, y: 100 }
                    node.position(prevPosition.x, prevPosition.y, { silent: true })
                    return
                }
                // 保存当前位置作为下次比较的基准
                node.setProp('prevPosition', node.position())
            }
            if (node.prop('nodeType') === 'input') {
                const groups = this.graph.getNodes().filter(n => n.prop('group'))

                // 检查是否与任何群组接触或重叠
                const overlappingGroup = groups.find(group => {
                    const groupBounds = group.getBBox()
                    const nodeBounds = node.getBBox()
                    // 扩大群组边界10px作为缓冲区
                    const expandedGroupBounds = {
                        x: groupBounds.x - 10,
                        y: groupBounds.y - 10,
                        width: groupBounds.width + 20,
                        height: groupBounds.height + 20
                    }
                    return (
                        nodeBounds.x < expandedGroupBounds.x + expandedGroupBounds.width &&
                        nodeBounds.x + nodeBounds.width > expandedGroupBounds.x &&
                        nodeBounds.y < expandedGroupBounds.y + expandedGroupBounds.height &&
                        nodeBounds.y + nodeBounds.height > expandedGroupBounds.y
                    )
                })

                if (overlappingGroup) {
                    const groupBounds = overlappingGroup.getBBox()
                    // 计算节点应该在群组外的位置（10px间距）
                    let newX = node.position().x
                    let newY = node.position().y

                    // 计算节点与群组中心的相对位置
                    const groupCenterX = groupBounds.x + groupBounds.width / 2
                    const groupCenterY = groupBounds.y + groupBounds.height / 2
                    const nodeCenterX = newX + node.size().width / 2
                    const nodeCenterY = newY + node.size().height / 2

                    // 根据相对位置决定推离方向
                    if (nodeCenterX < groupCenterX) { // 节点在群组左侧
                        newX = groupBounds.x - node.size().width - 10
                    } else { // 节点在群组右侧
                        newX = groupBounds.x + groupBounds.width + 10
                    }

                    if (nodeCenterY < groupCenterY) { // 节点在群组上方
                        newY = groupBounds.y - node.size().height - 10
                    } else { // 节点在群组下方
                        newY = groupBounds.y + groupBounds.height + 10
                    }

                    node.position(newX, newY, { silent: true })
                }
            }
        })
        // 处理模块嵌入群组后的调整逻辑
        this.graph.on('node:embedded', ({ node, parent }) => {
            if (node.prop('nodeType') === 'process' && parent.prop('group')) {
                this.adjustGroupSize(parent);
            }
        });

        // 处理模块位置变化时的调整
        this.graph.on('node:change:position', ({ node }) => {
            if (node.prop('nodeType') === 'process' && node.getParent()?.prop('group')) {
                this.adjustGroupSize(node.getParent());
            }
        });
    },

    // 调整群组大小以容纳所有子节点
    adjustGroupSize(group) {
        const processNodes = this.graph.getNodes().filter(n =>
            n.prop('nodeType') === 'process' &&
            n.getParent()?.id === group.id
        );

        if (processNodes.length > 0) {
            // 计算需要的最小群组尺寸
            const { minX, minY, maxX, maxY } = this.calculateNodesBounds(processNodes);
            const padding = 20; // 内边距

            // 调整群组位置和大小
            group.position(minX - padding, minY - padding, { silent: true });
            group.size(
                maxX - minX + 2 * padding,
                maxY - minY + 2 * padding,
                { silent: true }
            );
        }
    },

    // 检查节点间是否有重叠
    checkNodesOverlap(nodes) {
        for (let i = 0; i < nodes.length; i++) {
            for (let j = i + 1; j < nodes.length; j++) {
                if (nodes[i].getBBox().intersects(nodes[j].getBBox())) {
                    return true
                }
            }
        }
        return false
    },

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
    },
}
</script>