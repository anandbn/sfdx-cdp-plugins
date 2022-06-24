cdp-plugins
===============



A collection of SFDX plugins to interact with Salesforce CDP. The following plugins are available:

- `login` : A way to test CDP login using a private key 
- `metadata` : To fetch metadata in CDP
- `export` : To export data from a SQL query as a CSV file
- `ingest` : To send data using the streaming ingestion API for CDP

## Installation

1. Clone this git repo : `git clone https://github.com/anandbn/sfdx-cdp-plugins`
2. Run `sfdx plugins:link` from the repo folder after you have cloned
```
cd sfdx-cdp-plugins
sfdx plugins:link
```

To test if the plugin was installed correctly. run `sfdx cdp:login --help` which should display the help for that plugin

## Common parameters

All plugins use the following common parameters:

- `--clientid` / `-c` : THe connected app client id from salesforce setup. __Note__: this connection app should have the right scopes as well as ...
- `--loginurl` / `-r` : Login URL for your instance
- `--privatekey`  / `-k` : Private key file that will be used in the OAuth JWT tokene exchange.
- `--username` / `-u` : The username to use in the JWT token exchange

__Note__: Ensure that the connected app that you are configuring has the scope set to `cdp_query_api cdp_ingest_api cdpquery api cdp_profile_api cdpprofile` amongst other scopes that you might need. Without these scopes included, CDP API operations will not work.

Refer to [Setting up connected app](https://help.salesforce.com/articleView?id=sf.connected_app_create.htm&type=5&language=en_US) for more details on how to configure connected app.

Refer to [Oauth JWT Bearer flow](https://help.salesforce.com/articleView?id=remoteaccess_oauth_jwt_flow.htm&language=en_US) for more information on how the private key/certificate should be configured. The plugins here uses this flow and fetches the `access_token`

Refer to [Salesforce CDP API Authentication](https://developer.salesforce.com/docs/atlas.en-us.c360a_api.meta/c360a_api/c360a_getting_started_with_cdp.htm) on how the `access_token` is exchanged for a `cdp_access_token`

## `login`

### Usage

```
sfdx cdp:login --username your_org_username@example.com 
               --clientid "3MVG9.." 
               --loginurl "https://login.salesforce.com" 
               --privatekey [absolute path to your private key file]

```

### Examples


## `metadata`

### Usage

### Examples


## `export`

### Usage

### Examples

## `ingest`

### Usage

### Examples
