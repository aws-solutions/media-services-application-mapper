/**
 *  Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 *
 *  Licensed under the Apache License, Version 2.0 (the "License"). You may not use this file except in compliance
 *  with the License. A copy of the License is located at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 *  or in the 'license' file accompanying this file. This file is distributed on an 'AS IS' BASIS, WITHOUT WARRANTIES
 *  OR CONDITIONS OF ANY KIND, express or implied. See the License for the specific language governing permissions
 *  and limitations under the License.
 */

// Imports
const fs = require('fs');
const path = require('path');

// Paths
const global_s3_assets = path.join(__dirname, '../global-s3-assets');

// For each template in global_s3_assets ...
fs.readdirSync(global_s3_assets).forEach((file) => {
    // Import and parse template file
    const raw_template = fs.readFileSync(path.join(global_s3_assets, file));
    let template = JSON.parse(raw_template);
    const resources = template.Resources ? template.Resources : {};

    // helper function to remove properties from an object
    const removeProperty = function removeProperty(obj, ...keys) {
        const key = keys.shift();
        if (obj.hasOwnProperty(key)) {
            const prop = obj[key];
            if (keys.length) {
                if (removeProperty(prop, ...keys) && Object.keys(prop).length === 0) {
                    delete obj[key];
                    return true;
                }
            } else {
                delete obj[key];
                return true;
            }
        }
        return false;
    };

    if (file === 'msam-core-release.template') {
        // Manually add the API Gateway Stage dependency
        //    The API Gateway Stage is generated dynamically in SAM templates,
        //    therefore the stage is not visible toCDK when synthesizing the template
        //    and throws an exception.
        const [usagePlanKey] = Object.keys(resources).filter(key => /UsagePlan[A-Z\d]{8}/.test(key));
        resources[usagePlanKey].DependsOn = 'RestAPImsamStage';
        resources[usagePlanKey].Properties.ApiStages = [{
            ApiId: {
                Ref: 'RestAPI',
            },
            Stage: 'msam',
        }];
    }

    // Remove unnecessary CDK metadata
    const cdkMetadata = Object.values(resources).filter(
        (value) => Object.keys(value.Metadata || {}).some(
            (key) => key.startsWith("aws:")
        )
    );

    cdkMetadata.forEach(function (resource) {
        const keys = Object.keys(resource.Metadata);
        const rmKeys = keys.filter((key) => /^aws:(cdk|asset):(path|property)$/.test(key));
        if (keys.length === rmKeys.length) {
            delete resource.Metadata;
        } else {
            rmKeys.forEach((key) => delete resource.Metadata[key]);
        }
    });

    // Clean out CDK Metadata and condition it depends on
    removeProperty(resources, 'CDKMetadata');
    removeProperty(template, 'Conditions', 'CDKMetadataAvailable');

    // Clean-up BootstrapVersion parameter
    removeProperty(template, 'Parameters', 'BootstrapVersion');

    // Clean-up CheckBootstrapVersion Rule
    removeProperty(template, 'Rules', 'CheckBootstrapVersion');


    // Output modified template file
    const output_template = JSON.stringify(template, null, 2);
    fs.writeFileSync(`${global_s3_assets}/${file}`, output_template);
});
