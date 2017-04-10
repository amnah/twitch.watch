
<template>
    <div id="history">
        <input class="filter" placeholder="(filter)" v-model.trim="filter" @keyup="prepFilterForCompare">
        <!--
        <a class="action" href="javascript:void(0)" @click="getStreams()">refresh</a>
        <strong title="last refreshed at">{{ lastRefresh }}</strong>
        -->

        <div class="sort-by">
            <strong>Sort by:</strong>
            <a class="action" :class="{active: sortBy == 'last_viewed'}" href="javascript:void(0)" @click="setSortBy('last_viewed')">last_viewed</a>
            <a class="action" :class="{active: sortBy == 'num_viewed'}" href="javascript:void(0)" @click="setSortBy('num_viewed')">num_viewed</a>
        </div>

        <div class="items">
            <ul class="scroll-list">
                <li class="viewers" v-show="showChannel(item.username)" v-for="(item, i) in historyItems">
                    <span class="action danger glyphicon glyphicon-remove pull-right" aria-hidden="true" title="remove from history" @click="removeChannel(item.username)"></span>
                    <router-link class="channel indented" :to="'/' + item.username" :title="getChannelTitle(item)">
                        [{{ item.num_viewed }}] {{ item.username }}
                    <!--<div class="game indented">{{ channel.meta_game }}</div>-->
                    </router-link>
                </li>
            </ul>
        </div>
    </div>
</template>

<script>
import {sortArray, prepStringForCompare, getHistory, removeHistoryByUsername} from '../functions.js'
export default {
    name: 'history',
    data: function() {
        return {
            lastRefresh: '',
            filter: '',
            filterPreppedForCompare: '',
            sortBy: 'last_viewed',
            historyItems: [],
        }
    },
    mounted: function() {
        this.getHistoryItems()
    },
    methods: {
        setSortBy: function(by) {
            this.sortBy = by
            this.getHistoryItems()
        },
        prepFilterForCompare: function() {
            this.filterPreppedForCompare = prepStringForCompare(this.filter)
        },
        showChannel: function(channel) {
            if (!this.filterPreppedForCompare) {
                return true
            }
            return prepStringForCompare(channel).indexOf(this.filterPreppedForCompare) >= 0
        },
        getChannelTitle: function(item) {
            const displayTime = new Date(item.last_viewed).toLocaleTimeString([], {weekday: 'short', hour: '2-digit', minute: '2-digit', second: '2-digit'})
            return `${item.num_viewed} views - last viewed ${displayTime}`
        },
        removeChannel: function(username) {
            console.log(`Removing channel from history [ ${username} ]`)
            removeHistoryByUsername(username)
            this.getHistoryItems()
        },
        getHistoryItems: function() {
            this.historyItems = sortArray(getHistory(), this.sortBy).reverse()
        }
    }
}
</script>