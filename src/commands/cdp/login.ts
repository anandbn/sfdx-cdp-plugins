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
import CDPUtils  from '../../shared/cdputils';
const url = require('url');

// Initialize Messages with the current plugin directory
Messages.importMessagesDirectory(__dirname);


// Load the specific messages for this file. Messages from @salesforce/command, @salesforce/core,
// or any library that is using the messages framework can also be loaded this way.
const messages = Messages.loadMessages('sfdx-cdp', 'cdp');


export default class Login extends SfdxCommand {
  public static description = messages.getMessage('login-commandDescription');

  public static examples = messages.getMessage('login-examples').split(os.EOL);

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
    })
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
    this.ux.log(`JWT Token URL ${tokenUrl}`);
    try{
      let coreApiToken = await CDPUtils.getCoreApiJWTAccessToken(tokenUrl,params);

      let tableColumns:TableOptions = {
        columns:[
        {key:'field',label: 'Response field'},      
        {key:'value',label: 'Value'},      
      ]};
      let apiRespData:any[] = new Array();
      apiRespData.push({"field":"scope","value":coreApiToken.scope})
      apiRespData.push({"field":"instance_url","value":coreApiToken.instance_url})
      apiRespData.push({"field":"token_type","value":coreApiToken.token_type})
      apiRespData.push({"field":"id","value":coreApiToken.id})
      apiRespData.push({"field":"access_token","value":`${coreApiToken.access_token.substring(0,20)}..`});
  
      this.ux.log(`\n\nAuthenticated into core API\n`);
      this.ux.table(apiRespData,tableColumns);
      let cdpAccessToken = await CDPUtils.getC360AccessToken(coreApiToken);
  
      this.ux.log(`\n\nExchanged access_token for cdp_access_token\n`);
      apiRespData  = new Array();
      apiRespData.push({"field":"instance_url","value":cdpAccessToken.instance_url})
      apiRespData.push({"field":"token_type","value":cdpAccessToken.token_type})
      apiRespData.push({"field":"issued_token_type","value":cdpAccessToken.issued_token_type})
      apiRespData.push({"field":"expires_in","value":cdpAccessToken.expires_in});
      apiRespData.push({"field":"access_token","value":`${cdpAccessToken.access_token.substring(0,20)}...`});
  
      this.ux.table(apiRespData,tableColumns);
      return cdpAccessToken;
  
    }catch(error){
      this.ux.error(`Error logging in:\n ${JSON.stringify(error.response,null,4)}`);
      return error;
    }
  }


}