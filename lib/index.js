"use strict";

import md5 from "md5";
import uuid from "uuid";
import "isomorphic-fetch";

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


  let url = centralRepositoryURL + user_record_id;
  var body = JSON.stringify({
      data:{
        url: userStorageURL
      }
  });
  console.log(body);
  return fetch(url,{
    method:'put',
    headers,
    body
  })

    .then(function(response) {
      if (response.status >=200 && response.status <300){
        console.log("test", response);
        return userStorageURL;
      }
    })
    .catch(function(error) {

        console.log(error);
        return error;
    });
};


export function retrieveUserURL(userID, centralRepositoryURL, headers, defaultServer){
  var user_record_id = getUserIDHash(userID);


  let url = centralRepositoryURL + user_record_id;

  return fetch(url, {headers})
    .then(function(response) {
      if (response.status >=200 && response.status <300){
        console.log("test", response);
        // localStorage.setItem('key', data);
      }
      return response.json();
    })
    .then(function(data){
      return data.data.url;
    })
    .catch(function(error) {

        console.log(error);
      return error;
    });
};
