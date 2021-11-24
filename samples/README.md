Please follow these below steps to run samples

- Have Node.js installed in your system.
- In CMD, run the command npm install http-server -g
- Navigate to the specific path of your file folder in CMD and run the command http-server
- Go to your browser and type localhost:8080. html files should run there.

`Note`:
In every file, in Skyflow.init(), replace with the following fields:
1. Replace the placeholder "<VAULT_ID>" with the correct vaultId you want to connect
2. Replace the placeholder "<VAULT_URL>" with the correct vaultURL
3. Implement the bearer token endpoint using server side auth SDK and service account file.
   Replace the placeholder "<TOKEN_END_POINT_URL>" with the  bearer token endpoint wich gives the bearerToken, implemented at your backend. 