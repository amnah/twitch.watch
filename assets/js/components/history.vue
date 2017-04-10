
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
                    <router-link class="channel indented" :to="'/' + item.username">
                        <span title="number of views">[{{ item.num_viewed }}]</span> {{ item.username }}
                    <!--<div class="game indented">{{ channel.meta_game }}</div>-->
                    </router-link>
                </li>
            </ul>
        </div>
    </div>
</template>

<script>
import {getHistory, getDisplayTime, sortArray, prepStringForCompare} from '../functions.js'
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
        this.setSortBy(this.sortBy)
    },
    methods: {
        setSortBy: function(by) {
            this.sortBy = by
            this.historyItems = sortArray(getHistory(), by).reverse()
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
    }
}
</script>