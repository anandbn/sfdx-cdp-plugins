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

### Output

```
JWT Token URL https://login.salesforce.com/services/oauth2/token


Authenticated into core API

Response field  Value
──────────────  ─────────────────────────────────────────────────────────────────────
scope           cdp_query_api cdp_ingest_api cdpquery api cdp_profile_api cdpprofile
instance_url    https://mydomain.my.salesforce.com
token_type      Bearer
id              https://login.salesforce.com/id/00D5e00ty04hyf8EAA/0055e000rt6hIvCAAU
access_token    0055e000rt6hIvCAAU!AR4A..


Exchanged access_token for cdp_access_token

Response field     Value
─────────────────  ───────────────────────────────────────────────
instance_url       mq2tszjzm0zw0yrvgzrwgmzyg1.c360a.salesforce.com
token_type         Bearer
issued_token_type  urn:ietf:params:oauth:token-type:jwt
expires_in         7200
access_token       eyJraWQiOiJDT1JFLjAw...

```

## `metadata`

### Usage

```
sfdx cdp:metadata --username your_org_username@example.com 
                  --clientid "3MVG9.." 
                  --loginurl "https://login.salesforce.com" 
                  --privatekey [absolute path to your private key file]
                  --type 'ENTITY|FIELD`
                  --filters `a string or comma separate filters to apply`

```

- `type` : This determines if you want to return entities or field level metadata. Alowed values are `ENTITY` or `FIELD`. `FIELD` is default
- `filters`: This allows you to do a simple string filter based on what's in the parameter. You can use this to only pull specific tables, or tables matching a particular string.

### Output

Returning all Entities in CDP:

```
sfdx cdp:metadata --username your_org_username@example.com 
                  --clientid "3MVG9.." 
                  --loginurl "https://login.salesforce.com" 
                  --privatekey [absolute path to your private key file]
                  --type 'ENTITY`
                  --filters `a string or comma separate filters to apply`

Entity name                              API Name                                       Entity type
───────────────────────────────────────  ─────────────────────────────────────────────  ───────────
Base Events_dev                          base_events_dev__dll                           dll
Cart Event Items_dev                     cart_event_items_dev__dll                      dll
Cart Events_dev                          cart_events_dev__dll                           dll
Catalog Events_dev                       catalog_events_dev__dll                        dll
DEV_Account_00D010000008qWT              DEV_Account_00D010000008qWT__dll               dll
...

```

Returning fields

```
Entity name                              Field name                              Datatype   API Name
───────────────────────────────────────  ──────────────────────────────────────  ─────────  ───────────────────────────────────────
Base Events_dev                          Action                                  STRING     action__c
Base Events_dev                          cdp_sys_PartitionDate                   DATE_TIME  cdp_sys_PartitionDate__c
Base Events_dev                          Customer ID                             STRING     customerId__c
Base Events_dev                          Data Source                             STRING     DataSource__c
Base Events_dev                          Data Source Object                      STRING     DataSourceObject__c
Base Events_dev                          Email Address                           STRING     emailAddress__c
Base Events_dev                          Event Date                              DATE_TIME  EventDate__c
Base Events_dev                          Event Time                              DATE_TIME  eventTime__c

...

```


Returning fields filtered to match `Account`

```

sfdx cdp:metadata --username your_org_username@example.com 
                  --clientid "3MVG9.." 
                  --loginurl "https://login.salesforce.com" 
                  --privatekey [absolute path to your private key file]
                  --filters `Account`

Entity name                  Field name           Datatype  API Name
───────────────────────────  ───────────────────  ────────  ────────────────────────
DEV_Account_00D010000008qWT  Account Number       STRING    AccountNumber__c
DEV_Account_00D010000008qWT  Account Source       STRING    AccountSource__c
DEV_Account_00D010000008qWT  Account Description  STRING    Description__c
DEV_Account_00D010000008qWT  Account Fax          STRING    Fax__c
DEV_Account_00D010000008qWT  Account ID           STRING    Id__c
DEV_Account_00D010000008qWT  Partner Account      STRING    IsPartner__c
DEV_Account_00D010000008qWT  Is Person Account    STRING    IsPersonAccount__c
DEV_Account_00D010000008qWT  Account Name         STRING    Name__c

...

```


## `query`

### Usage

```
sfdx cdp:metadata --username your_org_username@example.com 
                  --clientid "3MVG9.." 
                  --loginurl "https://login.salesforce.com" 
                  --privatekey [absolute path to your private key file]
                  --query '[your SQL query]`

```

### Output

```
sfdx cdp:metadata --username your_org_username@example.com 
                  --clientid "3MVG9.." 
                  --loginurl "https://login.salesforce.com" 
                  --privatekey [absolute path to your private key file]
                  --query 'select count(*) as row_count from base_events_dev__dll`
row_count
─────────
24104

```
## `export`

### Usage

### Examples

## `ingest`

### Usage

### Examples
