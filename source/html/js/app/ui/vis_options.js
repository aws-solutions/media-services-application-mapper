/*! Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
       SPDX-License-Identifier: Apache-2.0 */

export const diagram_pre_options = {
    layout: {
        hierarchical: {
            enabled: true,
        },
    },
    physics: {
        enabled: false,
    },
    interaction: {
        dragNodes: true,
        dragView: true,
        hideEdgesOnDrag: false,
        hideNodesOnDrag: false,
        hover: true,
        hoverConnectedEdges: true,
        keyboard: {
            enabled: false,
            speed: {
                x: 10,
                y: 10,
                zoom: 0.02,
            },
            bindToWindow: true,
        },
        multiselect: true,
        navigationButtons: true,
        selectable: true,
        selectConnectedEdges: true,
        tooltipDelay: 300,
        zoomView: false,
    },
};

export const with_layout = {
    layout: {
        improvedLayout: true,
    },
    nodes: {
        widthConstraint: {
            maximum: 200,
        },
    },
    edges: {
        smooth: {
            enabled: false,
        },
    },
    physics: {
        enabled: true,
        minVelocity: 25,
        stabilization: {
            enabled: true,
            iterations: 10,
        },
    },
    interaction: {
        dragNodes: true,
        dragView: true,
        hideEdgesOnDrag: false,
        hideNodesOnDrag: false,
        hover: true,
        hoverConnectedEdges: true,
        keyboard: {
            enabled: false,
            speed: {
                x: 10,
                y: 10,
                zoom: 0.02,
            },
            bindToWindow: true,
        },
        multiselect: true,
        navigationButtons: true,
        selectable: true,
        selectConnectedEdges: true,
        tooltipDelay: 300,
        zoomView: false,
    },
};

export const without_layout = {
    layout: {
        hierarchical: {
            enabled: false,
        },
    },
    edges: {
        smooth: {
            enabled: false,
        },
    },
    physics: {
        enabled: false,
    },
    interaction: {
        dragNodes: true,
        dragView: true,
        hideEdgesOnDrag: false,
        hideNodesOnDrag: false,
        hover: true,
        hoverConnectedEdges: true,
        keyboard: {
            enabled: false,
            speed: {
                x: 10,
                y: 10,
                zoom: 0.02,
            },
            bindToWindow: true,
        },
        multiselect: true,
        navigationButtons: true,
        selectable: true,
        selectConnectedEdges: true,
        tooltipDelay: 300,
        zoomView: false,
    },
};

export const vertical_layout = {
    layout: {
        hierarchical: {
            enabled: true,
            direction: "UD",
            sortMethod: "hubsize",
            nodeSpacing: 250,
            treeSpacing: 250,
            levelSeparation: 250,
        },
    },
    edges: {
        smooth: {
            enabled: false,
        },
    },
    physics: {
        enabled: false,
    },
};

export const horizontal_layout = {
    layout: {
        hierarchical: {
            enabled: true,
            direction: "LR",
            sortMethod: "hubsize",
            nodeSpacing: 250,
            treeSpacing: 250,
            levelSeparation: 350,
        },
    },
    edges: {
        smooth: {
            enabled: false,
        },
    },
    physics: {
        enabled: false,
    },
};
