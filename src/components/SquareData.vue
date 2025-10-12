<template>
    <div class="square-data-button" :class="color">
        <div class="title-area">
            <span class="title">{{ title }}</span>
        </div>
        <div class="value-area">
            <span class="value">{{ valuePrefix }}{{ formatValue(value) }}{{ valueSuffix }}</span>
            <span class="change" v-if="change!=0">{{ trend }}{{ change }}<span v-html="changeIcon"></span></span>
        </div>
    </div>
</template>

<script setup>
// 工具 & 套件
import { ref, computed } from 'vue';

// Props
const props = defineProps({
    title: { 
        type: String, 
        default: '' 
    },
    value: { 
        type: [String, Number],
        default: '' 
    },
    valuePrefix: { 
        type: String, 
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
    transition: box-shadow 0.3s ease-in-out,
                background-color 0.3s ease-in-out;
    box-shadow: var(--shadow-small);
}
.square-data-button:hover {
    box-shadow: var(--shadow-small-hover);
}
/* ==============================
   股市配色（多空顏色系）
   ============================== */

/* 多方：紅色 */
.bg-dark-red { background-color: var(--darkBull); }
.bg-dark-red:hover { background-color: var(--darkBull-hover); }

.bg-red { background-color: var(--lightBull); }
.bg-red:hover { background-color: var(--lightBull-hover); }

/* 空方：綠色 */
.bg-green { background-color: var(--lightBear); }
.bg-green:hover { background-color: var(--lightBear-hover); }

.bg-dark-green { background-color: var(--darkBear); }
.bg-dark-green:hover { background-color: var(--darkBear-hover); }

/* 盤整：黃色 */
.bg-yellow { background-color: var(--lightFlat); }
.bg-yellow:hover { background-color: var(--lightFlat-hover); }

/* 中性：灰色 */
.bg-gray { background-color: var(--gray); }
.bg-gray:hover { background-color: var(--gray-hover); }

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