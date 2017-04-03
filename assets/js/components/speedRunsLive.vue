
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
            <div v-if="sortBy == 'game'" v-for="(channels, game) in channelsByGame">
                <div class="game" v-show="showGame(game)">{{ game || '(No game set)' }} [{{ viewersByGame[game] }}]</div>
                <ul>
                    <li v-show="showChannel(channel)" v-for="(channel, game) in channels">
                        <router-link class="channel channel-indented" :to="'/' + channel.name" :title="channel.title">
                            [{{ channel.current_viewers }}] {{ channel.display_name }}
                        </router-link>
                    </li>
                </ul>
            </div>

            <ul v-if="sortBy == 'viewers'">
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
import {getTime, prepStringForCompare} from '../functions.js'
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
                vm.lastRefresh = getTime()
                vm.processChannelsByGame(data._source.channels)
                vm.processChannelsByViewers(data._source.channels)
                vm.focusFilter()
            })
        },
        processChannelsByGame: function(channels) {
            // sort channels by game
            const vm = this
            let channelsByGame = {}
            channels = vm.sortArray(channels, 'meta_game')
            for (let i=0; i<channels.length; i++) {
                // prep string for filter comparison later
                const channel = channels[i]
                channel.filterHaystack = prepStringForCompare(channel.display_name + channel.meta_game + channel.name + channel.title + channel.user_name)

                // create array for this game if needed
                channelsByGame[channel.meta_game] = channelsByGame[channel.meta_game] || []
                channelsByGame[channel.meta_game].push(channel)
            }

            // sort channels by viewers desc
            for (let game in channelsByGame) {
                let channels = channelsByGame[game]
                channels = vm.sortArray(channels, 'current_viewers')
                channels = channels.reverse()
                channelsByGame[game] = channels

                // count total viewers while we're at it
                let numViewers = 0
                for (let i=0; i<channels.length; i++) {
                    numViewers += channels[i].current_viewers
                }
                vm.viewersByGame[game] = numViewers
            }

            // set data
            vm.channelsByGame = channelsByGame
        },
        processChannelsByViewers: function(channels) {
            // prep string for filter comparison later
            for (let i=0; i<channels.length; i++) {
                const channel = channels[i]
                channel.filterHaystack = prepStringForCompare(channel.display_name + channel.meta_game + channel.name + channel.title + channel.user_name)
            }
            this.channelsByViewers = this.sortArray(channels, 'current_viewers').reverse()
        },
        sortArray: function(array, field) {
            // http://stackoverflow.com/questions/1069666/sorting-javascript-object-by-property-value/19326174#19326174
            // use slice() to copy the array and not just make a reference
            let copyArray = array.slice(0)
            copyArray.sort(function(a, b) {
                // compare string
                if (a[field].toLowerCase) {
                    const x = a[field].toLowerCase()
                    const y = b[field].toLowerCase()
                    return x < y ? -1 : x > y ? 1 : 0
                }
                // compare number
                return a[field] - b[field]
            })
            return copyArray
        }
    }
}
</script>