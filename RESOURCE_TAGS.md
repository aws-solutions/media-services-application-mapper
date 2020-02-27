# Using Resource Tags

Resources can be tagged to automate how MSAM processes and organizes the detected inventory.

## Diagram and Tile Placement

MSAM can automatically create and add resources to a diagram with the following tags:

`MSAM-Diagram`

Set the tag value to the diagram name. If the diagram already exists, MSAM will add it there. If the diagram does not exist, MSAM will create it first and add this resource.

`MSAM-Tile`

Set the tag value to the tile name. If the tile already exists, MSAM will add it there. If the diagram does not exist, MSAM will create it first and add this resource.

### Examples

#### Diagram Tag

The following example shows assigning the `MSAM-Diagram` tag to an S3 bucket with the value `Video Sources.` 

![S3 Bucket Tag](images/S3-diagram-tag.png)

After MSAM completes it's next scan for cloud resources in the AWS account, this bucket will appear on a diagram in the tool named `Video Sources.`

![Video Sources Diagram](images/video-sources-diagram-tag.png)

Even if you delete this diagram later, it will continue to reappear as long as this tag remains on the bucket.

#### Tile Tag

The following example shows assigning the `MSAM-Tile` tag to a MediaLive input and channel with the value `Channel 17.` Both the input and channel have the same tag and value.

![MediaLive Tag](images/tile-tag-input-channel.png)

After MSAM completes it's next scan for cloud resources in the AWS account, these two resources will be contained by a tile in the tool named `Channel 17.`

![Channel 17 Tile](images/tag-generated-tile.png)

Even if you delete this tile later, it will continue to reappear as long as this tag remains on both or either of the resources.

## SSM Managed EC2 and Hybrid Resources

MSAM can inventory and display EC2 and Hybrid systems that are managed by AWS Systems Manager. A hybrid system may be a physical host located in an on-premise data center that can be managed from the cloud.

The `MSAM-NodeType` tag can be used to the type of a resource when it is displayed within the browser tool. The value used for this tag can be anything meaningful to your environment, such as `Video Encoder` or `Network Firewall`.

It is required to add a role to the EC2 that includes permissions to interact with AWS Systems Manager. This role includes the general permissions required: 

`arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore`

The following example shows the `MSAM-Diagram` and `MSAM-NodeType` used together on an EC2.

![EC2 NodeType Tag](images/ec2-nodetype.png)

After MSAM completes it's next scan for cloud resources in the AWS account, this resources will be contained by a diagram in the tool named `VOD` and the type displayed on the node is `Special Encoder`.

![EC2 NodeType Tag](images/ec2-diagram-nodetype.png)
