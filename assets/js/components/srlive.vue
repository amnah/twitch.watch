
<template>
    <div id="srlive">

        <span class="last-refreshed action pull-right" title="last refreshed at (automatic every 15 minutes)" @click="getStreams()">
            {{ loading ? '...' : '' }} {{ lastRefresh }}
            <span class="glyphicon glyphicon-refresh" aria-hidden="true"></span>
        </span>

        <input placeholder="(filter)" v-model.trim="filter" @keyup="prepFilterForCompare">

        <div class="sort-by">
            <strong>Sort by:</strong>
            <a class="action" :class="{active: sortBy == 'game'}" @click="setSortBy('game')">game</a>
            <a class="action" :class="{active: sortBy == 'viewers'}" @click="setSortBy('viewers')">viewers</a>
        </div>

        <div class="items">
            <div class="error scroll-list" v-show="srliveError">
                <p>
                    <span class="glyphicon glyphicon-exclamation-sign" aria-hidden="true"></span>
                    SpeedRunsLive is having https issues - their security certificate expired on 4/15/2017.
                </p>
                <p>For now, please go to the following link and click on <em>"Advanced"</em> to make an exception</p>
                <p><a href="https://api.speedrunslive.com/frontend/streams" target="_blank">https://api.speedrunslive.com/frontend/streams</a></p>
                <p class="action" @click="getStreams()">Refresh <span class="glyphicon glyphicon-refresh" aria-hidden="true"></span></p>
            </div>

            <div class="scroll-list" v-show="sortBy == 'game'">
                <div v-for="(channels, game) in channelsByGame">
                    <div class="game" v-show="showGame(game)">{{ game || '(No game set)' }} [{{ displayGameViewers(game) }}]</div>
                    <ul>
                        <li v-show="showChannel(channel)" v-for="(channel, game) in channels">
                            <router-link class="channel indented" :to="'/' + channel.name" :title="channel.title">
                                <span :title="`${channel.current_viewers} current viewers`">[{{ channel.current_viewers }}]</span>
                                {{ channel.display_name }}
                            </router-link>
                        </li>
                    </ul>
                </div>
            </div>

            <ul class="scroll-list" v-show="sortBy == 'viewers'">
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
import {buildLiveData} from '../twitchApi.js'
export default {
    name: 'srlive',
    data: function() {
        return {
            loading: false,
            lastRefresh: '',
            filter: '',
            filterPreppedForCompare: '',
            sortBy: 'game',
            srliveError: false,
            channelsByGame: {},
            channelsByViewers: [],
        }
    },
    methods: {
        setSortBy: function(by) {
            this.sortBy = by
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
        displayGameViewers: function(game) {
            let numViewers = 0
            const channels = this.channelsByGame[game]
            for (let i=0; i<channels.length; i++) {
                numViewers += channels[i].current_viewers
            }
            return numViewers
        },
        refresh: function() {
            this.getStreams()
        },
        getStreams: function() {
            const vm = this
            vm.loading = true
            $.ajax({
                url: 'https://api.speedrunslive.com/frontend/streams'
            }).then(function(data) {
                vm.srliveError = false
                let usernames = data._source.channels.map(function(item) { return item.name })
                return buildLiveData(usernames)
            }, function() {
                vm.srliveError = true
            }).then(function(liveData) {
                const channels = []
                const usernames = Object.keys(liveData)
                for (let i=0; i<usernames.length; i++) {
                    const channelData = liveData[usernames[i]]
                    channels.push({
                        name: usernames[i],
                        filterHaystack: prepStringForCompare(usernames[i] + channelData.game + channelData.display_name + channelData.status),
                        meta_game: channelData.game,
                        current_viewers: channelData.viewers,
                        display_name: channelData.display_name,
                        title: channelData.status,
                    });
                }

                // sort by viewers desc
                vm.channelsByViewers = channels.sort(sortArray('-current_viewers'))

                // sort by games
                // clone array so we don't affect the original
                let channelsByGame = channels.slice().sort(sortArray(['meta_game', '-current_viewers']))
                channelsByGame = groupArrayByField(channelsByGame, 'meta_game')
                vm.channelsByGame = channelsByGame

                // update refresh time and resize overlay
                vm.loading = false
                vm.lastRefresh = getDisplayTime()
                vm.$emit('resizeOverlay')
            })
        }
    }
}
</script>