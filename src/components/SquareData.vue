<template>
    <div class="square-data-button" :class="color">
        <div class="title-area">
            <span class="title">{{ title }}</span>
        </div>
        <div class="value-area">
            <span class="value">{{ value }}</span>
            <span class="change" v-if="change!=0">{{ changeWay }}{{ change }}<span v-html="changeIcon"></span></span>
        </div>
    </div>
</template>

<script setup>
import { ref } from 'vue';

const props = defineProps({
    title: { 
        type: String, 
        default: '' 
    },
    value: { 
        type: String, 
        default: '' 
    },
    change: { 
        type: Number, 
        default: 0
    },
    color: { 
        type: String, 
        default: ''
    }
});
var changeWay = props.change >= 0 ? '+' : '-';
var changeIcon = props.change >= 0 ? '<i class="fa-solid fa-arrow-trend-up"></i>' : '<i class="fa-solid fa-arrow-trend-down"></i>';

</script>

<style scoped>
.square-data-button {
    background-color: var(--lightBull);
    border-radius: 8px;
    padding: 10px 20px;
    width: 200px;
}

.value-area {
    display: flex;
    flex-direction: row;
    align-items: baseline;
    justify-content: space-between;
}

.title {
    font-weight: 700;
    font-size: 30px;
}

.value {
    font-weight: 900;
    font-size: 24px;
}

.change {
    font-weight: 600;
    font-size: 18px;
}

.bg-red {
    background-color: var(--lightBull);
}
.bg-green {
    background-color: var(--lightBear);
}
.bg-yellow {
    background-color: var(--lightFlat);
}
</style>