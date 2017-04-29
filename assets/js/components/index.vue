
<template>
    <div>
        <img id="menu-button" src="/img/menu.svg" alt="menu" @click="toggleMenu">

        <!-- overlay -->
        <div id="overlay">
            <div id="currently-watching">
                {{ username || '(no stream)' }}
                <a v-show="username" class="action" @click="closeStream()">close</a>
            </div>

            <ul id="navbar" class="nav nav-tabs" role="tablist">
                <li v-for="page in pages" role="presentation" :class="{active: page == currentPage}" @click="setPage(page)">
                    <a :aria-controls="page" role="tab">{{ page }}</a>
                </li>
            </ul>

            <favorites v-show="currentPage == 'favorites'" ref="favorites" v-on:resizeOverlay="resizeOverlay"></favorites>
            <twitch v-show="currentPage == 'twitch'" ref="twitch" v-on:resizeOverlay="resizeOverlay"></twitch>
            <srlive v-show="currentPage == 'srlive'" ref="srlive" v-on:resizeOverlay="resizeOverlay"></srlive>
            <about v-show="currentPage == 'about'" ref="about" v-on:resizeOverlay="resizeOverlay"></about>
        </div>

        <!-- twitch player -->
        <main id="stream-container">
            <div id="stream-iframe-div"></div>
        </main>
    </div>
</template>

<script>
import {setPageTitle, getHistoryItems, updateHistoryItemByUsername} from '../functions.js'
export default {
    name: 'index',
    components: {
        favorites: require('./favorites.vue'),
        twitch: require('./twitch.vue'),
        srlive: require('./srlive.vue'),
        about: require('./about.vue')
    },
    data: function() {
        // determine starting page depending on whether user has favorites or not
        const historyItems = getHistoryItems()
        let startPage = 'twitch'
        for (let i=0; i<historyItems.length; i++) {
            if (historyItems[i].is_favorite) {
                startPage = 'favorites'
                break
            }
        }

        const pages = ['favorites', 'twitch', 'srlive', 'about']
        return {
            $streamIframeDiv: null,
            player: null,
            username: '',
            pages: pages,
            currentPage: startPage
        }
    },
    mounted: function() {
        setPageTitle()
        const vm = this

        // add callback for when user resizes window
        const $overlay = $('#overlay')
        vm.$streamIframeDiv = $('#stream-iframe-div')
        $(window).on('resize', function() {
            if (vm.player) {
                vm.player.setWidth(vm.$streamIframeDiv.width())
                vm.player.setHeight(vm.$streamIframeDiv.height())
            }
            if ($overlay.is(':visible')) {
                vm.resizeOverlay()
            }
        })

        // load stream if we have a username, otherwise show overlay
        if (vm.$route.params.username) {
            vm.viewStream(vm.$route.params.username)
        } else {
            $overlay.fadeIn('fast')
        }

        vm.refreshPage()
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
        },
        currentPage: function(val) {
            this.refreshPage()
        }
    },
    methods: {
        refreshPage: function() {
            const vm = this
            if (vm.$refs[vm.currentPage] && vm.$refs[vm.currentPage].refresh) {
                vm.$refs[vm.currentPage].refresh()
            }
        },
        toggleMenu: function() {
            // hide overlay
            const vm = this
            const $overlay = $('#overlay')
            if ($overlay.is(':visible')) {
                $overlay.fadeOut('fast')
                return
            }

            // show overlay and refresh data
            $overlay.fadeIn('fast', function() {
                vm.resizeOverlay()
            })

            // refresh data in current page
            vm.refreshPage()
        },
        resizeOverlay: function() {
            // resize overlay
            const $overlay = $('#overlay')
            $overlay.height($(window).height() - 150) // this was chosen by randomly testing numbers

            // iterate through pages and calculate new heights for .scroll-list
            for (let i=0; i<this.pages.length; i++) {
                const componentId = `#${this.pages[i]}`
                const $scrollListVisible = $(componentId).find('.scroll-list:visible')
                if ($scrollListVisible.length) {
                    // calculate height based on the currently visible .scroll-list
                    // then make adjustments (via eye-balling ...)
                    let newHeight = $overlay.height() - $scrollListVisible.position().top
                    newHeight += 12

                    // adjust ALL .scroll-list elements in the page
                    $(componentId).find('.scroll-list').css('height', newHeight)
                }
            }
        },
        setPage: function(page) {
            this.currentPage = page
        },
        closeStream: function() {
            this.$router.push('/')
        },
        viewStream: function(username) {
            setPageTitle(username)
            updateHistoryItemByUsername(username)
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