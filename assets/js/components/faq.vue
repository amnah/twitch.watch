
<template>
    <div id="faq">
        <h4>faq</h4>
        <ul>
            <li>a minimalistic twitch stream viewer</li>
            <li>
                built in php*, vue.js, and sass<br/>
                <small class="indented">*php used for rendering html only</small>
            </li>
            <li><a href="https://github.com/amnah/twitch.watch">github</a></li>
        </ul>
    </div>
</template>

<script>
import {getTime, sortArray, prepStringForCompare} from '../functions.js'
export default {
    name: 'faq',
}
</script>