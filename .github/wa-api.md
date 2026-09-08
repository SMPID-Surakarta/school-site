Method : POST | GET

Endpoint: https://wa.faz.my.id/send-message

Request Body : (JSON If POST)

Parameter Type Required Description
api_key string Yes API Key
sender string Yes Number of your device
number string Yes Recipient number ex 72888xxxx | 62888xxxx
message string Yes Message to be sent
footer string No Footer under message
msgid string No Quoted message ID to reply to
full number No Show full response from WhatsApp (1 = enabled)

Example Without full
JSON Request
////////////////////////////////
{
"api_key": "1234567890",
"sender": "62888xxxx",
"number": "62888xxxx",
"message": "Hello World",
"footer": "Sent via mpwa"
}
//////////////////////////////

JSON Request - Sample With media
////////////////////////////////
{
"api_key": "1234567890",
"sender": "62888xxxx",
"number": "62888xxxx",
"media_type": "image",
"caption": "Hello World",
"footer": "Sent via mpwa",
"url": "https://example.com/image.jpg"
}
////////////////////////////////

URL Request
https://wa.faz.my.id/send-message?api_key=1234567890&sender=62888xxxx&number=62888xxxx&message=Hello World&footer=Sent via mpwa

JSON Response
/////////////////////////
{
"status": true,
"msg": "Message sent successfully!"
}
////////////////////////

Example With msgid (reply)
JSON Request
/////////////////////////////////////
{
"api_key": "1234567890",
"sender": "62888xxxx",
"number": "62888xxxx",
"message": "Hello World",
"msgid": "3EB031F83D74BF480052B9"
}
/////////////////////////////////////

URL Request
https://wa.faz.my.id/send-message?api_key=1234567890&sender=62888xxxx&number=62888xxxx&message=Hello World&msgid=3EB031F83D74BF480052B9

Example With full
JSON Request
////////////////////////////////////////
{
"api_key": "1234567890",
"sender": "62888xxxx",
"number": "62888xxxx",
"message": "Hello World",
"footer": "Sent via mpwa",
"full": 1
}
////////////////////////////////////////

URL Request
https://wa.faz.my.id/send-message?api_key=1234567890&sender=62888xxxx&number=62888xxxx&message=Hello World&footer=Sent via mpwa&full=1
JSON Response

////////////////////////////////////////
{
"status": true,
"data": {
"key": {
"remoteJid": "62888xxxx@c.us",
"fromMe": true,
"id": "3EB0C41E9D2DFXXXXXXXXX"
},
"message": {
"extendedTextMessage": {
"text": "Hello World"
}
},
"messageTimestamp": "1755623949"
}
}
////////////////////////////////////////
