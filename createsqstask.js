const AWS = require('aws-sdk')
const { DateTime } = require('luxon')
const { v4 } = require('uuid')

AWS.config.update({ region: 'ap-southeast-2' })

const sqs = new AWS.SQS()
const sqsURL = 'https://sqs.ap-southeast-2.amazonaws.com/183526390007/ClickTransactionQueue.fifo'

exports.handler = async (event, context) => {
    
    let body = JSON.parse(event.body)
    const reqId = v4()
    
    let query = {
        id: reqId,
        // These should normally be set
        utm_source: body.utm_source ?? null,
        utm_campaign: body.utm_campaign ?? null,
        utm_medium: body.utm_medium ?? null,
        // Optional
        utm_content: body.utm_content ?? null,
        ip: event.requestContext?.http?.sourceIp ?? null,
        user_agent: event.requestContext?.http?.userAgent ?? null,
        // If the user had a query string/search parameter in the URL when clicking
        user_querystring: event.rawQueryString ?? null,
        timestamp: event.requestContext?.timeEpoch ?? null,
        action_id: body.action_id ?? null,
        // Only if there is no associated action ID for this
        action: body.action ?? null,
        // Optional
        correlation_id: body.correlation_id ?? null,
        // If exists at all
        cookie: body.cookie ?? null,
        referrer: event.headers['referer'] ?? (event.headers['Referer'] ?? null),
        device: body.user_agent ?? null,
        // JSON blob of additional metadata for tracking/association/etc
        // Further device information if available also goes in here
        meta: body.meta ?? null
    }
    
    let message = {
        MessageBody: JSON.stringify(query),
        MessageDeduplicationId: reqId,
        MessageGroupId: 'ClickGroup1',
        QueueUrl: sqsURL
    }
    
    let statusCode = '200'
    
    let responseBody = {
        success: true,
        message: ''
    }
    
    await sqs.sendMessage(message).promise().then((response) => {
        let prettyResponse = JSON.stringify(response, null, 2)
        console.log(`Processed Message: ${prettyResponse}`)
        responseBody.message = `${response.MessageId}`
    }, error => {
        let prettyError = JSON.stringify(error, null, 2)
        console.error(prettyError)
        statusCode = '400'
        responseBody.message = JSON.stringify(error)
    })
    
    return {
        statusCode: statusCode,
        body: JSON.stringify(responseBody),
        headers: { 'Content-Type' : 'application/json' }
    }
}

