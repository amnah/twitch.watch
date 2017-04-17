
<template>
    <div id="speedrunslive">
        <input class="filter" placeholder="(filter)" v-model.trim="filter" @keyup="prepFilterForCompare">
        <span class="last-refreshed action pull-right" title="last refreshed at" @click="getStreams()">
            {{ lastRefresh }}
            <span class="glyphicon glyphicon-refresh" aria-hidden="true"></span>
        </span>

        <div class="sort-by">
            <strong>Sort by:</strong>
            <a class="action" :class="{active: sortBy == 'game'}" @click="setSortBy('game')">game</a>
            <a class="action" :class="{active: sortBy == 'viewers'}" @click="setSortBy('viewers')">viewers</a>
        </div>

        <div v-if="srliveError" class="error">
            <p>
                <span class="glyphicon glyphicon-exclamation-sign" aria-hidden="true"></span>
                SpeedRunsLive is having https issues - their security certificate expired on 4/15/2017.
            </p>
            <p>For now, please go to the following link and click on <em>"Advanced"</em> to make an exception</p>
            <p><a href="https://api.speedrunslive.com/frontend/streams" target="_blank">https://api.speedrunslive.com/frontend/streams</a></p>
            <p class="action" @click="getStreams()">Refresh <span class="glyphicon glyphicon-refresh" aria-hidden="true"></span></p>
        </div>

        <div class="items">
            <div class="scroll-list" v-if="sortBy == 'game'">
                <div v-for="(channels, game) in channelsByGame">
                    <div class="game" v-show="showGame(game)">{{ game || '(No game set)' }} [{{ viewersByGame[game] }}]</div>
                    <ul>
                        <li v-show="showChannel(channel)" v-for="(channel, game) in channels">
                            <router-link class="channel indented" :to="'/' + channel.name" :title="channel.title">
                                <span title="current viewers">[{{ channel.current_viewers }}]</span> {{ channel.display_name }}
                            </router-link>
                        </li>
                    </ul>
                </div>
            </div>

            <ul class="scroll-list" v-if="sortBy == 'viewers'">
                <li class="viewers" v-show="showChannel(channel)" v-for="(channel, i) in channelsByViewers">
                    <router-link class="channel" :to="'/' + channel.name" :title="channel.title">
                        <span title="current viewers">[{{ channel.current_viewers }}]</span> {{ channel.display_name }}
                    <div class="game indented">{{ channel.meta_game }}</div>
                    </router-link>
                </li>
            </ul>
        </div>
    </div>
</template>

<script>
import {getDisplayTime, sortArray, groupArrayByField, prepStringForCompare} from '../functions.js'
export default {
    name: 'speedRunsLive',
    data: function() {
        return {
            lastRefresh: '',
            filter: '',
            filterPreppedForCompare: '',
            sortBy: 'game',
            srliveError: false,
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
            for (let i=0; i<channels.length; i++) {
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
            // lets not focus for now, it's annoying
            return
            $('#speedrunslive-filter').focus()
        },
        refresh: function() {
            this.getStreams()
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
                vm.channelsByViewers = channels.sort(sortArray('-current_viewers'))

                // sort by games
                vm.processChannelsByGame(channels)

                // update refresh time and resize overlay
                vm.focusFilter()
                vm.lastRefresh = getDisplayTime()
                vm.$parent.$options.methods.resizeOverlay()
                vm.srliveError = false
            }, function() {
                vm.srliveError = true
            })
        },
        processChannelsByGame: function(channels) {
            // sort channels by game
            const vm = this
            channels = channels.slice() // clone array so we don't affect the original
            channels.sort(sortArray(['meta_game', '-current_viewers']))
            const channelsByGame = groupArrayByField(channels, 'meta_game')

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