
<template>
    <div id="favorites">

        <span class="last-refreshed action pull-right" title="last refreshed at" @click="getItems()">
            {{ loading ? '...' : '' }} {{ lastRefresh }}
            <span class="glyphicon glyphicon-refresh" aria-hidden="true"></span>
        </span>

        <form role="form" @submit.prevent="addFavorite()">
            <input placeholder="(twitch username)" v-model.trim="newUsername">
            <a class="action" @click="addFavorite()">add</a>
        </form>

        <div class="items scroll-list">
            <div v-for="(items, game) in favoriteItemsGrouped">
                <div class="game">
                    {{ game || '(No game set)' }}
                    <a class="action" v-show="game == '(offline)'" @click="showOfflineFavorites = !showOfflineFavorites">show offline</a>
                </div>
                <ul>
                    <li v-for="item in items" v-show="game != '(offline)' || showOfflineFavorites">
                        <span class="action danger glyphicon glyphicon-remove pull-right" aria-hidden="true" :title="`remove [${item.username}] from favorites`" @click="removeItem(item.username, true)"></span>
                        <router-link class="channel indented" :to="'/' + item.username" :title="displayChannelTitle(item)">
                            {{ displayViewers(item) }} {{ item.display_name || item.username }}
                        </router-link>
                    </li>
                </ul>
            </div>

            <p id="show-history" class="action" @click="showHistory = !showHistory">show history</p>
            <div v-show="showHistory" v-for="(items, game) in historyItemsGrouped">
                <div class="game">{{ game || '(No game set)' }}</div>
                <ul>
                    <li v-for="item in items">
                        <span class="action danger glyphicon glyphicon-remove pull-right" aria-hidden="true" :title="`remove [${item.username}] from history\n\nPERMANENT PERMANENT PERMANENT`" @click="removeItem(item.username)"></span>
                        <span class="action glyphicon glyphicon-star pull-right" aria-hidden="true" :title="`add favorite [${item.username}]`" @click="addFavorite(item.username)"></span>
                        <router-link class="channel indented" :to="'/' + item.username" :title="displayChannelTitle(item)">
                            {{ displayViewers(item) }} {{ item.display_name || item.username }}
                        </router-link>
                    </li>
                </ul>
            </div>
        </div>
    </div>
</template>

<script>
import {sortArray, groupArrayByField, prepStringForCompare, getDisplayTime, getHistoryItems, updateHistoryItemByUsername, removeHistoryItemByUsername} from '../functions.js'
import {buildLiveData, addLiveData} from '../twitchApi.js'
export default {
    name: 'favorites',
    data: function() {
        return {
            newUsername: '',
            loading: false,
            lastRefresh: '',
            favoriteItemsGrouped: {},
            historyItemsGrouped: {},
            showOfflineFavorites: false,
            showHistory: false,
        }
    },
    methods: {
        addFavorite: function(username) {

            // get username from function parameter or text input
            let usernames = username
            if (!usernames) {
                usernames = this.newUsername
                this.newUsername = ''
            }

            // ensure that we have a proper username - lowercase alphanumerics only + underscore
            // then separate by comma for batch processing
            usernames = usernames.replace(/[^a-z0-9_,]/gi,'').toLowerCase().split(',')

            // add usernames and update list
            let items
            for (let i=0; i<usernames.length; i++) {
                // check for username
                if (usernames[i]) {
                    items = updateHistoryItemByUsername(usernames[i], 1)
                }
            }
            this.getItems(items)
        },
        displayChannelTitle: function(item) {
            const displayTime = new Date(item.last_viewed).toLocaleTimeString([], {weekday: 'short', hour: '2-digit', minute: '2-digit', second: '2-digit'})
            let title = `${item.num_viewed} views - last viewed ${displayTime}`
            if (item.status) {
                title = `${item.status}\n\n${title}`
            }
            return title
        },
        displayViewers: function(item) {
            if (item.viewers >= 0) {
                return `[${item.viewers}]`
            }
            return `-`
        },
        removeItem: function(username, refreshTwitch) {
            // remove item from the localStorage
            // note: favorite items will be moved to history. history items will be removed permanently
            const items = removeHistoryItemByUsername(username)

            // refresh data from twitch (for favorites)
            // otherwise just remove the item (for history)
            if (refreshTwitch) {
                return this.getItems(items)
            }

            // iterate through and remove the item
            for (let key in this.historyItemsGrouped) {
                let items = this.historyItemsGrouped[key]
                for (let i=0; i<items.length; i++) {
                    if (items[i].username === username) {
                        items.splice(i, 1)
                        if (!items.length) {
                            delete this.historyItemsGrouped[key]
                        }
                        return
                    }
                }
            }
        },
        refresh: function() {
            this.getItems()
        },
        getItems: function(items) {
            // filter favorites and history items
            items = items || getHistoryItems()
            let favoriteItems = []
            let historyItems = []
            let usernames = []
            for (let i=0; i<items.length; i++) {
                if (items[i].is_favorite) {
                    favoriteItems.push(items[i])
                    usernames.unshift(items[i].username)
                } else {
                    historyItems.push(items[i])
                    usernames.push(items[i].username)
                }
            }

            // build liveData using the usernames
            // limit usernames to 300 because the user may have a lot of historyItems
            // (put priority on the favorites first)
            const vm = this
            usernames = usernames.slice(0, 300)
            vm.loading = true
            buildLiveData(usernames).then(function(liveData) {
                vm.processItems(favoriteItems, historyItems, liveData)
            }, function(e) {
                console.log('error', e)
                vm.processItems(favoriteItems, historyItems)
            })
        },
        processItems: function(favoriteItems, historyItems, liveData = {}) {

            // add liveData and group by game + sort
            favoriteItems = addLiveData(favoriteItems, liveData).sort(sortArray(['game', '-viewers', 'username']))
            let favoriteItemsGrouped = groupArrayByField(favoriteItems, 'game')
            historyItems = addLiveData(historyItems, liveData).sort(sortArray(['game', '-viewers', '-last_viewed', 'username']))
            let historyItemsGrouped = groupArrayByField(historyItems, 'game')

            // move offline to end of object so they appear last
            const offlineKey = '(offline)'
            let tmpOfflineItems = favoriteItemsGrouped[offlineKey]
            delete favoriteItemsGrouped[offlineKey]
            favoriteItemsGrouped[offlineKey] = tmpOfflineItems
            tmpOfflineItems = historyItemsGrouped[offlineKey]
            delete historyItemsGrouped[offlineKey]
            historyItemsGrouped[offlineKey] = tmpOfflineItems

            // update data
            this.favoriteItemsGrouped = favoriteItemsGrouped
            this.historyItemsGrouped = historyItemsGrouped
            this.loading = false
            this.lastRefresh = getDisplayTime()
            this.$emit('resizeOverlay')
        }
    }
}
</script>