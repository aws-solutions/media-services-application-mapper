# Media Services Application Mapper (MSAM)

**Installing? Use the detailed [installation instructions](INSTALL.md).**

**Already using MSAM? Please [take our survey](https://amazonmr.au1.qualtrics.com/jfe/form/SV_cBbBD6QulbrGdyl) and tell us how it's working for you.**

## Overview

* MSAM is a browser-based tool that allows operators to visualize the structure and logical connections among AWS Media Services and supporting services in the cloud
* MSAM can be used as a top-down resource monitoring tool when integrated with CloudWatch
* MSAM is installed into an AWS account with several CloudFormation templates


### Diagrams

* The user builds one or more diagrams with discovered resources from their AWS account. Diagram contents can be organized in any way that makes sense for the user's environment.

* The tool visualizes cloud resources as nodes and logical connections between resources as directed edges

* Edges (connections) on diagrams generally represent some type of data flow

![Simple Workflow](images/diagram-nodes-edges.png)
 
* Simple and complex workflows of Media Services resources can be discovered and represented
* Different types of service resources are visualized with unique color and textual indicators
* MSAM includes graphical tools to quickly build diagrams of related resources

The following image shows a diagram with several workflows including resources for AWS S3 buckets, CloudFront, MediaLive, MediaStore, MediaPackage, and a SPEKE key server.

![Complex Workflow](images/diagram-complex.png)

* MSAM is designed to be extended with new node types, connection discovery, visualization overlays, and tools
* Custom nodes can be added within the browser application directly, or cached into a database through a cloud-side task

The following image of an MSAM diagram shows on-premise equipment: Elemental Live encoder and several Firewalls with connectivity to cloud resources

![Customized Nodes](images/custom-nodes.jpeg)

* MSAM provides configuration data for each resource on the diagram

The following image shows the JSON configuration of a diagram node when it is selected in the diagram. This is the same configuration you would see from the response to a List or Describe API call directed to the service.

![Selected Item JSON](images/selected-item-json.jpeg)

### Tiles

* The tile view aggregates several related cloud resources into a single visual item
* Tiles are often used to represent a _streaming channel_ for monitoring
* Tiles can be created interactively, or through the REST API for bulk operations

The following image shows a tile view with several tiles. Each tile indicates the number of alerts and alarms aggregated from the underlying resources associated with the tile. Each tile also provides navigation back to the tile's resources on the diagram.

![Customized Nodes](images/channel-tiles.png)

* The tile view displays the aggregated media service configuration information for all resources included in the tile

The following image shows the aggregated JSON configuration of all the diagram elements assigned to the tile.

![Customized Nodes](images/channel-tile-json.jpeg)

### Resource Monitoring

* MSAM can be configured to automatcally display MediaLive pipeline alerts on MediaLive channel nodes
* The tool integrates with CloudWatch alarms to indicate operational problems from a top-down view
* Any CloudWatch alarm can be associated with any node on the diagram
* CloudWatch alarm indicators are visualized as color and text on the node
* CloudWatch high-resolution alarms can be used for frequent ten-second notification intervals

The following image shows a MediaLive input with an alarm status, and a MediaLive channel with an alarm status and three set alerts on pipeline 1.

![CloudWatch Support](images/cloudwatch-diagram.jpeg)

* MSAM's Monitor tab provides subscribed alarm and alert summary for each resource on the diagram

The following image shows the Monitor tab after selecting a MediaLive channel in the diagram that was showing several alarms and alerts.

![CloudWatch Support](images/monitor-tab.jpeg)

A tile aggregates all structure, configuration and status from the underlying assigned resources. If any resource's CloudWatch alarm assigned to a tile goes into alarm status, the tiles associated with that resource will also show the same status. See the image below.

![CloudWatch Support](images/alarm-channel-tiles.png)

### REST API

All browser actions are performed through an authenticated and SSL encrypted REST API hosted in the cloud. The API can be used by other tools to perform activities such as preloading tile definitions or adding custom content to the cache.

## Navigate

Navigate to [README](README.md) | [Workshop](WORKSHOP.md) | [Install](INSTALL.md) | [Usage](USAGE.md) | [Uninstall](UNINSTALL.md)
