
<template>
    <div>
        <img id="menu-button" src="/img/menu.svg" alt="menu" @click="toggleMenu">

        <!-- overlay -->
        <div id="overlay">
            <div id="currently-watching">
                {{ username || '(no stream)' }}
                <a v-show="username" class="action" href="javascript:void(0)" @click="closeStream()">close</a>
            </div>
            <div id="view-direct">
                <select id="change-page" class="pull-right" title="change page" v-model="page">
                    <option value="srlive">srlive</option>
                    <option value="twitch">twitch</option>
                    <option value="history">history</option>
                    <option value="faq">faq</option>
                </select>
                <form role="form" @submit.prevent="pushStream()">
                    <input placeholder="(twitch username)" v-model.trim="newUsername">
                    <a class="action" href="javascript:void(0)" @click="pushStream()">go</a>
                </form>
            </div>

            <speed-runs-live v-if="page == 'srlive'" ref="speedRunsLive"></speed-runs-live>
            <faq v-if="page == 'faq'" ref="faq"></faq>
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
        speedRunsLive: require('./speedRunsLive.vue'),
        faq: require('./faq.vue')
    },
    mounted: function() {
        setPageTitle()
        const vm = this

        // add callback for when user resizes window
        vm.$overlay = $('#overlay')
        vm.$streamIframeDiv = $('#stream-iframe-div')
        $(window).on('resize', function() {
            if (vm.player) {
                vm.player.setWidth(vm.$streamIframeDiv.width())
                vm.player.setHeight(vm.$streamIframeDiv.height())
            }
            if (vm.$overlay.is(':visible')) {
                vm.resizeOverlay()
            }
        })

        // load stream if we have a username, otherwise show overlay
        if (vm.$route.params.username) {
            vm.viewStream(vm.$route.params.username)
        } else {
            vm.$overlay.fadeIn('fast', function() {
                vm.resizeOverlay()
            })
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
            $overlay: null,
            $streamIframeDiv: null,
            player: null,
            username: '',
            newUsername: '',
            page: 'srlive'
        }
    },
    methods: {
        toggleMenu: function() {
            // update streams from speedRunsLive streams
            // check visibility before fading
            const vm = this
            if (vm.$overlay.is(':visible')) {
                vm.$overlay.fadeOut('fast')
            } else {
                vm.$refs.speedRunsLive.getStreams()
                vm.$overlay.fadeIn('fast', function() {
                    vm.resizeOverlay()
                })
            }
        },
        resizeOverlay: function() {
            // resize overlay
            const vm = this
            vm.$overlay.height($(window).height() - 150) // this was chosen by randomly testing numbers

            // resize scroll list
            // @link http://stackoverflow.com/questions/13075920/add-css-rule-via-jquery-for-future-created-elements/34293036#34293036
            const $streamList = $('.scroll-list')
            if ($streamList.length) {
                let newHeight = vm.$overlay.height() - $streamList.position().top
                newHeight += 10 // add 10 to fill in a bit more
                $('#force-style').html(`.scroll-list {height: ${newHeight}px !important;}`)
            }
        },
        closeStream: function() {
            this.$router.push('/')
        },
        pushStream: function() {
            // do nothing if username is empty
            // (user must click the 'close' button to close the stream)
            if (!this.newUsername) {
                return
            }

            // let watch $route handle the stream change
            this.$router.push(`/${this.newUsername}`)
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