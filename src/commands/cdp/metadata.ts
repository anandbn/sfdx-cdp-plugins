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
const url = require('url');
import CDPUtils  from '../../shared/cdputils';

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
    var params = CDPUtils.getJwtParams(this.flags);

    var tokenUrl = new url.URL('/services/oauth2/token', this.flags.loginurl).toString();

    try{
      let coreApiToken = await CDPUtils.getCoreApiJWTAccessToken(tokenUrl,params);
      let cdpAccesToken = await CDPUtils.getC360AccessToken(coreApiToken);
      let metadataRes = await CDPUtils.getC360Metadata(cdpAccesToken);
      if(this.flags.type == 'FIELD'){
        return this.extractFields(metadataRes.metadata);
      }
      if(this.flags.type == 'ENTITY'){
        return this.extractEntities(metadataRes.metadata);
      }
      // Return an object to be displayed with --json
      return metadataRes;
    }catch(error){
      if(error.response && error.response.data){
        this.ux.error(JSON.stringify(error.response.data,null,4));
      }else{
        this.ux.error(JSON.stringify(error,null,4));

      }
    }
    return null;

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
                entityApiName:entity.name,
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
      {key:'entityApiName',label: 'Entity API name'},
      {key:'fieldName',label : 'Field name'},
      {key:'fieldType',label : 'Datatype'},
      {key:'fieldApiName',label : 'API Name'},
    ]};

    this.ux.table(entityFields,tableColumns);
    return entityFields;
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