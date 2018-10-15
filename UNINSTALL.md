# Media Services Application Mapper (MSAM)

MSAM is removed from an AWS account using CloudFormation.

## CloudFormation Stack Deletion

The order in which to delete the stacks are as follows:

1. Delete MSAM Web stack 
1. Delete Event Handler stack
1. Delete Core stack
1. Delete DynamoDB stack

To delete a stack:

1. Select the template you wish to delete.
2. From the **Actions** pulldown menu, select **Delete Stack**
 
![Delete Stack](images/cfn-delete-stack.jpeg)

## Warning

Remember to remove the DynamoDB stack last as other stacks are running software that accesses the tables. Removing the table before removing the running software has the potential to create excessive error rates in your account which may result in service usage throttling.

## Navigate

Navigate to [README](README.md) | [Workshop](WORKSHOP.md) | [Install](INSTALL.md) | [Usage](USAGE.md) | [Uninstall](UNINSTALL.md) | [FAQ](FAQ.md)
