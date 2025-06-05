<template>
    <div>
        <div style="margin-bottom: 20px;">
            <button @click="addRectNode">添加矩形节点</button>
            <button @click="addCircleNode">添加矩形节点2</button>
            <button @click="addResizableRectNode">添加可调整矩形</button>
            <button @click="addGroup">添加群组</button>  <!-- 新增群组按钮 -->
            <button @click="connectNodes">连接节点</button>
        </div>
        <div ref="container" style="height: 500px; border: 1px solid #ccc;"></div>
    </div>
</template>

<script>
import { Graph } from '@antv/x6';

export default {
    name: 'X6Demo',
    data() {
        return {
            graph: null,
            nodes: []
        };
    },
    mounted() {
        this.initGraph();
    },
    methods: {
        initGraph() {
            this.graph = new Graph({  // Removed unused 'graph' variable
                resizing: true,
                container: this.$refs.container,
                width: 800,
                height: 500,
                grid: true,
                connecting: {
                    snap: {
                        radius: 30,  // 增加吸附半径
                    },
                    allowBlank: false,
                    allowMulti: false,
                    highlight: true,
                    createEdge: () => {
                        return this.graph.createEdge({
                            router: {
                                name: 'manhattan',
                                args: {
                                    startDirections: ['right','bottom'],
                                    endDirections: ['left'],
                                    padding: 30,  // 增加偏移距离
                                    excludeEndpoints: ['top', 'bottom'],  // 避免上下连接
                                }
                            },
                            connector: {
                                name: 'smooth',
                                args: {
                                    raw: true,
                                    direction: 'horizontal',  // 优先水平方向
                                }
                            },
                            attrs: {
                                line: {
                                    stroke: '#1890ff',
                                    strokeWidth: 2,
                                    strokeDasharray: '0',  // 移除虚线效果
                                    targetMarker: {
                                        name: 'classic',  // 改为经典箭头
                                        size: 10,  // 箭头大小
                                    },
                                    connection: true,
                                    strokeLinejoin: 'round',
                                    strokeLinecap: 'round'  // 线条端点圆角
                                },
                            },
                        });
                    }
                }
            });

            // 移除自动连接按钮的事件监听
            this.graph.on('edge:connected', ({ edge }) => {
                edge.attr('line/stroke', '#52c41a'); // 连接成功变为绿色
                console.log('手动连接成功:', {
                    source: edge.getSource(),
                    target: edge.getTarget()
                });
            });

            // 连接成功事件
            this.graph.on('edge:connected', ({ edge }) => {
                edge.attr('line/stroke', '#52c41a');
                edge.setData({ connected: true }); // 标记为已连接
                console.log('连接成功:', edge);
            });

            // 添加删除连线功能
            this.graph.on('edge:click', ({ edge }) => {
                const edgeData = edge.getData() || {};
                if (edgeData.connected) {
                    if (confirm('确定要删除这条连线吗?')) {  // Changed to standard confirm
                        edge.remove();
                        console.log('连线已删除');
                    }
                }
            });

            // 允许重新连接
            this.graph.on('edge:mouseenter', ({ edge }) => {
                edge.addTools([
                    'source-arrowhead',
                    'target-arrowhead',
                    {
                        name: 'button-remove',
                        args: {
                            distance: -30
                        }
                    }
                ]);
            });

            this.graph.on('edge:mouseleave', ({ edge }) => {
                edge.removeTools();
            });

        },

        // 移除原来的connectNodes方法
        addRectNode() {
            const node = this.graph.addNode({
                x: 100 + Math.random() * 300,
                y: 100 + Math.random() * 200,
                width: 80,
                height: 40,
                label: '矩形节点',
                ports: {
                    groups: {
                        out: {
                            position: 'right',
                            attrs: {
                                circle: {
                                    r: 5,
                                    magnet: true,
                                    stroke: '#31d0c6',
                                    fill: '#fff',
                                },
                            },
                        },
                        in: {
                            position: 'left',
                            attrs: {
                                circle: {
                                    r: 5,
                                    magnet: true,
                                    stroke: '#31d0c6',
                                    fill: '#fff',
                                },
                            },
                        },
                    },
                    items: [
                        { id: 'out', group: 'out' }, // 单个输出端口
                        { id: 'in', group: 'in' }     // 单个输入端口
                    ],
                },
            });
            this.nodes.push(node);
        },

        addCircleNode() {
            const node = this.graph.addNode({
                x: 100 + Math.random() * 300,
                y: 100 + Math.random() * 200,
                width: 80,
                height: 40,
                label: '矩形节点2',
                ports: {
                    groups: {
                        out: {
                            position: 'right',
                            attrs: {
                                circle: {
                                    r: 5,
                                    magnet: true,
                                    stroke: '#31d0c6',
                                    fill: '#fff',
                                },
                            },
                        },
                        in: {
                            position: 'left',
                            attrs: {
                                circle: {
                                    r: 5,
                                    magnet: true,
                                    stroke: '#31d0c6',
                                    fill: '#fff',
                                },
                            },
                        },
                    },
                    items: [
                        { id: 'out', group: 'out' }, // 单个输出端口
                        { id: 'in', group: 'in' }    // 单个输入端口
                    ],
                },
            });
            this.nodes.push(node);
        },

        connectNodes() {
            if (this.nodes.length < 2) {
                alert('请先添加至少2个节点');
                return;
            }

            // 连接最后两个添加的节点
            const source = this.nodes[this.nodes.length - 2];
            const target = this.nodes[this.nodes.length - 1];

            this.graph.addEdge({
                source: { cell: source.id, port: 'out' },  // Changed from 'out-1' to 'out'
                target: { cell: target.id, port: 'in' },    // Changed from 'in-1' to 'in'
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
            });
        },  // Add comma here

        addResizableRectNode() {
            const node = this.graph.addNode({
                x: 100 + Math.random() * 300,
                y: 100 + Math.random() * 200,
                width: 120,
                height: 60,
                label: '可调整矩形',
                resizable: {
                    enabled: true,  // 修改为对象配置
                    minWidth: 80,
                    maxWidth: 200,
                    minHeight: 40,
                    maxHeight: 100
                },
                ports: {
                    groups: {
                        out: {
                            position: 'right',
                            attrs: { circle: { r: 5, magnet: true, stroke: '#ff4d4f' } }
                        },
                        in: {
                            position: 'left',
                            attrs: { circle: { r: 5, magnet: true, stroke: '#ff4d4f' } }
                        }
                    },
                    items: [
                        { id: 'out', group: 'out' },
                        { id: 'in', group: 'in' }
                    ]
                },
                attrs: {
                    body: {
                        stroke: '#ff4d4f',
                        fill: '#fff1f0',
                        strokeWidth: 2
                    },
                    label: {
                        fill: '#ff4d4f'
                    }
                }
            });
            this.nodes.push(node);
        }
    },  // Closing methods object
    addGroup() {
        const group = this.graph.addNode({
            x: 100,
            y: 100,
            width: 300,
            height: 200,
            label: '群组',
            attrs: {
                body: {
                    stroke: '#9254de',
                    strokeWidth: 2,
                    fill: 'rgba(146,84,222,0.1)',  // 改为半透明填充
                    rx: 6,
                    ry: 6
                },
                label: {
                    fill: '#9254de',
                    fontSize: 16
                }
            },
            zIndex: -1,
            data: {
                isGroup: true
            }
        });

        // 添加群组拖拽事件
        group.on('change:position', () => {
            const children = this.graph.getNeighbors(group, {
                incoming: false,
                outgoing: false
            });
            children.forEach(child => {
                const relativePos = {
                    x: child.position().x - group.position().x,
                    y: child.position().y - group.position().y
                };
                child.setData({ 
                    groupX: relativePos.x,
                    groupY: relativePos.y
                });
            });
        });

        // 自动调整大小
        group.on('change:size', ({ current }) => {
            const children = this.graph.getNeighbors(group, {
                incoming: false,
                outgoing: false
            });
            
            let needResize = false;
            let newWidth = current.width;
            let newHeight = current.height;
            
            children.forEach(child => {
                const childBounds = child.getBBox();
                if (childBounds.right > group.position().x + current.width - 20) {
                    needResize = true;
                    newWidth = Math.max(newWidth, childBounds.right - group.position().x + 20);
                }
                if (childBounds.bottom > group.position().y + current.height - 20) {
                    needResize = true;
                    newHeight = Math.max(newHeight, childBounds.bottom - group.position().y + 20);
                }
            });
            
            if (needResize) {
                group.prop('size', { width: newWidth, height: newHeight });
            }
        });
    }
}  // 确保addGroup在methods对象内
</script>