
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

            <!--
            <ul>
                <li v-for="(item, i) in favoriteItems">
                    <span class="action danger glyphicon glyphicon-remove pull-right" aria-hidden="true" :title="`remove [${item.username}] from favorites`" @click="removeItem(item.username)"></span>
                    <router-link class="channel" :to="'/' + item.username" :title="getChannelTitle(item)">
                        {{ getViewers(item) }} {{ item.display_name || item.username }}
                    </router-link>
                    <div v-if="item.viewers >= 0" class="game indented">{{ item.game }}</div>
                </li>
            </ul>
            -->

            <p class="action"><br/>show history</p>
            <ul>
                <li v-for="(item, i) in historyItems">
                    <span class="action danger glyphicon glyphicon-remove pull-right" aria-hidden="true" :title="`remove [${item.username}] from history`" @click="removeItem(item.username)"></span>
                    <router-link class="channel" :to="'/' + item.username" :title="getChannelTitle(item)">
                        {{ getViewers(item) }} {{ item.display_name || item.username }}
                    </router-link>
                    <div v-if="item.viewers >= 0" class="game indented">{{ item.game }}</div>
                </li>
            </ul>
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
            historyItems: [],
            liveData: {}
        }
    },
    mounted: function() {
        this.getAndDisplayItems()
    },
    methods: {
        addFavorite: function() {
            // ensure that we have a proper username, lowercase alphanumerics only
            const items = updateItemByUsername(this.newUsername.replace(/[^a-z0-9]/gi,'').toLowerCase(), 1)
            this.newUsername = ''
            this.getAndDisplayItems(items)
        },
        getChannelTitle: function(item) {
            const displayTime = new Date(item.last_viewed).toLocaleTimeString([], {weekday: 'short', hour: '2-digit', minute: '2-digit', second: '2-digit'})
            return `${item.num_viewed} views - last viewed ${displayTime}`
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
            items = this.addLiveData(items)
            let favoriteItems = []
            let historyItems = []
            for (let i=0; i<items.length; i++) {
                if (items[i].is_favorite) {
                    favoriteItems.push(items[i])
                } else {
                    historyItems.push(items[i])
                }
            }

            // sort items and display initial data (before ajax call to check live streams)
            favoriteItems.sort(sortArray(['-viewers', 'username']))
            historyItems.sort(sortArray(['-viewers', '-last_viewed']))
            this.favoriteItems = favoriteItems
            this.historyItems = historyItems

            this.getLiveData()
        },
        getLiveData: function() {
            // get usernames
            // prioritize favorite items and limit it to 125 because user may have a lot of historyItems
            const vm = this
            let usernames = []
            for (let i=0; i<vm.favoriteItems.length; i++) {
                usernames.push(vm.favoriteItems[i].username)
            }
            for (let i=0; i<vm.historyItems.length; i++) {
                usernames.push(vm.historyItems[i].username)
            }
            usernames = usernames.slice(0, 125)

            // check twitch for live streams
            const liveData = {}
            checkStreams(usernames).then(function(data) {
                // parse into format that we can use
                for (let i=0; i<data.streams.length; i++) {
                    liveData[data.streams[i].channel.name] = {
                        game: data.streams[i].game,
                        viewers: data.streams[i].viewers,
                        display_name: data.streams[i].channel.display_name
                    }
                }
                vm.liveData = liveData

                // update items and sort
                vm.favoriteItems = vm.addLiveData(vm.favoriteItems).sort(sortArray(['-viewers', 'username']))
                let favoriteItemsGrouped = groupArrayByField(vm.favoriteItems.slice().sort(sortArray(['game', '-viewers'])), 'game')
                const tmp = favoriteItemsGrouped['']
                delete favoriteItemsGrouped['']
                favoriteItemsGrouped['offline'] = tmp
                vm.favoriteItemsGrouped = favoriteItemsGrouped
                vm.historyItems = vm.addLiveData(vm.historyItems).sort(sortArray(['-viewers', '-last_viewed']))
                vm.lastRefresh = getDisplayTime()
                vm.$parent.$options.methods.resizeOverlay()
            })
        },
        addLiveData: function(items) {
            const liveData = this.liveData
            for (let i=0; i<items.length; i++) {
                items[i].game = ''
                items[i].viewers = -1
                items[i].display_name = ''
                if (liveData[items[i].username]) {
                    items[i].game =  liveData[items[i].username].game
                    items[i].viewers =  liveData[items[i].username].viewers
                    items[i].display_name =  liveData[items[i].username].display_name
                }
            }
            return items
        },
    }
}
</script>