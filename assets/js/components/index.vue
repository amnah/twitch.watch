
<template>
    <div>
        <img id="menu-button" src="/img/menu.svg" alt="menu" @click="toggleMenu">
        <div id="stream-list">
            <p id="currently-watching">{{ username || '?' }}</p>
            <div>
                View stream (username):
                <form role="form" @submit.prevent="pushStream(newUsername)">
                    <input placeholder="(press enter)" v-model.trim="newUsername">
                    <a class="close" href="javascript:void(0)">close</a>
                </form>
            </div>
            <!--
            <div id="stream-refresh">Last refreshed at [ <span></span> ] <a class="refresh" href="javascript:void(0)">refresh</a></div>
            <div><input id="stream-filter" placeholder="filter streams"></div>

            <div id="stream-items"></div>
            -->
        </div>

        <main id="stream-container">
            <div id="stream-iframe"></div>
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
        vm.$streamIframe = $('#stream-iframe')

        // add callback for when user resizes window
        $(window).on('resize', function() {
            vm.player.setWidth(vm.$streamIframe.width());
            vm.player.setHeight(vm.$streamIframe.height());
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
            }
        }
    },
    data: function() {
        return {
            player: null,
            $streamIframe: null,
            username: '',
            newUsername: '',
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
        viewStream: function(username) {
            // create twitch player
            if (!this.player) {
                // get current height and width to set full screen
                const options = {
                    width: this.$streamIframe.width(),
                    height: this.$streamIframe.height(),
                    channel: username,
                    //video: 'VIDEO_ID'
                };
                this.player = new Twitch.Player(this.$streamIframe.attr('id'), options);
            }
            this.player.setChannel(username)
            this.username = username
            setPageTitle(username)
        }
    }
}
</script>