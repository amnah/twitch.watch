
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
            // use v3 because v5 sucks fucking ass. can't do shit using usernames
            'Client-ID': getConfig('twitchClientId') || 'kiipiv740twqvx0haax8frqi5xtho3',
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
// Twitch export functions
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
    // ensure array
    if (usernames.split) {
        usernames = usernames.split(',')
    }

    // return empty promise if we have no usernames
    // @link http://stackoverflow.com/questions/30004503/return-an-empty-promise
    if (!usernames.length) {
        return $.when({streams:[]})
    }

    // check if we have more than 300
    const max = 300
    usernames = $.unique(usernames)
    if (usernames.length > max) {
        const msg = `WARNING: trying to check ${usernames.length} streams at once - limiting to ${max}`
        alert(msg)
        console.warn(msg)
        usernames = usernames.slice(0, max)
    }

    // chunk array by 100 (twitch limit)
    //@ link http://stackoverflow.com/questions/8495687/split-array-into-chunks/8495740#8495740
    let chunks = []
    for (let i=0; i<usernames.length; i+=100) {
        chunks.push(usernames.slice(i, i+100));
    }

    // make multiple ajax calls at once depending on how much usernames we have
    if (chunks.length === 1) {
        return getTwitch('streams', {channel: chunks[0].join(','), limit: 100})
    }
    if (chunks.length === 2) {
        const channels0 = getTwitch('streams', {channel: chunks[0].join(','), limit: 100})
        const channels1 = getTwitch('streams', {channel: chunks[1].join(','), limit: 100})
        return $.when(channels0, channels1).then(function(data0, data1) {
            return { streams: data0.streams.concat(data1.streams) }
        });
    }
    if (chunks.length === 3) {
        const channels0 = getTwitch('streams', {channel: chunks[0].join(','), limit: 100})
        const channels1 = getTwitch('streams', {channel: chunks[1].join(','), limit: 100})
        const channels2 = getTwitch('streams', {channel: chunks[2].join(','), limit: 100})
        return $.when(channels0, channels1, channels2).then(function(data0, data1, data2) {
            return { streams: data0.streams.concat(data1.streams).concat(data2.streams) }
        });
    }
}

export function buildLiveData(usernames) {
    return checkStreams(usernames).then(function(data) {
        // parse into format that we can use
        const liveData = {}
        for (let i=0; i<data.streams.length; i++) {
            liveData[data.streams[i].channel.name] = {
                game: data.streams[i].game,
                viewers: data.streams[i].viewers,
                display_name: data.streams[i].channel.display_name,
                status: data.streams[i].channel.status
            }
        }
        return liveData
    })
}

export function addLiveData(items, liveData) {
    for (let i=0; i<items.length; i++) {
        const liveDataForUser = liveData[items[i].username]
        items[i].game = liveDataForUser ? liveDataForUser.game : null
        items[i].viewers = liveDataForUser ? liveDataForUser.viewers : -1
        items[i].display_name = liveDataForUser ? liveDataForUser.display_name : null
        items[i].status = liveDataForUser ? liveDataForUser.status : null
    }
    return items
}