
import store from './store.js'

// --------------------------------------------------------
// Twitch settings and helper functions
// --------------------------------------------------------

const twitchUrl = 'https://api.twitch.tv/kraken/'
const twitchVersion = 'v3'

function twitchConfig() {
    return {
        headers: {
            'Client-ID': store.getters.appConfig('twitchClientId') || 'kiipiv740twqvx0haax8frqi5xtho3',
            'Accept': `application/vnd.twitchtv.${twitchVersion}+json`
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

export function getTwitch(url, data) {
    const params = Object.assign(twitchConfig(), {
        url: twitchUrl + url,
        method: 'GET',
        data: data
    });
    return $.ajax(params).then(successCallback, failureCallback)
}

// --------------------------------------------------------
// Application functions - live streams by usernames
// --------------------------------------------------------

// v5
export function getUserIds(usernames) {
    if (usernames.join) {
        usernames = usernames.join(',')
    }
    if (!usernames) {
        return $.when([])
    }
    return getTwitch('users', {login: usernames, limit: 100}).then(function(data) {
        return data.users.map(function(item) { return item._id })
    })
}

// v5
export function getStreams(userIds) {
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

// v3
export function getStreamsV3(usernames) {
    if (usernames.join) {
        usernames = usernames.join(',')
    }
    if (!usernames) {
        return $.when([])
    }
    return getTwitch('streams', {channel: usernames, limit: 100}).then(function(data) {
        return data.streams
    })
}

export function getStreamsByUsernames(usernames) {
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

    // twitch v3
    // make concurrent ajax calls if needed
    if (twitchVersion === 'v3') {
        const channels0 = getStreamsV3(chunks[0])
        const channels1 = chunks[1] ? getStreamsV3(chunks[1]) : []
        const channels2 = chunks[2] ? getStreamsV3(chunks[2]) : []
        return $.when(channels0, channels1, channels2).then(function(streams0, streams1, streams2) {
            // fix streams (twitch can return null if no streams are online)
            streams0 = streams0 || []
            streams1 = streams1 || []
            streams2 = streams2 || []
            return streams0.concat(streams1).concat(streams2)
        });
    }

    // twitch v5
    // make concurrent ajax calls if needed
    // use the usernames to get userIds, then use those userIds to get the streams
    const chunk0 = getUserIds(chunks[0])
    const chunk1 = chunks[1] ? getUserIds(chunks[1]) : []
    const chunk2 = chunks[2] ? getUserIds(chunks[2]) : []
    return $.when(chunk0, chunk1, chunk2).then(function(userIds0, userIds1, userIds2) {
        return $.when(getStreams(userIds0), getStreams(userIds1), getStreams(userIds2)).then(function(streams0, streams1, streams2) {
            // fix streams (twitch can return null if no streams are online)
            streams0 = streams0 || []
            streams1 = streams1 || []
            streams2 = streams2 || []
            return streams0.concat(streams1).concat(streams2)
        });
    })
}

export function buildLiveData(usernames) {
    return getStreamsByUsernames(usernames).then(function(streams) {
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

// --------------------------------------------------------
// Application functions - games
// --------------------------------------------------------
export function searchTopGames(offset = 0) {
    return getTwitch('games/top', {limit: 100, offset: offset}).then(function(data) {
        return data.top
    })
}

export function searchGames(query) {
    return getTwitch('search/games', {query: query, type: 'suggest'}).then(function(data) {
        return data.games
    })
}

export function searchStreamsByGame(game, offset = 0) {
    return getTwitch('streams', {game: game, limit: 100, offset: offset}).then(function(data) {
        return data.streams
    })
}

export function searchStreamsByQuery(query, offset = 0) {
    return getTwitch('search/streams', {query: query, limit: 100, offset: offset}).then(function(data) {
        return data.streams
    })
}