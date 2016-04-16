"use strict";

import md5 from "md5";
import uuid from "uuid";
import "isomorphic-fetch";

function parseHexString(str) {
  let result = [];
  while (str.length >= 2) {
    result.push(parseInt(str.substring(0, 2), 16));
    str = str.substring(2, str.length);
  }
  return result;
}

export function getUserIDHash(userID) {
  let hash = md5(userID);
  let input = parseHexString(hash);
  return uuid.v4({random: input});
};

export function registerUserURL(userID, centralRepositoryURL, headers, userStorageURL, localStorage) {

  let user_record_id = getUserIDHash(userID);
  let key = 'kinto:server-url:' + centralRepositoryURL + userID; //replace centralRepositoryURL with toBeStored

  let url = centralRepositoryURL + user_record_id;
  let body = JSON.stringify({
      data:{
        url: userStorageURL
      }
  });

  if (!headers.hasOwnProperty("Authorization")) {
    return Promise.reject(new Error("Missing Authorization header."));
  }

  return fetch(url, {
    method:'put',
    headers,
    body
  })
  .then(function(response) {

    if (response.status >= 200 && response.status < 300) {
      localStorage.setItem(key, userStorageURL);
      return userStorageURL;
    }

    if (response.status == 401){
      throw new Error("Invalid Authentication headers.");
    }

    if (response.status >= 500) {
      throw new Error("Server not available.");
    }

    throw new Error("Central repository not correctly configured.");
  });
};


export function retrieveUserURL(userID, centralRepositoryURL, headers,
                                defaultServer, localStorage) {
  if (!defaultServer){
    return Promise.reject(new Error("defaultServer should be defined."));
  }

  if (!headers.hasOwnProperty("Authorization")) {
    return Promise.reject(new Error("Missing Authorization header."));
  }

  let user_record_id = getUserIDHash(userID);
  let key = 'kinto:server-url:' + centralRepositoryURL + userID;
  let cachedURL = localStorage.getItem(key);

  if (cachedURL != null) {
    return Promise.resolve(cachedURL);
  }

  let url = centralRepositoryURL + user_record_id;

  return fetch(url, {headers})
    .then(function(response) {
      if (response.status >= 200 && response.status < 300) {
        return response.json();
      }
      if (response.status == 404 || response.status == 403) {
        return {data: {url: defaultServer}};
      }
      if (response.status == 401) {
        throw new Error("Invalid Authentication headers.");
      }
      if(response.status >= 500) {
        throw new Error("Server is not available.");
      }
      throw new Error("Central repository not correctly configured.");
    })
    .then(function(data){
      localStorage.setItem(key, data.data.url);
      return data.data.url;
    })
 };
