
import {getConfig} from './functions.js'

// --------------------------------------------------------
// Twitch settings and helper functions
// --------------------------------------------------------
function twitchUrl() {
    return 'https://api.twitch.tv/kraken/'
}
function twitchConfig() {
    return {
        headers: {
            // client id stolen from [twitch.tv stream browser] firefox addon bahahahahha
            // use v3 because v5 sucks fucking ass. can't do shit using usernames
            'Client-ID': getConfig('twitchClientId') || 't163mfex6sggtq6ogh0fo8qcy9ybpd6',
            'Accept': 'application/vnd.twitchtv.v3+json'
        }
    }
}
function successCallback(data) {
    return data;
}
function failureCallback(data) {
    // display the error message and reject
    const origAjax = this;
    const reject = $.Deferred().reject(data);
    const msg = data.status ? `[ ${data.status} ] ${data.statusText}` : `[ Network error ] Please check your connection`;
    console.log(`${msg}\n\n@ ${origAjax.url}`);
    return reject;
}

// --------------------------------------------------------
// Twitch export object
// --------------------------------------------------------

export function getTwitch(url, data) {
    const params = $.extend(twitchConfig(), {
        url: twitchUrl() + url,
        method: 'GET',
        data: data
    });
    return $.ajax(params).then(successCallback, failureCallback)
}

export function checkStreams(usernames) {
    if (usernames.join) {
        usernames = usernames.join(',')
    }
    return getTwitch('streams', {channel: usernames, limit: 100})
}