# aws-lambda-sqs-task

The first Lambda function, createsqstask, is invoked by API Gateway to handle a stream of clicks.
The function just does some basic checking and processing and places it in a FIFO SQS queue.

The second Lambda function, processevent, handles placing the data in DynamoDB.
Once this is done, DynamoDB events trigger an optional ML step which is a Python lambda
that attempts to classify click data as fraudulent or not.

Otherwise, the data can be inspected and searched on with a dashboard.

These other components are still in active development and will be added to this repository
as they become mature enough to use without too many issues.
