/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import * as os from 'os';
import { flags, SfdxCommand, TableOptions } from '@salesforce/command';
import { Messages } from '@salesforce/core';
import { AnyJson } from '@salesforce/ts-types';
const axios = require('axios').default;
const YAML = require('yaml')

const jwt = require('jsonwebtoken');
const url = require('url');

// Initialize Messages with the current plugin directory
Messages.importMessagesDirectory(__dirname);


// Load the specific messages for this file. Messages from @salesforce/command, @salesforce/core,
// or any library that is using the messages framework can also be loaded this way.
const messages = Messages.loadMessages('sfdx-cdp', 'cdp');


export default class Query extends SfdxCommand {
  public static description = messages.getMessage('query-commandDescription');

  public static examples = messages.getMessage('query-examples').split(os.EOL);

  public static args = [{ name: 'file' }];


  protected static flagsConfig = {
    // flag with a value (-n, --name=VALUE)
    clientid: flags.string({
      char: 'i',
      description: messages.getMessage('clientIdDescription'),
      required: true
    }),
    username: flags.string({
      char: 'u',
      description: messages.getMessage('usernameDescription'),
      required: true
    }),
    loginurl: flags.url({
      char: 'r',
      description: messages.getMessage('loginUrlDescription'),
      required: false,
      default: new url.URL('https://login.salesforce.com')
    }),
    privatekey: flags.filepath({
      char: 'k',
      description: messages.getMessage('privateKeyDescription'),
      required: true
    }),
    query: flags.string({
      char: 'q',
      description: messages.getMessage('query-queryDescription'),
      required: true
    })
  };

  // Comment this out if your command does not require an org username
  protected static requiresUsername = false;

  // Comment this out if your command does not support a hub org username
  protected static supportsDevhubUsername = false;

  // Set this to true if your command requires a project workspace; 'requiresProject' is false by default
  protected static requiresProject = false;

  public async run(): Promise<AnyJson> {
    const clientId = this.flags.clientid;
    const privateKey = require('fs').readFileSync(this.flags.privatekey, 'utf8');

    var jwtparams = {
      iss: clientId,
      prn: this.flags.username,
      aud: this.flags.loginurl,
      exp: (Math.floor(Date.now() / 1000) + (60 * 3))
    };

    var token = jwt.sign(jwtparams, privateKey, { algorithm: 'RS256' });

    var params = {
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: token
    };

    var tokenUrl = new url.URL('/services/oauth2/token', 'https://login.salesforce.com').toString();

    let coreApiToken = await this.getCoreApiJWTAccessToken(tokenUrl, params);
    let cdpAccesToken = await this.getC360AccessToken(coreApiToken);
    return  this.executeQuery(cdpAccesToken);
  }

  private async getCoreApiJWTAccessToken(tokenUrl, params) {
    let urlParams = new url.URLSearchParams(params);
    let response = await axios.post(tokenUrl, urlParams.toString());
    if (response.status == 200) {
      return response.data;
    } else {
      return null;
    }
  }


  private async getC360AccessToken(coreApiToken) {
    let params = {
      "grant_type": "urn:salesforce:grant-type:external:cdp",
      "subject_token": coreApiToken.access_token,
      "subject_token_type": "urn:ietf:params:oauth:token-type:access_token"
    }
    let urlParams = new url.URLSearchParams(params);
    let tokenUrl = `${coreApiToken.instance_url}/services/a360/token`;
    let response = await axios.post(tokenUrl, urlParams.toString());
    if (response.status == 200) {
      return response.data;
    } else {
      return null;
    }

  }
  private async executeQuery(cdpAccessToken) {

    let queryEndpoint = `https://${cdpAccessToken.instance_url}/api/v1/query`;
    let queryJson = {
      "sql": this.flags.query
    }
    try{
      let response = await axios.post(queryEndpoint, queryJson, {
        headers: {
          "Authorization": `Bearer ${cdpAccessToken.access_token}`
        }
      });
      if (response.status == 200) {
        this.formatAndOutputData(response.data);
        return response.data;
      } else {
        return null;
      }
  
    }catch(error){
      this.ux.error(JSON.stringify(error));
    }

  }

  private formatAndOutputData(queryResponse){
    let columns:any[] = new Array();

    for( const fldName in queryResponse.metadata){
      columns.push({key: fldName,label:fldName, columnOrder:queryResponse.metadata[fldName].placeInOrder})
    }
    columns = columns.sort(function(a, b){return a.columnOrder - b.columnOrder})
    let tableColumns:TableOptions = {
      columns:columns
    };

    this.ux.table(queryResponse.data,tableColumns);
  }


}