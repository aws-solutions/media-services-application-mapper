# Change Log
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.12.0] - March 2023

### Added

* Integrated CDK into the solution to build CloudFormation templates
* Integrated Service Catalog AppRegistry Application into the solution

### Changed

* Updated Github Workflows

### Removed

* Removed existing CloudFormation templates from source/msam/build, source/events, and source/web-cloudformation directories

### Contributors

* @dch90

## [1.11.0] - August 2022

### New

```
#55 Attach freeform notes or links to any node
#58 Need a UI mechanism to manage many diagrams
#158 Tile behavior following ARN change
#159 Request to tag a preferred tile diagram
#236 Support for AWS Elemental MediaConnect JPEG XS/CDI
#255 Update vis.js packages
#267 Rework from RequireJS modules to native JavaScript modules
#310 Update post pipeline workflow
#315 Remove deprecated workflows
#316 Add eslint to workflows during content scan steps build-and-deploy
#328 Add CodeQL scan to PR workflow
#339 Clean up push workflow 
#343 Documentation for free form notes 
#344 Upgrade to Bootstrap 5.x
#349 Add a quick-hide button below the diagram lock 
#350 Turn off some tooltips on Manage Notes dialog 
#361 Review and update UI coloring from Bootstrap 4.x to 5.x 
```

### Fixed

```
#312 Update documentation links in README for IG
#320 Getting recent cloudwatch events can timeout when there's a lot of records
#323 Fix tile rendering with long names
#336 overlays.js is loaded too early in the bootstrapping process
#337 Diagram lock isn't repositioning after some window resize events
#352 Adjust spacing on right-side tile/diagram tab icon 
```


### Contributors
* @morjoan
* @JimTharioAmazon



## [1.10.0] - February 2022

### New

```
#180  Change never-cache-regions setting into the positive: cache-regions
#184  Add a Help menu with documentation and issue reporting links
#185  SSM Managed Instance tile includes system manager's instance name
#186  Please introduce a method to lock diagrams to prevent unwanted changes
#188  Pull and assemble /html/external during build time
#197  Deprecate build timestamps and use semantic versions for identification
#200  Connection dialog "Do Not Remember/Remember" button change request
#210  Convert remaining custom resources to use crhelper
#220  Integrate pa11y as a check in push and pull request workflows
#227  S3 bucket to MediaLive connection mapper missing s3:// URLs
#231  Support for AWS Elemental MediaLive CDI input type
#232  Update dependencies: lodash and handlebars
#237  Update S3 write scripts to check account ownership before write
#241  Rename 'master' branch to 'main'
#244  Remove packaged botocore and boto3
#272  Resource type metrics
#289  Add required pipeline files for Solutions build
```

### Fixed

```
#229  CI/CD failure
#230  cfn-nag false positives
#240  Update IAM role usage directions in Managed Instances guide
#243  Address pylint issues
#245  Use versions numbers versus build timestamps
#250  Address pa11y findings
#261  MediaConnect flow tag information doesn't show up in the UI
#264  Add region to S3 origin host names for CloudFront
#290  Change fictitious account #s to well-known fake account #s
#294  Changes for SonarQube findings
#297  Remove timestamps from template file names
```


### Contributors
* @morjoan
* @JimTharioAmazon



## [1.9.1] - May 2021


### Fixed
```
#233  Fix checking of pip exit code after loading dependencies  (build-and-deploy, enhancement)
#232  Update dependencies: lodash and handlebars                (front-end)
```

### Contributors
* @morjoan
* @JimTharioAmazon



## [1.9.0] - March 2021

### New
```
#187  Please enable point-in-time recovery by default for MSAM...  (back-end, enhancement, installation)
#189  Versions and Updates section in INSTALL.md needs an update   (documentation, installation)
#196  Update INSTALL.md showing stack descriptions with build ...  (bug, documentation, installation)
#205  Build script updates for error handling and rebuilds         (build-and-deploy, installation)
#216  Update REST API doc to include alarm subscription            (documentation)
#217  Create a document on how to use MSAM to monitor channels...  (documentation, front-end, monitoring feature)
#221  Multiple custom edges between nodes should be curved         (enhancement, front-end, visualization feature)
```

### Fixed
```
#193  Incorrect URL provided for root template install instruc...  (documentation, installation)
#219  Missing connection label from EMP CMAF endpoint to Cloud...  (bug, front-end)
```

### CI/CD Automation
```
#183  Configure GitHub Actions as an alternative MSAM build pi...  (build-and-deploy)
#194  Fix cfn-lint issues                                          (CI/CD finding, installation)
#195  Fix bandit issues found with hawkeye scanner                 (CI/CD finding, back-end)
#198  Fix remaining pylint issues                                  (CI/CD finding, back-end)
#203  Updates to development and process documentation             (documentation)
#204  Fix cfn-nag violations                                       (CI/CD finding, build-and-deploy, installation)
#218  Fix up jshint messages from workflows                        (CI/CD finding, front-end)
```

### Contributors
* @morjoan
* @JimTharioAmazon


## [1.8.0] - February 2021
### New
* Support UDP/RTP connections from MediaLive channel #162
* Documentation update request: Preserve user defined nodes when duplicating tables between two stacks #169
* Rework Implementation Guide at AWS Solutions Landing Page #172 #177
* Restructure MSAM project to align with the AWS Solutions layout #168

### Fixed
* MediaLive console links in Selected Item compartment are broken #167
* Updating BrowserAppBucket content location #173
* Remove Qualtrics survey from README.md #175 #179

### Contributors
* @morjoan
* @FahadHassanAmazon
* @roottool
* @JimTharioAmazon


## [1.7.5] - Oct 30, 2020
### ID: 1604080050
### Fixed
* Bug in tile view refresh #146
* Reduce the TTL in CloudFront for front-end application #147
* MediaLive standard channel connection issues require page refresh #154
* Node update process is still too aggressive #155
* Composite alarms aren't being returned: check DescribeAlarms calls #156

### New
* Provide a control to reduce or hide the lower compartment #70
* Searching can be confusing for new users #105
* Simplify AWS region selections/filters #113
* Support MediaLive channel to S3 bucket connections #127
* Update all Python Lambdas to 3.8.x #134
* Support MediaStore container to CloudFront distribution connections #136
* Support the new Elemental Link device MediaLive input #149
* Tile view filter selection persistence #151
* Provide control for clearing of all diagrams & tiles #153
* Request to add MSAM architecture diagram to install documentation #157

### Contributors
* @morjoan
* @JimTharioAmazon



## [1.7.0] - Jul 13, 2020
### ID: 1594682397

### Changed
* Add visual changes to connections in response to MediaLive channel and multiplex pipeline alerts #84
* Increase the number of alarms that can be handled by the subscription dialog #143

### Contributors
* @morjoan
* @Joaquin6
* @JimTharioAmazon



## [1.6.8] - Jun 5, 2020
### ID: 1594682397

### Changed
* Add Alert (event) support for MediaConnect #74
* Add managed policy for installation permissions PR #137
* Bundle 3rd-party dependencies with the web deployment content #135
* Exception in periodic task for alarm update #133
* INSTALL.md updates for template migration and alarm/event template dependency #139
* Migration tool to duplicate table data between stacks #128
* Pipeline alert overlay shows [A,B] for single pipelines #115
* Use event notification mechanisms for receiving alarm state changes #59

### Contributors
* @morjoan
* @Joaquin6
* @devonbleak
* @JimTharioAmazon



## [1.6.5] - Apr 20, 2020
### ID: 1587415980

### Changed
* Create a separate CloudFormation template for IAM policies/roles #122
* Supply an IAM policy with permissions suitable to install MSAM #123

### Contributors
* @morjoan
* @JimTharioAmazon


## [1.6.0] - Apr 7, 2020
### ID: 1586290481

### Changed
* Represent multi-pipeline resources with multiple connections in diagrams
* Yellow alert (degraded) color applied when a subset of a resource's pipelines are affected
* Red alert (failure) color applied when all of a resource's pipelines are affected
* Logging basic operational metrics for Elemental Live on-premise encoders to CloudWatch
* Reduce/tune IAM permissions for Lambda roles

### Contributors
* @morjoan
* @Joaquin6
* @JimTharioAmazon


## [1.5.5] - Mar 3, 2020
### ID: 1583259275

### Changed
* "Add New Diagram" link difficult to find for new users
* Add documentation for MSAM REST API
* Add documentation for tags documentation
* Adding selected node(s) to existing tile doesn't take effect
* Enhance tile view to show based on state
* Fix pipeline alert tabulator to use resource_arn 
* Group navigation controls in diagram view
* Invalidate web bucket when the custom resource reloads it
* MediaLive Multiplex Alert Support
* Provide CloudWatch event history in Monitor compartment 
* Reorganize the selected item/monitoring layout
* Set the default root object to index.html for the CloudFront distribution
* Update bucket name in root template
* URL parameters aren’t documented

### Contributors
* @ClarkAtAmazon
* @Greglobrien
* @JimTharioAmazon
* @Joaquin6
* @morjoan


## [1.5.1] - Feb 11, 2020
### ID: 1581467119

### Changed
* Fix an incorrectly mapped table in CloudFormation



## [1.5.0] - Feb 10, 2020
### ID: 1581382234

### Changed
* Supply a master CloudFormation template to simplify single-region installations
* Install guide updates for root template
* Add CloudFront distribution to web application install process
* Simplify build and deploy scripts for 3rd party contributors



## [1.4.2] - Oct 2, 2019

### Changed
* Add support across tool for anomaly detection CloudWatch alarms JSON format.


## [1.4.1] - Aug 26, 2019

### Changed
* Minor UI fixes for selected item and monitoring compartments


## [1.4.0] - Aug 20, 2019

### Changed
* Add custom connections from UI
* Optimize the back-end Lambda time while updating nodes
* Support discovery of on-premise equipment
* Index IPs and DNS/hostnames for front-end search
* Improve state handling for nodes with triggered events or alarms


## [1.3.0] - Jul 22, 2019

### Changed
* Assign cloud resources to diagram with tags #43
* Assign cloud resources to tiles with tags #42



## [1.2.0] - Jun 26, 2019

### Changed
* Support for MediaPackage destinations in MediaLive
* Support s3:// protocol URLs for MediaLive and other inputs
* Add URL parameter 'diagram' to specify initial diagram to display


## [1.1.0] - Jun 7, 2019

### Changed
* Support for AWS Elemental MediaTailor


## [1.0.1] - Apr 5, 2019

### Changed
* Fix a selection UI bug with tiles. Remove unneeded console messages



## [1.0.0] - Mar 31, 2019

### Changed
* Multi-diagram support
* Better handling of large inventories (2,500+ resources)
* Several UI improvements
* Drag-and-drop support among tiles, diagrams, search results, and others


