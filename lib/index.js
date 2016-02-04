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
  var key = 'kinto:server-url:' + userID;
  // var cachedURL = localStorage.getItem('key');
  // if(cachedURL !== null) {
  //   return cachedURL;
  // }

  let url = centralRepositoryURL + user_record_id;
  var status;
  return fetch(url, {headers})
    .then(function(data) {
      if (data.status >=200 && data.status <300){
        console.log("test", data);
        // localStorage.setItem('key', data);
      }
      return Promise.resolve(data);
    })
    .catch(function(error) {
      if (error.status == 404) {
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
        });
      } else {
        console.log(error);
      }
    });
}
