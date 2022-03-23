#!/bin/bash

# http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing,
# software distributed under the License is distributed on an
# "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
# KIND, either express or implied.  See the License for the
# specific language governing permissions and limitations
# under the License.

# Run this from the root of the html folder

set -euo pipefail

if [ ! -f index.html ]; then
    echo "*** index.html is not here, are you in the right place? ***"
else
    echo
    echo =========================
    echo JSHINT OUTPUT
    echo =========================

    find js/app -name '*.js' -type f -print | xargs jshint

    echo
    echo =========================
    echo ESLINT OUTPUT
    echo =========================

    eslint js/app

    echo
fi
