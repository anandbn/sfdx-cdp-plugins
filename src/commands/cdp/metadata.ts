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
const fs = require('fs');

const jwt = require('jsonwebtoken');
const url = require('url');

// Initialize Messages with the current plugin directory
Messages.importMessagesDirectory(__dirname);


// Load the specific messages for this file. Messages from @salesforce/command, @salesforce/core,
// or any library that is using the messages framework can also be loaded this way.
const messages = Messages.loadMessages('sfdx-cdp', 'cdp');


export default class Metadata extends SfdxCommand {
  public static description = messages.getMessage('meta-commandDescription');

  public static examples = messages.getMessage('meta-examples').split(os.EOL);

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
    type: flags.enum({
      char: 't',
      description: messages.getMessage('meta-typeDescription'),
      options:['FIELD','ENTITY'],
      default:'FIELD'
    }),
    filters: flags.array({
      char: 'f',
      description: messages.getMessage('meta-filterDescription'),
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

    let coreApiToken = await this.getCoreApiJWTAccessToken(tokenUrl,params);
    let cdpAccesToken = await this.getC360AccessToken(coreApiToken);
    let metadataRes = await this.getC360Metadata(cdpAccesToken);
    if(this.flags.type == 'FIELD'){
      return this.extractFields(metadataRes.metadata);
    }
    if(this.flags.type == 'ENTITY'){
      return this.extractEntities(metadataRes.metadata);
    }
    // Return an object to be displayed with --json
    return metadataRes;
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


  private async getC360Metadata(cdpToken) {
    let apiEndpoint = `https://${cdpToken.instance_url}/api/v1/metadata/`;
    let response = await axios.get(apiEndpoint, {
      headers: {
        "Authorization": `Bearer ${cdpToken.access_token}`
      }
    });
    if (response.status == 200) {
      return response.data;
    } else {
      return null;
    }
  }

  private async extractFields(entities) {
    let entityFields:any[] = new Array();
    for(let i=0;i<entities.length;i++)
    {
      let entity = entities[i];
      if(this.flags.filters == null || (this.flags.filters !=null && this.isEntityOrFieldInFilter(entity.displayName,entity.name))){
        if(entity.fields && entity.fields.length>0){
          for(let entityField of entity.fields){
            if(this.flags.filters == null || (this.flags.filters !=null && this.isEntityOrFieldInFilter(entityField.displayName,entityField.name))){
              entityFields.push({
                entityName:entity.displayName,
                fieldName:entityField.displayName,
                fieldType:entityField.type,
                fieldApiName:entityField.name,
              });
            }
          }
        }
      }

    }
    let tableColumns:TableOptions = {
      columns:[
      {key:'entityName',label: 'Entity name'},
      {key:'fieldName',label : 'Field name'},
      {key:'fieldType',label : 'Datatype'},
      {key:'fieldApiName',label : 'API Name'},
    ]};

    this.ux.table(entityFields,tableColumns);

  }

  private async extractEntities(entities) {
    let allEntities:any[] = new Array();
    for(let i=0;i<entities.length;i++)
    {
      let entity = entities[i];
      if(this.flags.filters == null || (this.flags.filters !=null && this.isEntityOrFieldInFilter(entity.displayName,entity.name))){
          allEntities.push({
            entityName:entity.displayName,
            entityApiName:entity.name,
            entityType:entity.name.substring(entity.name.length-3,entity.name.length)
          });
      }
      //let entityLast3Chars = entity.name.substring(entity.name.length-4,entity.name.length-1);
      

    }
    let tableColumns:TableOptions = {
      columns:[
      {key:'entityName',label: 'Entity name'},
      {key:'entityApiName',label : 'API Name'},
      {key:'entityType',label : 'Entity type'},
    ]};

    this.ux.table(allEntities,tableColumns);
    return allEntities;
  }

  private isEntityOrFieldInFilter(name,apiName){
    let filterMatch:boolean = false;
    this.flags.filters.forEach(filter => {
      if(!filterMatch){
        filterMatch = name.includes(filter) || apiName.includes(filter);
      }
    });
    return filterMatch;
  }
}