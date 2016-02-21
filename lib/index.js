"use strict";

import md5 from "md5";
import uuid from "uuid";
import "isomorphic-fetch";

var localStorage;
console.log(typeof (localStorage));
if (typeof (localStorage) == "undefined" || localStorage === null) {
  console.log("in if===================================");
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
  var cachedURL = localStorage.getItem("key");
  if(cachedURL != null){
    return cachedURL;
  }

  let url = centralRepositoryURL + user_record_id;
  var body = JSON.stringify({
      data:{
        url: userStorageURL
      }
  });

  if (!headers.hasOwnProperty("Authorization"))
   {  console.log("in if");
      return Promise.reject(new Error("Missing Authorization header"));
   }
    console.log("in register"+ userStorageURL);
  return fetch(url,{
    method:'put',
    headers,
    body
  })

    .then(function(response) {
      if (response.status >=200 && response.status <300){

        return userStorageURL;
      }
      if (response.status == 401){
        console.log("response: "+response.status);
        throw Promise.reject(new Error("invalid headers"));
      }
      if(response.status >=500){
        throw Promise.reject(new Error("server not reachable"));
      }

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
  var cachedURL = localStorage.getItem("key");
  if(cachedURL != null){
    return cachedURL;
  }

  let url = centralRepositoryURL + user_record_id;

  return fetch(url, {headers})
    .then(function(response) {
      if (response.status >=200 && response.status <300){
        //console.log(response.data.url);
        //localStorage.setItem('key', response.data.url);
        return response.json();
        // localStorage.setItem('key', data);
      }
      if (response.status == 404 || response.status == 403){
        return {data: {url: defaultServer}};
        // localStorage.setItem('key', data);
      }
      if (response.status == 401){
        return Promise.reject(new Error("invalid headers"));
      }
      if(response.status >=500){
        return Promise.reject(new Error("server not reachable"));
      }

      return response.json();
    })
    .then(function(data){
      return data.data.url;
    })
 };
