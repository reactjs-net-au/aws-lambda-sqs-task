const AWS = require('aws-sdk')
const { DateTime } = require('luxon')

const sqs = new AWS.SQS()
const sqsURL = 'https://sqs.ap-southeast-2.amazonaws.com/183526390007/ClickTransactionQueue.fifo'

AWS.config.update({region: 'ap-southeast-2'})

const dynamo = new AWS.DynamoDB({apiVersion: '2012-08-10'})

exports.handler = async (event, context) => {
    
    // This places the event in DynamoDB and another trigger
    // optionally predicts whether the click event may be
    // fraudulent or not; otherwise the dashboard can inspect
    // and filter records (manual process)
    
    const c = event.Records.length
    const click = event
    
    for (const r of event.Records) {
      
      const record = JSON.parse(r.body)
      const ts = record.timestamp
        
        const params = {
          TableName: 'clickstream',
          Item: {
            'id' : { S: record.id },
            'ip' : { S: record.ip },
            'utm_campaign' : { S: record.utm_campaign ?? '' },
            'utm_medium' : { S: record.utm_medium ?? '' },
            'utm_source' : { S: record.utm_source ?? '' },
            'utm_id': { S: record.utm_id ?? '' },
            'utm_term': { S: record.utm_term ?? '' },
            'timestamp': { S: ts.toString() },
            'datetime': { S: DateTime.fromMillis(ts).toISO() },
            'au': { S: DateTime.fromMillis(ts, { zone: 'Australia/Sydney' } ).toISO() },
            'action': { S: record.action ?? '' },
            'action_id': { S: record.action_id ?? '' },
            'correlation_id': { S: record.correlation_id ?? '' },
            'user_agent': { S: record.user_agent ?? '' },
            'query_string': { S: record.user_querystring ?? '' },
            'referrer': { S: record.referrer ?? '' },
            'cookie': { S: record.cookie ?? '' },
            'device': { S: record.device ?? '' },
            'meta': { S: JSON.stringify(record.meta) ?? '' }
          }
        }
    
        // Call DynamoDB to add the item to the table
        
        dynamo.putItem(params, (err, data) => {
          if (err) {
            console.log("Error", err)
          } else {
            console.log("Success", data)
          }
          
          sqs.deleteMessage(record).promise().then((response) => {
              let prettyResponse = JSON.stringify(response, null, 2)
              console.log(`Deleted Message: ${prettyResponse}`)
          }, error => {
              let prettyError = JSON.stringify(error, null, 2)
              console.error(prettyError)
          })
        })
    }
}
