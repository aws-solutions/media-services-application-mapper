#!/bin/sh

# http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing,
# software distributed under the License is distributed on an
# "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
# KIND, either express or implied.  See the License for the
# specific language governing permissions and limitations
# under the License.

# ignore line too long problems (C0301)
# ignore similar code problems (R0801)

find . -iname '*.py' | \
    grep "/package/" --invert-match | \
    grep "/.aws-sam/" --invert-match | \
    xargs pylint -d C0301,R0801,R1702,R0912,R0914,R0915
