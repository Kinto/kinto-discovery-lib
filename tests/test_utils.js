"use strict";

export function fakeServerResponse(status, json, headers={}) {
  return Promise.resolve({
    status: status,
    headers: {
      get(name) {
        if (!headers.hasOwnProperty("Content-Length") && name === "Content-Length") {
          return JSON.stringify(json).length;
        }
        return headers[name];
      }
    },
    text() {
      return JSON.stringify(json);
    },
    json(){
      return Promise.resolve(json);
    }
  });
}
