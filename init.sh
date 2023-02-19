mkdir evalCode
cp ./evalTemplates/newfiletemplate.js ./evalCode/code.js
cd evalCode
mkdir fetchPayload
cd fetchPayload
echo "{}" > ___fetchConfig.json
cd ../../
mkdir env
echo "{ \n\t\"identity\": \"\",\n\t\"identityBridge\": \"\",\n\t\"environment\": \"\",\n\t\"websocketHosts\": {\n\t\t\"exampleServerName\": {\n\t\t\t\"host\": \"\",\n\t\t\t\"port\": \"\",\n\t\t\t\"key\": \"\",\n\t\t\t\"allowedIdentities\": {}\n\t\t}\n\t},\n\t\"encryptionSignature\": \"\",\n\t\"encryptionKey\": \"\"\n}" > ./env/.env.json