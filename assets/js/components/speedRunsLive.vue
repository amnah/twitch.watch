
<template>
    <div id="speedrunslive">
        <input id="speedrunslive-filter" placeholder="(enter filter)" v-model="filter">
        <a class="action" href="javascript:void(0)" @click="getStreams">refresh</a>
        <strong>{{ lastRefresh }}</strong>


        <div id="stream-items">
            <div v-for="(channels, game) in channelsByGame">
                <h4 v-show="showGame(game)">{{ game || '(No game set)' }}</h4>
                <ul>
                    <li v-show="showChannel(channel)" v-for="(channel, game) in channels">
                        <router-link class="stream-item" :to="getChannelLink(channel)">
                            [{{ channel.current_viewers }}] {{ channel.display_name }}
                        </router-link>
                    </li>
                </ul>
            </div>
        </div>
    </div>
</template>

<script>
import {getTime, checkSubstring} from '../functions.js'
export default {
    name: 'speedRunsLive',
    mounted: function() {
        this.getStreams()
    },
    data: function() {
        return {
            lastRefresh: null,
            filter: '',
            channelsByGame: []
        }
    },
    methods: {
        showGame: function(game) {
            return checkSubstring(this.filter, game)
        },
        showChannel: function(channel) {
            const haystack = channel.display_name + channel.meta_game + channel.name + channel.title + channel.user_name
            return checkSubstring(this.filter, haystack)
        },
        getChannelLink: function(channel) {
            return `/${channel.name}`
        },
        focusFilter: function() {
            $('#speedrunslive-filter').focus()
        },
        getStreams: function() {
            const vm = this
            $.ajax({
                url: 'https://api.speedrunslive.com/frontend/streams'
            }).then(function(data) {
                vm.lastRefresh = getTime();
                vm.channelsByGame = vm.sortChannelsByGame(data._source.channels)
                vm.focusFilter()
            })
        },
        sortChannelsByGame: function(channels) {
            // sort channels by game
            const vm = this
            let channelsByGame = {};
            channels = vm.sortArray(channels, 'meta_game');
            $.each(channels, function(i, channel) {
                channelsByGame[channel.meta_game] = channelsByGame[channel.meta_game] || [];
                channelsByGame[channel.meta_game].push(channel);
            });

            // then sort channels by viewers desc
            $.each(channelsByGame, function(game, gameChannels) {
                gameChannels = vm.sortArray(gameChannels, 'current_viewers')
                gameChannels = gameChannels.reverse()
                channelsByGame[game] = gameChannels
            });

            return channelsByGame
        },
        sortArray: function(array, field) {
            // http://stackoverflow.com/questions/1069666/sorting-javascript-object-by-property-value/19326174#19326174
            // use slice() to copy the array and not just make a reference
            let copyArray = array.slice(0);
            copyArray.sort(function(a, b) {
                // compare string
                if (a[field].toLowerCase) {
                    const x = a[field].toLowerCase();
                    const y = b[field].toLowerCase();
                    return x < y ? -1 : x > y ? 1 : 0;
                }
                // compare number
                return a[field] - b[field];
            });
            return copyArray;
        }
    }
}
</script>