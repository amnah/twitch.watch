
<template>
    <div id="twitch">

        <span class="last-refreshed action pull-right" title="last refreshed at" @click="getGameItems()">
            {{ loading ? '...' : '' }} {{ lastRefresh }}
            <span class="glyphicon glyphicon-refresh" aria-hidden="true"></span>
        </span>

        <form role="form" @submit.prevent="getGameItems()">
            <input placeholder="(search game)" v-model.trim="gameQuery">
        </form>

        <div class="items scroll-list">
            <div class="game" v-for="(game, i) in games">
                <span class="game-viewers">[{{ game.popularity }}]</span>
                <div class="indented">{{ game.name }}</div>
            </div>
            <div class="text-center" v-if="allowLoadMore">
                <a class="action" @click="getMoreGameItems">load more</a>
            </div>
        </div>
    </div>
</template>

<script>
import {sortArray, groupArrayByField, getDisplayTime} from '../functions.js'
import {searchTopGames, searchGames} from '../twitchApi.js'
export default {
    name: 'twitch',
    data: function() {
        return {
            loading: false,
            lastRefresh: '',
            gameQuery: '',
            allowLoadMore: false,
            games: [],
        }
    },
    methods: {
        refresh: function() {
            this.getGameItems()
        },
        getGameItems: function() {
            // allow user to load more if we're searching for top games
            // (searching for games by query doesn't have pagination)
            const vm = this
            vm.allowLoadMore = vm.gameQuery ? false : true

            // make api based on whether or not we have a gameQuery
            const apiCall = vm.gameQuery ? searchGames(vm.gameQuery) : searchTopGames()
            apiCall.then(function(games) {
                // format data (we get different data depending on 'searchGames' and 'searchTopGames'
                vm.games = vm.formatGameData(games)
                vm.loading = false
                vm.lastRefresh = getDisplayTime()
                vm.$emit('resizeOverlay')
            })
        },
        formatGameData: function(games) {
            for (let i=0; i<games.length; i++) {
                if (games[i].game) {
                    games[i].name = games[i].game.name
                    games[i].popularity = games[i].viewers
                }
            }
            return games
        },
        getMoreGameItems: function() {
            const vm = this
            searchTopGames(this.games.length).then(function(games) {
                games = vm.formatGameData(games)
                vm.games = vm.games.concat(games)
            })
        }
    }
}
</script>