/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
const axios = require('axios').default;

const jwt = require('jsonwebtoken');
const url = require('url');


export default class CDPUtils {

    static getJwtParams(pluginParameters){
        const privateKey = require('fs').readFileSync(pluginParameters.privatekey, 'utf8');

        var jwtparams = {
            iss: pluginParameters.clientid,
            prn: pluginParameters.username,
            aud: pluginParameters.loginurl,
            exp: (Math.floor(Date.now() / 1000) + (60 * 3))
          };
      
          var token = jwt.sign(jwtparams, privateKey, { algorithm: 'RS256' });
          return{
            grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
            assertion: token
          };
          
    }
    static async getCoreApiJWTAccessToken(tokenUrl, params) {
        let urlParams = new url.URLSearchParams(params);
        let response = await axios.post(tokenUrl, urlParams.toString());
        if (response.status == 200) {
            return response.data;
        } else {
            return null;
        }

    }

    static async getC360AccessToken(coreApiToken) {
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

    static async getC360Metadata(cdpToken) {
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
    

}