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
