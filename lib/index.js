"use strict";

import md5 from "md5";
import uuid from "uuid";
import "isomorphic-fetch";

var localStorage;
if (typeof (localStorage) == "undefined" || localStorage === null) {
  var LocalStorage = require('node-localstorage').LocalStorage;
  localStorage = new LocalStorage('./lib/localStorage');
}
 function parseHexString(str) {
  var result = [];
  while (str.length >= 2) {
    result.push(parseInt(str.substring(0, 2), 16));
    str = str.substring(2, str.length);
  }
  return result;
}

export function getUserIDHash(userID) {
  var hash = md5(userID);
  var input = parseHexString(hash);
  return uuid.v4({random: input});
};

export function registerUserURL(userID, centralRepositoryURL, headers, userStorageURL){

  var user_record_id = getUserIDHash(userID);

  var key = 'kinto:server-url:' + userID;
  var cachedURL = localStorage.getItem(key);
  if(cachedURL != null){
    return Promise.resolve(cachedURL);
  }

  let url = centralRepositoryURL + user_record_id;
  var body = JSON.stringify({
      data:{
        url: userStorageURL
      }
  });

  if (!headers.hasOwnProperty("Authorization"))
   {
      return Promise.reject(new Error("Missing Authorization header"));
   }

    return fetch(url,{
    method:'put',
    headers,
    body
  })

    .then(function(response) {
      if (response.status >=200 && response.status <300){

        return Promise.resolve(userStorageURL);
      }
      if (response.status == 401){
        throw Promise.reject(new Error("invalid headers"));
      }
      if(response.status >=500){
        throw Promise.reject(new Error("server not reachable"));
      }
      return Promise.reject(new Error("does not fit any case"));
    })
    .then(function(userStorageURL){
      localStorage.setItem(key, userStorageURL);

      return Promise.resolve(userStorageURL);
    })
    .catch(function(error) {
        return error;
    });
};


export function retrieveUserURL(userID, centralRepositoryURL, headers, defaultServer){
  if (defaultServer == ''){
    return "default server is null";
  }
  var user_record_id = getUserIDHash(userID);
  var key = 'kinto:server-url:' + userID;
  var cachedURL = localStorage.getItem(key);
  if(cachedURL != null){
    return Promise.resolve(cachedURL);
  }
  if (!headers.hasOwnProperty("Authorization"))
   {        return Promise.reject(new Error("Missing Authorization header"));
   }



  let url = centralRepositoryURL + user_record_id;

  return fetch(url, {headers})
    .then(function(response) {
      if (response.status >=200 && response.status <300){
        return response.json();

      }
      if (response.status == 404 || response.status == 403){
        return Promise.resolve({data: {url: defaultServer}});
      }
      if (response.status == 401){
        return Promise.reject(new Error("invalid headers"));
      }
      if(response.status >=500){
        return Promise.reject(new Error("server not reachable"));
      }
      return Promise.reject(new Error("did not fit any case"));
      //reject promise if it does not go in any of the above ifs

    })

    .then(function(data){
      localStorage.setItem(key, data.data.url);
      return data.data.url;
    })
 };
