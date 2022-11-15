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
import CDPUtils  from '../../shared/cdputils';
import { createObjectCsvStringifier } from 'csv-writer';

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
    })/*,
    limit: flags.string({
      char: 'l',
      description: messages.getMessage('query-limitDescription'),
      required: true
    })*/
  };

  // Comment this out if your command does not require an org username
  protected static requiresUsername = false;

  // Comment this out if your command does not support a hub org username
  protected static supportsDevhubUsername = false;

  // Set this to true if your command requires a project workspace; 'requiresProject' is false by default
  protected static requiresProject = false;

  public async run(): Promise<AnyJson> {
    var params = CDPUtils.getJwtParams(this.flags);

    var tokenUrl = new url.URL('/services/oauth2/token', this.flags.loginurl).toString();
    try{
      let coreApiToken = await CDPUtils.getCoreApiJWTAccessToken(tokenUrl,params);
      let cdpAccesToken = await CDPUtils.getC360AccessToken(coreApiToken);
      let offset = 0;
      let hasRecords = true;
      while(hasRecords){
        let queryResponse = await CDPUtils.executeQuery(cdpAccesToken,this.flags.query,50000,offset);
        this.formatAndOutputData(queryResponse);
        offset +=50000;
        hasRecords = !queryResponse.done;
      }
      return {
        "status":"ok"
      };
    }catch(error){
      if(error.response && error.response.data){
        this.ux.error(JSON.stringify(error.response.data,null,4));
      }else{
        this.ux.error(JSON.stringify(error,null,4));

      }
    }
    return null;
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