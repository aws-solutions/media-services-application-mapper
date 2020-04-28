import json
from jsonpath_ng import parse

TEMPLATE_FILE = "msam-events-release.json"
# replace the absolute path to the bucket of the code URI with a region-dependent one
CODE_URI = {"Key": "msam/","Bucket": {"Fn::Join": ["-",[{"Ref": "BucketBasename"},{"Ref": "AWS::Region"}]]}}

def main():        
    template = {}
    # read file
    with open(TEMPLATE_FILE, "r") as read_file:
        template = json.load(read_file)
        uri_expr = parse('$..CodeUri')
        code_uris = [match.value for match in uri_expr.find(template)]
        # parse out the key
        key = code_uris[0].split('/')[-1]
        CODE_URI["Key"] = CODE_URI["Key"]+key
        # update all the code URIs
        uri_expr.update(template, CODE_URI)
    with open(TEMPLATE_FILE, "w") as write_file:
        json.dump(template, write_file, indent=4)

if __name__ == "__main__":
    main()

