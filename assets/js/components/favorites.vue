
<template>
    <div id="favorites">

        <span class="last-refreshed action pull-right" title="last refreshed at" @click="getAndDisplayItems()">
            {{ lastRefresh }}
            <span class="glyphicon glyphicon-refresh" aria-hidden="true"></span>
        </span>
        <form role="form" @submit.prevent="addFavorite()">
            <input placeholder="(twitch username)" v-model.trim="newUsername">
            <a class="action" href="javascript:void(0)" @click="addFavorite()">add</a>
        </form>

        <!--
        <input class="filter" placeholder="(filter)" v-model.trim="filter" @keyup="prepFilterForCompare">
        -->

        <div class="items scroll-list">
            <div v-for="(items, game) in favoriteItemsGrouped">
                <div class="game">{{ game }}</div>
                <ul>
                    <li v-for="item in items">
                        <span class="action danger glyphicon glyphicon-remove pull-right" aria-hidden="true" :title="`remove [${item.username}] from favorites`" @click="removeItem(item.username)"></span>
                        <router-link class="channel indented" :to="'/' + item.username" :title="getChannelTitle(item)">
                            {{ getViewers(item) }} {{ item.display_name || item.username }}
                        </router-link>
                    </li>
                </ul>
            </div>

            <p id="show-history" class="action" @click="showHistory = !showHistory">show history</p>
            <div v-for="(items, game) in historyItemsGrouped">
                <div class="game">{{ game }}</div>
                <ul>
                    <li v-for="item in items">
                        <span class="action danger glyphicon glyphicon-remove pull-right" aria-hidden="true" :title="`remove [${item.username}] from history\n\nPERMANENT PERMANENT PERMANENT`" @click="removeItem(item.username)"></span>
                        <span class="action glyphicon glyphicon-star pull-right" aria-hidden="true" :title="`add favorite [${item.username}]`" @click="addFavorite(item.username)"></span>
                        <router-link class="channel indented" :to="'/' + item.username" :title="getChannelTitle(item)">
                            {{ getViewers(item) }} {{ item.display_name || item.username }}
                        </router-link>
                    </li>
                </ul>
            </div>
        </div>
    </div>
</template>

<script>
import {sortArray, groupArrayByField, prepStringForCompare, getDisplayTime, getItems, updateItemByUsername, removeItemByUsername} from '../functions.js'
import {checkStreams} from '../twitchApi.js'
export default {
    name: 'favorites',
    data: function() {
        return {
            newUsername: '',
            lastRefresh: '',
            favoriteItemsGrouped: {},
            favoriteItems: [],
            showHistory: false,
            historyItemsGrouped: {},
            historyItems: [],
            liveData: {}
        }
    },
    mounted: function() {
        this.getAndDisplayItems()
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
                    items = updateItemByUsername(usernames[i], 1)
                }
            }
            this.getAndDisplayItems(items)
        },
        getChannelTitle: function(item) {
            const displayTime = new Date(item.last_viewed).toLocaleTimeString([], {weekday: 'short', hour: '2-digit', minute: '2-digit', second: '2-digit'})
            let title = `${item.num_viewed} views - last viewed ${displayTime}`
            if (item.status) {
                title = `${item.status}\n\n${title}`
            }
            return title
        },
        getViewers: function(item) {
            if (item.viewers >= 0) {
                return `[${item.viewers}]`
            }
            return `-`
        },
        removeItem: function(username) {
            console.log(`Removing item [ ${username} ]`)
            const items = removeItemByUsername(username)
            this.getAndDisplayItems(items)
        },
        refresh: function() {
            this.getAndDisplayItems()
        },
        getAndDisplayItems: function(items) {
            // filter favorites and history items
            items = items || getItems()
            let favoriteItems = []
            let historyItems = []
            for (let i=0; i<items.length; i++) {
                if (items[i].is_favorite) {
                    favoriteItems.push(items[i])
                } else {
                    historyItems.push(items[i])
                }
            }

            // process items here using the cached data in `this.liveData`
            this.processItems(favoriteItems, historyItems)

            // refresh live data
            this.getLiveData()
        },
        processItems: function(favoriteItems, historyItems) {
            // add liveData and group by game + sort
            // note: offline streams will have a game of 'null', as specified in the `this.addLiveData()` function
            //       we use that knowledge to rename/move those to the end of the object
            favoriteItems = this.addLiveData(favoriteItems).sort(sortArray(['game', '-viewers', 'username']))
            let favoriteItemsGrouped = groupArrayByField(favoriteItems, 'game')
            favoriteItemsGrouped['offline'] = favoriteItemsGrouped[null]
            delete favoriteItemsGrouped[null]
            this.favoriteItems = favoriteItems
            this.favoriteItemsGrouped = favoriteItemsGrouped

            // add liveData and sort
            historyItems = this.addLiveData(historyItems).sort(sortArray(['game', '-viewers', '-last_viewed', 'username']))
            let historyItemsGrouped = groupArrayByField(historyItems, 'game')
            historyItemsGrouped['offline'] = historyItemsGrouped[null]
            delete historyItemsGrouped[null]
            this.historyItems = historyItems
            this.historyItemsGrouped = historyItemsGrouped

            // update meta
            this.lastRefresh = getDisplayTime()
            this.$parent.$options.methods.resizeOverlay()
        },
        addLiveData: function(items) {
            const liveData = this.liveData
            for (let i=0; i<items.length; i++) {
                const liveDataForUser = liveData[items[i].username]
                items[i].game = liveDataForUser ? liveDataForUser.game : null
                items[i].viewers = liveDataForUser ? liveDataForUser.viewers : -1
                items[i].display_name = liveDataForUser ? liveDataForUser.display_name : null
                items[i].status = liveDataForUser ? liveDataForUser.status : null
            }
            return items
        },
        groupItemsByGame: function(items) {

        },
        getLiveData: function() {
            // get usernames - prioritize favorite items
            const vm = this
            let usernames = []
            for (let i=0; i<vm.favoriteItems.length; i++) {
                usernames.push(vm.favoriteItems[i].username)
            }
            for (let i=0; i<vm.historyItems.length; i++) {
                usernames.push(vm.historyItems[i].username)
            }

            // limit usernames to 125 because the user may have a lot of historyItems
            // we want to focus on the favorites, not the history
            usernames = usernames.slice(0, 125)

            // check twitch for live streams
            const liveData = {}
            checkStreams(usernames).then(function(data) {
                // parse into format that we can use
                for (let i=0; i<data.streams.length; i++) {
                    liveData[data.streams[i].channel.name] = {
                        game: data.streams[i].game,
                        viewers: data.streams[i].viewers,
                        display_name: data.streams[i].channel.display_name,
                        status: data.streams[i].channel.status
                    }
                }
                vm.liveData = liveData
                vm.processItems(vm.favoriteItems, vm.historyItems)
            })
        },
    }
}
</script>