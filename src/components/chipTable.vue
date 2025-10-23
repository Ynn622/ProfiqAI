<template>
    <div class="chip-table-container">
        <div v-if="tableData && tableData.length > 0" class="table-wrapper">
            <a-table :columns="columns" :data-source="tableData" :pagination="false" 
                size="small" bordered>
                <template #headerCell="{ column }">
                    <span :class="['table-header', column.dataIndex === 'total' ? 'total-header' : '']">
                        {{ column.title }}
                    </span>
                </template>
                <template #bodyCell="{ column, record }">
                    <span v-if="column.dataIndex !== 'date'"
                        :class="[getValueClass(record[column.dataIndex]), column.dataIndex === 'total' ? 'total-value' : '']">
                        {{ formatValue(record[column.dataIndex]) }}
                    </span>
                    <span v-else>{{ record[column.dataIndex] }}</span>
                </template>
            </a-table>
        </div>
        <div v-else-if="loading" class="loading">
            載入中...
        </div>
        <div v-else class="no-data">籌碼表格資料異常，請稍後再試！</div>
    </div>
</template>

<script setup>
import { computed } from 'vue';

// Props
const props = defineProps({
    chipData: { type: Object, default: null },
    segmentValue: { type: String, default: '三大法人' },
    loading: { type: Boolean, default: false }
});

// 數據映射配置
const dataMapping = {
    '三大法人': {
        keys: ['Foreign', 'Dealer', 'Investor', 'Total'],
        labels: ['外資', '投信', '自營商', '總和']
    },
    '主力': {
        keys: ['MainForce'],
        labels: ['主力買賣超'],
    },
    '融資＆融券': {
        keys: ['MarginBuy', 'MarginSell', 'MarginRatio'],
        labels: ['融資買入', '融券賣出', '券資比％']
    }
};

// 計算表格欄位
const columns = computed(() => {
    if (!props.chipData || !dataMapping[props.segmentValue]) {
        return [];
    }

    const config = dataMapping[props.segmentValue];
    const baseColumns = [
        {
            title: '日期',
            dataIndex: 'date',
            key: 'date',
            width: 100,
            fixed: 'left'
        }
    ];

    const dataColumns = config.keys.map((key, index) => ({
        title: config.labels[index],
        dataIndex: key.toLowerCase(),
        key: key.toLowerCase(),
        width: 120,
        align: 'right'
    }));

    return [...baseColumns, ...dataColumns];
});

// 計算表格資料
const tableData = computed(() => {
    if (!props.chipData || !props.chipData.Date || !dataMapping[props.segmentValue]) {
        return [];
    }

    const config = dataMapping[props.segmentValue];
    
    return props.chipData.Date.map((date, index) => {
        const row = {
            key: index,
            date: formatDate(date)
        };

        config.keys.forEach(key => {
            row[key.toLowerCase()] = props.chipData[key] ? props.chipData[key][index] : 0;
        });

        return row;
    }).reverse(); // 最新的資料顯示在前面
});

// 格式化日期
function formatDate(dateString) {
    const date = new Date(dateString);
    return `${date.getFullYear()}/${String(date.getMonth() + 1).padStart(2, '0')}/${String(date.getDate()).padStart(2, '0')}`;
}

// 格式化數值
function formatValue(value) {
    if (value === null || value === undefined) {
        return '-';
    }
    
    const num = Number(value);
    if (isNaN(num)) {
        return '-';
    }
    
    return num.toLocaleString();
}

// 根據數值設定樣式類別
function getValueClass(value) {
    const num = Number(value);
    if (isNaN(num) || num === 0) {
        return 'value-neutral';
    }
    return num > 0 ? 'value-positive' : 'value-negative';
}
</script>

<style scoped>
.chip-table-container {
    width: 100%;
}

.table-wrapper {
    border-radius: 8px;
    overflow: hidden;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    overflow-x: auto;
}

.table-header {
    font-weight: 600;
    color: #1f2937;
}

.total-header {
    color: #7c3aed;
    font-weight: 700;
}

.loading {
    display: flex;
    justify-content: center;
    align-items: center;
    height: 200px;
    color: #6b7280;
    font-size: 14px;
}

.value-positive {
    color: #dc2626;
    font-weight: 500;
}

.value-negative {
    color: #16a34a;
    font-weight: 500;
}

.value-neutral {
    color: #6b7280;
}

.total-value {
    font-weight: 600;
    background-color: #f3f4f6;
    padding: 2px 4px;
    border-radius: 4px;
    border: 1px solid #e5e7eb;
}

:deep(.ant-table) {
    font-size: 13px;
}

:deep(.ant-table-thead > tr > th) {
    background-color: #f8fafc;
    border-bottom: 2px solid #e2e8f0;
    font-weight: 600;
    white-space: nowrap;  /* 防止標題換行 */
}

:deep(.ant-table-tbody > tr:hover > td) {
    background-color: #f1f5f9 !important;
}

:deep(.ant-table-tbody > tr > td) {
    border-bottom: 1px solid #f1f5f9;
}

.no-data {
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100%;
    color: #999;
    font-size: 16px;
}
</style>