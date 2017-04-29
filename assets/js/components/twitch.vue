
<template>
    <div id="twitch">

        <span class="last-refreshed action pull-right" title="last refreshed at" @click="refresh()">
            {{ loading ? '...' : '' }} {{ lastRefresh }}
            <span class="glyphicon glyphicon-refresh" aria-hidden="true"></span>
        </span>

        <form role="form" @submit.prevent="refresh()">
            <input :placeholder="`(search ${searchBy})`" v-model.trim="query">
        </form>

        <div class="sort-by">
            <strong>Search:</strong>
            <a class="action" :class="{active: searchBy == 'game'}" @click="setSearchBy('game')">game</a>
            <a class="action" :class="{active: searchBy == 'query'}" @click="setSearchBy('query')">query</a>
        </div>

        <div class="sort-by">
            <strong>&raquo; {{ displayGameTitle }}</strong>
        </div>

        <div class="items scroll-list">
            <!-- games -->
            <ul>
                <li v-for="(game, i) in games">
                    <div class="game viewers" :title="`${game.popularity} total viewers`">[{{ game.popularity }}]</div>
                    <div class="game action" @click="setGame(game)">{{ game.name.substring(0, 40) }}</div>
                </li>
            </ul>

            <!-- streams -->
            <ul>
                <li v-for="(stream, i) in streams">
                    <router-link class="channel" :to="'/' + stream.channel.name" :title="stream.channel.status">
                        <img :src="displayStreamLogo(stream)">
                        <span :title="`${stream.viewers} current viewers`">[{{ stream.viewers }}]</span>
                        {{ stream.channel.display_name }}
                    </router-link>

                </li>
            </ul>

            <div class="load-more">
                <a class="action" v-show="searchBy == 'game' && !currentGame && !currentQuery && games.length" @click="getMoreGameItems">load more games</a>
                <a class="action" v-show="searchBy == 'game' && currentGame && streams.length" @click="getMoreStreamsByGame">load more streams</a>
                <a class="action" v-show="searchBy == 'query' && streams.length" @click="getMoreStreamsByQuery">load more streams</a>
            </div>
        </div>
    </div>
</template>

<script>
import {sortArray, groupArrayByField, getDisplayTime} from '../functions.js'
import {searchTopGames, searchGames, searchStreamsByGame, searchStreamsByQuery} from '../twitchApi.js'
export default {
    name: 'twitch',
    data: function() {
        return {
            loading: false,
            lastRefresh: '',
            query: '',
            currentQuery: '',
            searchBy: 'game', // 'game' or 'query'
            games: [],
            currentGame: null,
            streams: [],
        }
    },
    computed: {
        displayGameTitle: function() {
            if (this.searchBy === 'query') {
                return this.currentQuery ? `"${this.currentQuery}"` : 'please enter a query'
            }
            if (this.currentGame) {
                return this.currentGame.name.substring(0, 50)
            }
            return 'top games'
        }
    },
    methods: {
        setSearchBy: function(by) {
            this.searchBy = by
            if (by === 'game') {
                this.getGameItems()
            } else {
                this.getStreamsByQuery()
            }
        },
        setGame: function(game) {
            this.getStreamsByGame(game)
            this.currentGame = game
        },
        displayStreamLogo: function(stream) {
            if (stream.channel.logo) {
                // 50x50 seems to be the minimum. change actual size via css
                return stream.channel.logo.replace('300x300', '50x50')
            }
            return `https://static-cdn.jtvnw.net/jtv_user_pictures/xarth/404_user_50x50.png`
        },
        refresh: function() {
            if (this.searchBy === 'query') {
                return this.getStreamsByQuery()
            }
            if (this.currentGame) {
                this.getStreamsByGame(this.currentGame)
            } else {
                this.getGameItems()
            }
        },
        getGameItems: function() {
            // allow user to load more if we're searching for top games
            // (searching for games by query doesn't have pagination)
            const vm = this
            vm.loading = true
            vm.currentGame = null

            // make api based on whether or not we have a query
            const apiCall = vm.query ? searchGames(vm.query) : searchTopGames()
            apiCall.then(function(games) {
                // format data (we get different data depending on 'searchGames' and 'searchTopGames'
                vm.games = vm.formatGameData(games)
                vm.streams = []
                vm.currentQuery = vm.query
                vm.loading = false
                vm.lastRefresh = getDisplayTime()
                vm.$emit('resizeOverlay')
            })
        },
        getMoreGameItems: function() {
            const vm = this
            vm.loading = true
            searchTopGames(vm.games.length).then(function(games) {
                games = vm.formatGameData(games)
                vm.games = vm.games.concat(games)
                vm.loading = false
            })
        },
        formatGameData: function(games) {
            for (let i=0; i<games.length; i++) {
                // note: popularity = viewers
                // @Link https://discuss.dev.twitch.tv/t/games-top-parameter-popularity/8430/8
                if (games[i].game) {
                    games[i].name = games[i].game.name
                    games[i].popularity = games[i].viewers
                }
            }
            return games
        },
        getStreamsByGame: function(game) {
            const vm = this
            vm.games = []
            vm.loading = true
            searchStreamsByGame(game.name).then(function(data) {
                vm.streams = data
                vm.currentQuery = vm.query
                vm.loading = false
                vm.lastRefresh = getDisplayTime()
                vm.$emit('resizeOverlay')
            })
        },
        getMoreStreamsByGame: function() {
            const vm = this
            vm.loading = true
            searchStreamsByGame(vm.currentGame.name, vm.streams.length).then(function(data) {
                vm.streams = vm.streams.concat(data)
                vm.loading = false
                vm.lastRefresh = getDisplayTime()
                vm.$emit('resizeOverlay')
            })
        },
        getStreamsByQuery: function() {
            const vm = this
            vm.games = []
            if (!vm.query) {
                vm.streams = []
                return
            }
            vm.loading = true
            searchStreamsByQuery(vm.query).then(function(data) {
                vm.streams = data
                vm.currentQuery = vm.query
                vm.loading = false
                vm.lastRefresh = getDisplayTime()
                vm.$emit('resizeOverlay')
            })

        },
        getMoreStreamsByQuery: function() {
            const vm = this
            vm.loading = true
            // calculate next offset
            // we need this to be a multiple of 100 because twitch is bugged when you send a weird offset like 95
            // this turns 95->100, 192->200, 250->300, etc
            const offset = (vm.streams.length+100)-(vm.streams.length%100)
            searchStreamsByQuery(vm.currentQuery, offset).then(function(data) {
                vm.streams = vm.streams.concat(data)
                vm.loading = false
                vm.lastRefresh = getDisplayTime()
                vm.$emit('resizeOverlay')
            })

        }
    }
}
</script>