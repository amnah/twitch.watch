
<template>
    <div id="speedrunslive">
        <input id="speedrunslive-filter" placeholder="(filter)" v-model.trim="filter" @keyup="prepFilterForCompare">
        <a class="action" href="javascript:void(0)" @click="getStreams()">refresh</a>
        <strong>{{ lastRefresh }}</strong>

        <div class="sort-by">
            <strong>Sort by:</strong>
            <a class="action" :class="{active: sortBy == 'viewers'}" href="javascript:void(0)" @click="setSortBy('viewers')">viewers</a>
            <a class="action" :class="{active: sortBy == 'game'}" href="javascript:void(0)" @click="setSortBy('game')">game</a>
        </div>

        <div id="speedrunslive-items">
            <div class="scroll-list" v-if="sortBy == 'game'">
                <div v-for="(channels, game) in channelsByGame">
                    <div class="game" v-show="showGame(game)">{{ game || '(No game set)' }} [{{ viewersByGame[game] }}]</div>
                    <ul>
                        <li v-show="showChannel(channel)" v-for="(channel, game) in channels">
                            <router-link class="channel channel-indented" :to="'/' + channel.name" :title="channel.title">
                                [{{ channel.current_viewers }}] {{ channel.display_name }}
                            </router-link>
                        </li>
                    </ul>
                </div>
            </div>

            <ul class="scroll-list" v-if="sortBy == 'viewers'">
                <li class="viewers" v-show="showChannel(channel)" v-for="(channel, i) in channelsByViewers">
                    <router-link class="channel" :to="'/' + channel.name" :title="channel.title">
                        [{{ channel.current_viewers }}] {{ channel.display_name }}
                    <div class="game game-indented">{{ channel.meta_game }}</div>
                    </router-link>
                </li>
            </ul>
        </div>
    </div>
</template>

<script>
import {getTime, sortArray, prepStringForCompare} from '../functions.js'
export default {
    name: 'speedRunsLive',
    mounted: function() {
        this.getStreams()
    },
    data: function() {
        return {
            lastRefresh: '',
            filter: '',
            filterPreppedForCompare: '',
            sortBy: 'viewers',
            channelsByGame: {},
            channelsByViewers: [],
            viewersByGame: {}
        }
    },
    methods: {
        setSortBy: function(by) {
            this.sortBy = by
            this.focusFilter()
        },
        prepFilterForCompare: function() {
            this.filterPreppedForCompare = prepStringForCompare(this.filter)
        },
        showGame: function(game) {
            if (!this.filterPreppedForCompare) {
                return true
            }

            // concatenate all channels under this game
            let haystack = ''
            const channels = this.channelsByGame[game]
            for (let i=0, len=channels.length; i<len; i++) {
                haystack += channels[i].filterHaystack
            }
            return haystack.indexOf(this.filterPreppedForCompare) >= 0
        },
        showChannel: function(channel) {
            if (!this.filterPreppedForCompare) {
                return true
            }
            return channel.filterHaystack.indexOf(this.filterPreppedForCompare) >= 0
        },
        focusFilter: function() {
            $('#speedrunslive-filter').focus()
        },
        getStreams: function() {
            const vm = this
            $.ajax({
                url: 'https://api.speedrunslive.com/frontend/streams'
            }).then(function(data) {
                // prep channels for filter comparison
                let channels = data._source.channels
                for (let i=0; i<channels.length; i++) {
                    const channel = channels[i]
                    channel.filterHaystack = prepStringForCompare(channel.display_name + channel.meta_game + channel.name + channel.title + channel.user_name)
                }

                // sort by viewers desc
                channels = sortArray(channels, 'current_viewers').reverse()
                vm.channelsByViewers = channels

                // sort by games
                vm.processChannelsByGame(channels)

                // update refresh time and focus on the filter
                vm.lastRefresh = getTime()
                vm.focusFilter()
            })
        },
        processChannelsByGame: function(channels) {
            // sort channels by game
            const vm = this
            let channelsByGame = {}
            channels = sortArray(channels, 'meta_game')
            for (let i=0; i<channels.length; i++) {
                const channel = channels[i]
                channelsByGame[channel.meta_game] = channelsByGame[channel.meta_game] || []
                channelsByGame[channel.meta_game].push(channel)
            }

            // count number of viewers
            for (let game in channelsByGame) {
                let numViewers = 0
                const channels = channelsByGame[game]
                for (let i=0; i<channels.length; i++) {
                    numViewers += channels[i].current_viewers
                }
                vm.viewersByGame[game] = numViewers
            }

            // set data
            vm.channelsByGame = channelsByGame
        }
    }
}
</script>