
<template>
    <div>
        <img id="menu-button" src="/img/menu.svg" alt="menu" @click="toggleMenu">
        <div id="stream-list">
            <p id="currently-watching">
                {{ username || '?' }}
                <a v-show="username" class="close-stream" href="javascript:void(0)" @click="closeStream">close</a>
            </p>
            <div>
                view stream (username):
                <form role="form" @submit.prevent="pushStream(newUsername)">
                    <input placeholder="(press enter)" v-model.trim="newUsername">
                </form>
            </div>
            <div>
                last refreshed at [ {{ lastRefresh }} ]
                <a class="refresh" href="javascript:void(0)">refresh</a>
            </div>
            <div><input id="stream-filter" placeholder="filter streams"></div>

            <div id="stream-items"></div>
        </div>

        <main id="stream-container">
            <div id="stream-iframe-div"></div>
        </main>

    </div>
</template>

<script>
import {setPageTitle} from '../functions.js'
export default {
    name: 'index',
    mounted: function() {
        setPageTitle()
        const vm = this

        // add callback for when user resizes window
        vm.$streamIframeDiv = $('#stream-iframe-div')
        $(window).on('resize', function() {
            vm.player.setWidth(vm.$streamIframeDiv.width());
            vm.player.setHeight(vm.$streamIframeDiv.height());
        });

        // load stream
        if (vm.$route.params.username) {
            vm.viewStream(vm.$route.params.username)
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
            newUsername: '',
            lastRefresh: null
        }
    },
    methods: {
        toggleMenu: function() {
            $('#stream-list').fadeToggle('fast');
        },
        pushStream: function(newUsername) {
            // let watch $route handle the stream change
            this.$router.push(`/${newUsername}`)
        },
        closeStream: function() {
            this.$router.push('/')
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