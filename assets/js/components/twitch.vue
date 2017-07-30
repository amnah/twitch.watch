
<template>
    <div id="twitch">

        <span class="last-refreshed action pull-right" title="last refreshed at (automatic every 15 minutes)" @click="refresh()">
            {{ loading ? '...' : '' }} {{ lastRefresh }}
            <span class="glyphicon glyphicon-refresh" aria-hidden="true"></span>
        </span>

        <form role="form" @submit.prevent="submitQuery()">
            <input :placeholder="`(search ${searchBy})`" v-model.trim="query">
        </form>

        <div class="sort-by">
            <strong>Search:</strong>
            <a class="action" :class="{active: searchBy == 'game'}" @click="setSearchBy('game')">game</a>
            <a class="action" :class="{active: searchBy == 'query'}" @click="setSearchBy('query')">query</a>
        </div>

        <div class="sort-by">
            <strong>&raquo; {{ displayGameTitle() }}</strong>
        </div>

        <div class="items scroll-list">
            <!-- games -->
            <ul>
                <li v-for="(game, i) in games">
                    <div class="game action viewers" :title="`${game.name} - ${game.popularity} total viewers`" @click="setGame(game)">[{{ game.popularity }}]</div>
                    <div class="game action" :title="`${game.name} - ${game.popularity} total viewers`" @click="setGame(game)">{{ game.name.substring(0, 40) }}</div>
                </li>
            </ul>

            <!-- streams -->
            <ul>
                <li v-for="(stream, i) in streams">
                    <router-link :to="'/' + stream.channel.name" :title="`${stream.channel.name} - ${stream.viewers} viewers \n\n${stream.channel.status}`">
                        <img class="logo" :src="displayStreamLogo(stream)">
                    </router-link>
                    <router-link class="channel" :to="'/' + stream.channel.name" :title="`${stream.channel.name} - ${stream.viewers} viewers \n\n${stream.channel.status}`">
                        [{{ stream.viewers }}] {{ stream.channel.display_name }}
                    </router-link>
                    <br/>
                    <span class="game subgame">{{ stream.game.substring(0, 35) }}</span>
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
    methods: {
        setSearchBy: function(by) {
            this.query = ''
            this.currentQuery = ''
            this.searchBy = by
            if (by === 'game') {
                this.getGameItems()
            } else {
                this.getStreamsByQuery()
            }
        },
        setGame: function(game) {
            // create fake game object if we're passing in a string
            if (!game.name) {
                game = {name: game}
                this.query = ''
                this.currentQuery = ''
            }
            this.getStreamsByGame(game)
            this.searchBy = 'game'
            this.currentGame = game
        },
        displayStreamLogo: function(stream) {
            // show channel logo or blanket 404 if user doesn't have one
            // note: 50x50 seems to be the minimum on twitch's backend (change actual size via css)
            if (stream.channel.logo) {
                return stream.channel.logo.replace('300x300', '50x50')
            }
            return `https://static-cdn.jtvnw.net/jtv_user_pictures/xarth/404_user_50x50.png`
        },
        displayGameTitle: function() {
            if (this.searchBy === 'query') {
                return this.currentQuery ? `query "${this.currentQuery}"` : 'please enter a query'
            }
            if (this.currentGame) {
                return this.currentGame.name.substring(0, 50)
            }
            return this.currentQuery ? `top games "${this.currentQuery}"` : `top games`
        },
        cleanup: function() {
            this.loading = false
            this.lastRefresh = getDisplayTime()
            this.$emit('resizeOverlay')
        },
        submitQuery: function() {
            this.currentGame = null
            this.refresh()
        },
        refresh: function() {
            if (this.searchBy === 'query') {
                return this.getStreamsByQuery()
            } else if (this.currentGame) {
                return this.getStreamsByGame(this.currentGame)
            } else {
                return this.getGameItems()
            }
        },
        getGameItems: function() {
            // allow user to load more if we're searching for top games
            // (searching for games by query doesn't have pagination)
            const vm = this
            vm.streams = []
            vm.currentGame = null
            vm.loading = true

            // make api based on whether or not we have a query
            const apiCall = vm.query ? searchGames(vm.query) : searchTopGames()
            apiCall.then(function(games) {
                // get streams directly if there is only one game
                if (games.length === 1) {
                    vm.currentGame = games[0]
                    return vm.getStreamsByGame(vm.currentGame)
                }

                // format data (we get different data depending on 'searchGames' and 'searchTopGames'
                vm.games = vm.formatGameData(games)
                vm.currentQuery = vm.query
                vm.cleanup()
            })
        },
        getMoreGameItems: function() {
            const vm = this
            vm.loading = true
            searchTopGames(vm.games.length).then(function(games) {
                games = vm.formatGameData(games)
                vm.games = vm.games.concat(games)
                vm.cleanup()
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
                vm.cleanup()
            })
        },
        getMoreStreamsByGame: function() {
            const vm = this
            vm.loading = true
            searchStreamsByGame(vm.currentGame.name, vm.streams.length).then(function(data) {
                vm.streams = vm.streams.concat(data)
                vm.cleanup()
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
                vm.cleanup()
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
                vm.cleanup()
            })

        }
    }
}
</script>