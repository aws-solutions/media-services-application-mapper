/*! Copyright 2018 Amazon.com, Inc. or its affiliates. All Rights Reserved.
       SPDX-License-Identifier: Apache-2.0 */

define(["jquery", "app/settings"],
    function($, settings) {

        // REMEMBER SETTING

        let compartment_state = "max";
        let settings_key = "info-compartment-state";

        $("#information-compartment-up-down-button").click(() => {
            try {
                if (compartment_state === "min") {
                    maximize_compartment();
                } else
                if (compartment_state === "max") {
                    minimize_compartment();
                }
            } catch (error) {
                console.log(error);
            }
            $("#information-compartment-up-down-button").blur();
        });

        let maximize_compartment = () => {
            $("#information").fadeToggle("fast");
            $("#information-compartment-flex").fadeToggle("fast");
            $("#diagram").animate({ height: "-=28%" });
            compartment_state = "max";
            settings.put(settings_key, { "state": compartment_state });
        };

        let minimize_compartment = () => {
            $("#information").fadeToggle("fast");
            $("#information-compartment-flex").fadeToggle("fast");
            $("#diagram").animate({ height: "+=28%" });
            compartment_state = "min";
            settings.put(settings_key, { "state": compartment_state });
        };

        let restore_state = () => {
            settings.get(settings_key).then(function(value) {
                console.log(`saved info compartment state = ${JSON.stringify(value)}`);
                if (value === null) {
                    // no setting, keep the default state of maximized
                    settings.put(settings_key, { "state": "max" });
                } else
                if (value.state === "max") {
                    // do nothing, default state
                } else
                if (value.state === "min") {
                    minimize_compartment();
                }
            }).catch(function(error) {
                console.log(JSON.stringify(error));
            });
        };

        // initialization
        restore_state();

    });