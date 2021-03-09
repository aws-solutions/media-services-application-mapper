#!/bin/bash

# http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing,
# software distributed under the License is distributed on an
# "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
# KIND, either express or implied.  See the License for the
# specific language governing permissions and limitations
# under the License.

# IGNORED RULES
# C0301 Line too long
# C0302 Too many lines in module
# R0801 Similar lines in files
# R1702 Too many nested blocks
# R0912 Too many branches
# R0914 Too many local variables
# R0915 Too many statements
# W0703 Catching too general exception
# W0640 Cell variable

set -euo pipefail

find . -iname '*.py' | \
    grep "/package/" --invert-match | \
    grep "/.aws-sam/" --invert-match | \
    xargs pylint -d C0301,C0302,R0801,R1702,R0912,R0914,R0915,W0703,W0640
