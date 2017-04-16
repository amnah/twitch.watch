
import {getConfig, arrayPluck} from './functions.js'

// --------------------------------------------------------
// Twitch settings and helper functions
// --------------------------------------------------------
function twitchUrl() {
    return 'https://api.twitch.tv/kraken/'
}
function twitchConfig() {
    return {
        headers: {
            'Client-ID': getConfig('twitchClientId') || 'kiipiv740twqvx0haax8frqi5xtho3',
            'Accept': 'application/vnd.twitchtv.v5+json'
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

export function getUserIds(usernames) {
    if (usernames.join) {
        usernames = usernames.join(',')
    }
    if (!usernames) {
        return $.when([])
    }
    return getTwitch('users', {login: usernames, limit: 100}).then(function(data) {
        return arrayPluck(data.users, '_id')
    })
}

export function checkStreams(userIds) {
    if (userIds.join) {
        userIds = userIds.join(',')
    }
    if (!userIds) {
        return $.when([])
    }
    return getTwitch('streams', {channel: userIds, limit: 100}).then(function(data) {
        return data.streams
    })
}

export function checkStreamsByUsernames(usernames) {
    // ensure array
    if (usernames.split) {
        usernames = usernames.split(',')
    }

    // return empty promise if we have no usernames
    // @link http://stackoverflow.com/questions/30004503/return-an-empty-promise
    if (!usernames.length) {
        return $.when([])
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

    // make multiple ajax calls at once depending on how many usernames we have
    // first we need to use the usernames to get userIds
    // then use the userIds to check stream status
    const chunk0 = getUserIds(chunks[0])
    const chunk1 = chunks[1] ? getUserIds(chunks[1]) : []
    const chunk2 = chunks[2] ? getUserIds(chunks[2]) : []
    return $.when(chunk0, chunk1, chunk2).then(function(userIds0, userIds1, userIds2) {
        return $.when(checkStreams(userIds0), checkStreams(userIds1), checkStreams(userIds2)).then(function(streams0, streams1, streams2) {
            return streams0.concat(streams1).concat(streams2)
        });
    })
}

export function buildLiveData(usernames) {
    return checkStreamsByUsernames(usernames).then(function(streams) {
        // parse into format that we can use
        const liveData = {}
        for (let i=0; i<streams.length; i++) {
            liveData[streams[i].channel.name] = {
                game: streams[i].game,
                viewers: streams[i].viewers,
                display_name: streams[i].channel.display_name,
                status: streams[i].channel.status
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