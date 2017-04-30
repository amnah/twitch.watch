
<template>
    <div id="about">
        <div class="scroll-list">
            <h4>config</h4>
            <ul>
                <li><a id="export-data" class="action" download="twitchwatch.json">export data (right-click -> save as)</a></li>
                <li>
                    <a class="action" @click="triggerImport">import data</a>
                    <span v-show="importStatus === true">success!</span>
                    <span v-show="importStatus === false" class="error">invalid data</span>
                    <div class="hiddenfile">
                        <input id="import-input" type="file" @change="importFile">
                    </div>

                </li>
            </ul>
            <h4>ayoyoyo</h4>
            <ul>
                <li>a minimalistic twitch stream viewer</li>
                <li>
                    built in php*, vue.js, and sass<br/>
                    <small class="indented">*php used for rendering html only</small>
                </li>
                <li><a href="https://github.com/amnah/twitch.watch" target="_blank">github</a></li>
            </ul>
        </div>
    </div>
</template>

<script>
import {getLocalStorageData, setLocalStorageData} from '../functions.js'
export default {
    name: 'about',
    data: function() {
        return {
            importStatus: null
        }
    },
    methods: {
        refresh: function() {
            this.importStatus = null

            // export data
            // @link http://stackoverflow.com/questions/19721439/download-json-object-as-a-file-from-browser/30800715#30800715
            const exportData = getLocalStorageData()
            const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(exportData));
            $('#export-data').attr('href', dataStr)
        },
        triggerImport: function() {
            $('#import-input').trigger('click');
        },
        importFile: function(e) {
            const vm = this
            const reader = new FileReader();
            reader.readAsText(e.target.files[0])
            reader.onload = function() {
                if (!confirm('This will overwrite your data - are you sure?!')) {
                    return
                }
                try {
                    setLocalStorageData(JSON.parse(reader.result))
                    vm.refresh()
                    vm.importStatus = true
                } catch (e) {
                    vm.importStatus = false
                }
            };

        }
    }
}
</script>