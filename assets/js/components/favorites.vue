
<template>
    <div id="history">

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
            <div class="sort-by">
                <strong>Favorites:</strong>
            </div>
            <ul>
                <li class="viewers" v-for="(item, i) in favoriteItems">
                    <span class="action danger glyphicon glyphicon-remove pull-right" aria-hidden="true" :title="`remove [${item.username}] from favorites`" @click="removeItem(item.username)"></span>
                    <router-link class="channel" :to="'/' + item.username" :title="getChannelTitle(item)">
                        {{ getViewers(item) }} {{ item.username }}
                    </router-link>
                    <div v-if="item.viewers >= 0" class="game indented">{{ item.game }}</div>
                </li>
            </ul>
            <div class="sort-by">
                <strong>History:</strong>
                <a class="action" :class="{active: sortHistoryBy == 'username'}" href="javascript:void(0)" @click="setHistorySortBy('username')" title="sort by username">username</a>
                <a class="action" :class="{active: sortHistoryBy == 'last_viewed'}" href="javascript:void(0)" @click="setHistorySortBy('last_viewed')" title="sort by last time viewed">last</a>
                <a class="action" :class="{active: sortHistoryBy == 'num_viewed'}" href="javascript:void(0)" @click="setHistorySortBy('num_viewed')" title="sort by number of times viewed">num</a>
            </div>
            <ul>
                <li class="viewers" v-for="(item, i) in historyItems">
                    <span class="action danger glyphicon glyphicon-remove pull-right" aria-hidden="true" :title="`remove [${item.username}] from history`" @click="removeItem(item.username)"></span>
                    <router-link class="channel" :to="'/' + item.username" :title="getChannelTitle(item)">
                        {{ getViewers(item) }} {{ item.username }}
                    </router-link>
                    <div v-if="item.viewers >= 0" class="game indented">{{ item.game }}</div>
                </li>
            </ul>
        </div>
    </div>
</template>

<script>
import {sortArray, prepStringForCompare, getDisplayTime, getItems, updateItemByUsername, removeItemByUsername} from '../functions.js'
import {checkStreams} from '../twitchApi.js'
export default {
    name: 'favorites',
    data: function() {
        return {
            newUsername: '',
            lastRefresh: '',
            favoriteItems: [],
            sortHistoryBy: 'username',
            historyItems: [],
            liveData: {}
        }
    },
    mounted: function() {
        this.getAndDisplayItems()
    },
    methods: {
        addFavorite: function() {
            const items = updateItemByUsername(this.newUsername, 1)
            this.newUsername = ''
            this.getAndDisplayItems(items)
        },
        setHistorySortBy: function(by) {
            this.sortHistoryBy = by
            this.getAndDisplayItems()
        },
        getChannelTitle: function(item) {
            const displayTime = new Date(item.last_viewed).toLocaleTimeString([], {weekday: 'short', hour: '2-digit', minute: '2-digit', second: '2-digit'})
            return `${item.num_viewed} views - last viewed ${displayTime}`
        },
        getViewers: function(item) {
            if (item.viewers >= 0) {
                return `[${item.viewers}]`
            }
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

            // sort items
            favoriteItems.sort(sortArray('username'))
            historyItems.sort(sortArray(this.sortHistoryBy))
            if (this.sortHistoryBy != 'username') {
                historyItems.reverse()
            }
            this.favoriteItems = favoriteItems
            this.historyItems = historyItems

            this.getLiveData()
        },
        getLiveData: function() {
            // get usernames (prioritize favorite items)
            const vm = this
            let usernames = []
            for (let i=0; i<vm.favoriteItems.length; i++) {
                usernames.push(vm.favoriteItems[i].username)
            }
            for (let i=0; i<vm.historyItems.length; i++) {
                usernames.push(vm.historyItems[i].username)
            }

            const liveData = {}
            checkStreams(usernames).then(function(data) {
                for (let i=0; i<data.streams.length; i++) {
                    liveData[data.streams[i].channel.name] = {
                        game: data.streams[i].game,
                        viewers: data.streams[i].viewers
                    }
                }
                vm.liveData = liveData
                vm.favoriteItems = vm.addLiveData(vm.favoriteItems).sort(sortArray(['-viewers', 'username']))
                vm.historyItems = vm.addLiveData(vm.historyItems).sort(sortArray(['-viewers', 'username']))
                vm.lastRefresh = getDisplayTime()
            })
        },
        addLiveData: function(items) {
            const liveData = this.liveData
            for (let i=0; i<items.length; i++) {
                items[i].game = null
                items[i].viewers = -1
                if (liveData[items[i].username]) {
                    items[i].game =  liveData[items[i].username].game
                    items[i].viewers =  liveData[items[i].username].viewers
                }
            }
            return items

        }
    }
}
</script>