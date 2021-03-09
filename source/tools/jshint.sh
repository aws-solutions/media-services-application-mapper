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

find . -name '*.js' -type f -print | \
    grep --invert-match "/external/" | \
    xargs -n 1 jshint
