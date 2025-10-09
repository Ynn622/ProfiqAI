<template>
    <div class="square-data-button" :class="color">
        <div class="title-area">
            <span class="title">{{ title }}</span>
        </div>
        <div class="value-area">
            <span class="value">{{ formatValue(value) }}{{ valueSuffix }}</span>
            <span class="change" v-if="change!=0">{{ trend }}{{ change }}<span v-html="changeIcon"></span></span>
        </div>
    </div>
</template>

<script setup>
import { ref, computed } from 'vue';

const props = defineProps({
    title: { 
        type: String, 
        default: '' 
    },
    value: { 
        type: [String, Number],
        default: '' 
    },
    valueSuffix: { 
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
const trend = computed(() => (props.change > 0 ? '+' : ''))
const changeIcon = computed(() => {
    if (props.change > 0) return '<i class="fa-solid fa-arrow-trend-up"></i>'
    if (props.change < 0) return '<i class="fa-solid fa-arrow-trend-down"></i>'
    return ''
})

function formatValue(val) {
    if (val === null || val === undefined) return ''
    return `${val}`
}

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
    font-weight: 700;
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
.bg-gray {
    background-color: var(--gray);
}

@media (max-width: 480px) {
    .square-data-button {
        width: 150px;
        padding: 8px 16px;
    }
    .title {
        font-size: 24px;
    }
    .value {
        font-size: 20px;
    }
    .change {
        font-size: 16px;
    }
}
</style>