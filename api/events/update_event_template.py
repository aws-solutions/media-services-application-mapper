import json

TEMPLATE_FILE = "msam-events-release.json"
# replace the absolute path to the bucket of the code URI with a region-dependent one
CODE_URI = {"Key": "msam/","Bucket": {"Fn::Join": ["-",[{"Ref": "BucketBasename"},{"Ref": "AWS::Region"}]]}}

def main():        
    template = {}
    # read file
    with open(TEMPLATE_FILE, "r") as read_file:
        template = json.load(read_file)
        current_uri = template["Resources"]["Collector"]["Properties"]["CodeUri"]        
        #parse out the key
        key = current_uri.split('/')[-1]
        CODE_URI["Key"] = CODE_URI["Key"]+key
        template["Resources"]["Collector"]["Properties"]["CodeUri"] = CODE_URI
        #print(template)
    with open(TEMPLATE_FILE, "w") as write_file:
        json.dump(template, write_file, indent=4)

if __name__ == "__main__":
    main()

