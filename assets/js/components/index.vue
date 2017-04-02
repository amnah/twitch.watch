
<template>
    <div>
        <img id="menu-button" src="/img/menu.svg" alt="menu" @click="toggleMenu">

        <!-- overlay -->
        <div id="overlay">
            <div id="currently-watching">
                {{ username || '?' }}
                <router-link v-show="username" class="action" to="/">close</router-link>
            </div>
            <div id="view-direct">
                <form role="form" @submit.prevent="pushStream(newUsername)">
                    <input placeholder="(enter twitch username)" v-model.trim="newUsername">
                    <a class="action" href="javascript:void(0)" @click="getStreams">go</a>
                </form>
            </div>

            <speed-runs-live ref="speedRunsLive"></speed-runs-live>
        </div>

        <!-- twitch player -->
        <main id="stream-container">
            <div id="stream-iframe-div"></div>
        </main>
    </div>
</template>

<script>
import {setPageTitle} from '../functions.js'
export default {
    name: 'index',
    components: {
        speedRunsLive: require('./speedRunsLive.vue')
    },
    mounted: function() {
        setPageTitle()
        const vm = this

        // add callback for when user resizes window
        vm.$streamIframeDiv = $('#stream-iframe-div')
        $(window).on('resize', function() {
            if (vm.player) {
                vm.player.setWidth(vm.$streamIframeDiv.width());
                vm.player.setHeight(vm.$streamIframeDiv.height());
            }
        });

        // load stream
        if (vm.$route.params.username) {
            vm.viewStream(vm.$route.params.username)
        } else {
            $('#overlay').show()
        }
    },
    watch: {
        $route: function(newRoute, oldRoute) {
            // watch route to load stream
            if (newRoute.params.username) {
                this.viewStream(newRoute.params.username)
                return
            }

            // or close out - destroy player and update username/title
            if (this.player) {
                this.player.destroy()
                this.player = null
            }
            this.username = ''
            setPageTitle()
        }
    },
    data: function() {
        return {
            $streamIframeDiv: null,
            player: null,
            username: '',
            newUsername: ''
        }
    },
    methods: {
        toggleMenu: function() {
            // update streams from speedRunsLive streams
            // check visibility before fadeToggle()
            const $streamList = $('#overlay');
            if (!$streamList.is(':visible')) {
                this.$refs.speedRunsLive.getStreams()
            }
            $streamList.fadeToggle('fast');
        },
        pushStream: function(newUsername) {
            // let watch $route handle the stream change
            this.$router.push(`/${newUsername}`)
        },
        viewStream: function(username) {
            setPageTitle(username)
            this.username = username

            // set channel or create twitch player
            if (this.player) {
                this.player.setChannel(username)
            } else {
                this.player = new Twitch.Player(this.$streamIframeDiv.attr('id'), {
                    width: this.$streamIframeDiv.width(), // get current height and width to set full screen
                    height: this.$streamIframeDiv.height(),
                    channel: username,
                    //video: 'VIDEO_ID'
                })
            }
        }
    }
}
</script>