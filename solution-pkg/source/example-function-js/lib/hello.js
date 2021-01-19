/*********************************************************************************************************************
 *  Copyright 2019 Amazon.com, Inc. or its affiliates. All Rights Reserved.                                           *
 *                                                                                                                    *
 *  Licensed under the Apache License Version 2.0 (the 'License'). You may not use this file except in compliance     *
 *  with the License. A copy of the License is located at                                                             *
 *                                                                                                                    *
 *      http://www.apache.org/licenses/                                                                               *
 *                                                                                                                    *
 *  or in the 'license' file accompanying this file. This file is distributed on an 'AS IS' BASIS, WITHOUT WARRANTIES *
 *  OR CONDITIONS OF ANY KIND, express or implied. See the License for the specific language governing permissions    *
 *  and limitations under the License.                                                                                *
 *********************************************************************************************************************/

/**
 * @author Solution Builders
 */

'use strict';

const moment = require('moment');

/**
 * Performs actions for providing greetings.
 *
 * @class Hello
 */
class Hello {

    /**
     * @class Hello
     * @constructor
     */
    constructor(options) {
        this.options = options;
    }

    /**
     * Responds to a message
     * @param {JSON} message - message object
     */
    async respond(message) {

        this.options.logger.log({
            level: 'info',
            message: JSON.stringify(message)
        });

        return Promise.resolve({ data: `Hello, ${message.name}! How are you?`});

    }

}

module.exports = Hello;