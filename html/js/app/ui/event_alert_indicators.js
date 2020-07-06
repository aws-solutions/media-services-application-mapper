/*! Copyright 2018 Amazon.com, Inc. or its affiliates. All Rights Reserved.
       SPDX-License-Identifier: Apache-2.0 */

define(["jquery", "lodash", "app/model", "app/events", "app/ui/diagrams"],
    function($, _, model, event_alerts, diagrams) {

        /**
         * Retrieve all edges beginning with the given arn.
         * @param {String} arn The assigned ARB 
         * @returns {DataSet[]} The found DataSet edges.
         */
        const getEdges = (arn, reverse) => {
            const opts = {
                filter: ({ id, data = {} }) => (id.startsWith(arn) && data.from === arn),
            };
            if (reverse) {
                opts.filter = ({ data = {} }) => (data.to === arn);
            }
            const edges = model.edges.get(opts);

            return _.isArray(edges) ? edges : [edges];
        };

        /**
         * Retrieve all edges beginning with the given arn and belonging to the given pipeline.
         * @param {String} arn The assigned ARB 
         * @param {Number} pipeline The assigned pipeline number
         * @returns {DataSet[]} The found DataSet edges.
         */
        const getEdgesByPipeline = (arn, pipeline) => getEdges(arn)
            .filter(({ id, data }) => (id.endsWith(`:${pipeline}`) && data.pipeline === pipeline));

        /**
         * Update the node on all containing diagrams
         * @param {DataSet} node The DataSet node provided by the model.
         * @param {Boolean} alertState If true, the containing diagram will update its alert indicator.
         * @param {String} dataSet Default to 'nodes. Only other possible option is 'edges'.
         */
        const updateUIHandler = (node, alertState = true, dataSet = 'nodes') => {
            let matches = diagrams.have_all([node.id]);

            if (!matches || (_.isArray(matches) && !matches.length) && dataSet === 'edges') {
                /**
                 * When it comes to edges, the `diagrams.have_all([node.id])` is not reliant.
                 * A diagram can very well contain the edge id and still return empty.
                 * 
                 * Therefore, only if the `dataSet === 'edges'` and no diagram matches came back,
                 * we run thru this "double check" that essentially find diagrams that in fact do
                 * contain the edge in question and adds the diagram to the list of matches.
                 */
                const plnum = parseInt(node.id.split(':').pop());
                const all_diagrams = diagrams.get_all();

                for (const key in all_diagrams) {
                    if (all_diagrams.hasOwnProperty(key)) {
                        const diag = all_diagrams[key];
                        const foundEdge = diag[dataSet].get({ 
                            filter: ({ id, data }) => {
                                return (id === node.id && data.pipeline === plnum);
                            },
                        });

                        if (foundEdge.length) {
                            matches.push(diag);
                        }
                    }
                }
            }

            for (let diagram of matches) {
                diagram[dataSet].update(node);
                diagram.alert(alertState);
            }
        };

        const updateAlertHandler = (node, alertState = true, alertDetails = {}) => {
            let selected = null;
            let unselected = null;
            let newState = 'normal';

            if (node.degraded) {
                newState = 'degraded';
                selected = node.render.degraded_selected();
                unselected = node.render.degraded_unselected();
            } else if (node.alerting) {
                newState = 'alerting';
                selected = node.render.alert_selected();
                unselected = node.render.alert_unselected();
            } else {
                selected = node.render.normal_selected();
                unselected = node.render.normal_unselected();
            }

            if (selected != node.image.selected || unselected != node.image.unselected) {
                /** Update the node */
                node.image.selected = selected;
                node.image.unselected = unselected;
                model.nodes.update(node);
                updateUIHandler(node, alertState);
            }
            
            const newEdgeOpts = {
                color: { color: newState !== 'normal' ? 'red' : 'black' },
                dashes: newState !== 'normal',
                hoverWidth: 1
            };
            const edges = !_.has(alertDetails, 'pipeline') ? getEdges(node.id) 
                : getEdgesByPipeline(node.id, parseInt(alertDetails.pipeline || 0));

            /** Update the edges */
            edges.forEach(edge => {
                if (edge.color.color !== newEdgeOpts.color.color || edge.dashes !== newEdgeOpts.dashes) {
                    edge.color = newEdgeOpts.color;
                    edge.dashes = newEdgeOpts.dashes;
                    edge.hoverWidth = newEdgeOpts.hoverWidth;
                    model.edges.update(edge);
                    updateUIHandler(edge, alertState, 'edges');

                    console.log(`
                        Updating Pipeline ${edge.data.pipeline}
                            From ${edge.from} To ${edge.to}
                            Other Pipeline should be:
                                Pipeline ${edge.data.pipeline} 
                                    From 'Somewhere' To ${edge.from}
                    `)

                    const otherEdges = getEdges(node.id, true)
                        .filter(e => e.data.pipeline === edge.data.pipeline);
                    console.log('Other Edges => %o', otherEdges);

                    otherEdges.forEach(oedge => {
                        if (oedge.color.color !== newEdgeOpts.color.color || oedge.dashes !== newEdgeOpts.dashes) {
                            oedge.color = newEdgeOpts.color;
                            oedge.dashes = newEdgeOpts.dashes;
                            oedge.hoverWidth = newEdgeOpts.hoverWidth;
                            model.edges.update(oedge);
                            updateUIHandler(oedge, alertState, 'edges');
                        }
                    });
                }
            });
        };

        const updateEventAlertState = (current_alerts, previous_alerts) => {
            /** iterate through current 'set' alerts */
            const alerting_nodes = [];
            const inactive_nodes = [];
            const degraded_nodes = [];

            for (let item of current_alerts) {
                const node = model.nodes.get(item.resource_arn);
                
                if (node) {
                    node.alerting = true;
                    node.degraded = _.has(item, "detail") && _.has(item.detail, "degraded") 
                        ? item.detail.degraded : false;
                    

                    if (node.degraded) {
                        if (!degraded_nodes.includes(item.resource_arn)) {
                            degraded_nodes.push(item.resource_arn);
                            updateAlertHandler(node, true, item.detail);
                        }
                    } else {
                        /**
                         * if node is not degraded, we still need to check that the resource_arn
                         * is not included in the degraded_nodes array. If it is, that means
                         * the other pipeline is degraded, therefore we do not alert.
                         */
                        if (!alerting_nodes.includes(item.resource_arn) && !degraded_nodes.includes(item.resource_arn)) {
                            alerting_nodes.push(item.resource_arn);
                            updateAlertHandler(node, true, item.detail);
                        }
                    }
                }
            }

            /** calculate the current alerts not included in the previous alerts */
            for (let previous of previous_alerts) {
                let found = false;

                for (let arn of alerting_nodes) {
                    found = found || arn === previous.resource_arn;
                    if (found) {
                        break;
                    }
                }

                if (!found) {
                    inactive_nodes.push(previous.resource_arn);
                }
            }

            /** 'unalert' the nodes that are no longer alerting */
            for (let arn of inactive_nodes) {
                const node = model.nodes.get(arn);

                if (node) {
                    node.alerting = false;
                    node.degraded = _.includes(degraded_nodes, arn);

                    updateAlertHandler(node, false);
                }
            }
        };

        event_alerts.add_callback(updateEventAlertState);
    });